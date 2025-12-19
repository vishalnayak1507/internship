import { Worker } from "bullmq";
import IORedis from "ioredis";
import User from "../models/User.js";
import Ticket from "../models/Ticket.js";
import { io } from "../index.js";
import mongoose from "mongoose";

class NoAnalystAvailableError extends Error {
    constructor(message) {
        super(message);
        this.name = "NoAnalystAvailableError";
    }
}

const connection = new IORedis({
    host: '127.0.0.1',
    port: 6379,
    maxRetriesPerRequest: null
});

const MAX_IN_PROGRESS = 10;

const getAnalystDeadlineMap = async (analysts) => {
    const map = {};
    await Promise.all(
        analysts.map(async ({ _id: analystId, userId, InProgressTickets }) => {
            const priorities = ["P1", "P2", "P3"];
            let foundTicket = null;
            for (const priority of priorities) {
                foundTicket = await Ticket.findOne({
                    assignedTo: analystId,
                    status: { $in: ["In Progress"] },
                    priority
                })
                    .sort({ slaDeadline: 1 })
                    .select("_id slaDeadline priority")
                    .lean();
                if (foundTicket) break;
            }
            map[analystId] = foundTicket || null;
        })
    );
    return map;
};

const assignTicketToAnalyst = async (ticketId, analystId) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        // Atomically increment InProgressTickets if eligible
        const analyst = await User.findOneAndUpdate(
            { _id: analystId, InProgressTickets: { $lt: MAX_IN_PROGRESS } },
            { $inc: { InProgressTickets: 1 } },
            { new: true, session }
        ).lean();

        if (!analyst) {
            await session.abortTransaction();
            session.endSession();
            return false;
        }

        // Assign the ticket within the same transaction
        const assignedTicket = await Ticket.findByIdAndUpdate(
            ticketId,
            { assignedTo: analystId, status: "In Progress" },
            { new: true, session }
        ).lean();

        await session.commitTransaction();
        session.endSession();

        io.to(`analyst-${analystId}`).emit("ticketAssigned", {
            ticket: assignedTicket,
            message: "A ticket has been auto-assigned to you"
        });

        console.log(`[Worker] Ticket ${ticketId} assigned to analyst ${analystId}`);
        return true;
    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        throw error;
    }
};

const worker = new Worker(
    "auto-assign",
    async (job) => {
        try {
            const { ticketId, department } = job.data;
            console.log(`[Worker] Processing job for ticketId: ${ticketId}, department: ${department}`);

            // Find eligible analysts
            const activeAnalysts = await User.find({
                department,
                role: "analyst",
                isActive: true,
                InProgressTickets: { $lt: MAX_IN_PROGRESS }
            })
                .select("_id userId InProgressTickets")
                .lean();

            if (activeAnalysts.length === 0) {
                console.log(`[Worker] No active or free analysts found in department: ${department}`);
                throw new NoAnalystAvailableError(`No active or free analysts found in department: ${department}`);
            }

            // Build deadline map for prioritization
            const analystDeadlineMap = await getAnalystDeadlineMap(activeAnalysts);

            // Find free analysts (no in-progress tickets)
            const freeAnalysts = Object.entries(analystDeadlineMap)
                .filter(([_, deadline]) => deadline === null)
                .map(([analystId]) => analystId);

            // Try to assign to a free analyst
            if (freeAnalysts.length > 0) {
                const ticket = await Ticket.findById(ticketId).select("assignedTo status").lean();
                if (!ticket) throw new Error(`[Worker] Ticket not found for ticketId: ${ticketId}`);
                if (!ticket.assignedTo) {
                    const randomAnalystId = freeAnalysts[Math.floor(Math.random() * freeAnalysts.length)];
                    const assigned = await assignTicketToAnalyst(ticketId, randomAnalystId);
                    if (!assigned) {
                        console.log(`[Worker] Analyst ${randomAnalystId} not found or already has too many tickets`);
                    }
                } else {
                    console.log(`[Worker] Ticket ${ticketId} is already assigned to an analyst`);
                }
                return;
            }

            // Fallback: assign based on priority and SLA
            const analystArray = Object.entries(analystDeadlineMap).map(([analystId, ticket]) => ({
                analystId,
                priority: ticket ? ticket.priority : null,
                slaDeadline: ticket ? ticket.slaDeadline : null
            }));

            // Sort: lowest priority first, then latest SLA
            const priorityOrder = { P1: 3, P2: 2, P3: 1 };
            analystArray.sort((a, b) => {
                if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
                    return priorityOrder[a.priority] - priorityOrder[b.priority];
                }
                return new Date(b.slaDeadline) - new Date(a.slaDeadline);
            });

            const bestAnalystId = analystArray.length > 0 ? analystArray[0].analystId : null;
            if (bestAnalystId) {
                const ticket = await Ticket.findById(ticketId).select("assignedTo status").lean();
                if (!ticket) throw new Error(`[Worker] Ticket not found for ticketId: ${ticketId}`);
                if (!ticket.assignedTo) {
                    const assigned = await assignTicketToAnalyst(ticketId, bestAnalystId);
                    if (!assigned) {
                        console.log(`[Worker] Analyst ${bestAnalystId} not found or already has too many tickets`);
                    }
                } else {
                    console.log(`[Worker] Ticket ${ticketId} is already assigned to an analyst`);
                }
            } else {
                console.log(`[Worker] No suitable analyst found for ticket ${ticketId}`);
            }
        } catch (error) {
            console.error(`[Worker] Error processing job for ticket ${job.data.ticketId}:`, error);
            if (error instanceof NoAnalystAvailableError) {
                throw error;
            } else if (
                error.name === "MongoNetworkError" ||
                error.name === "MongoServerError" ||
                error.name === "MongooseError" ||
                error.name === "MongoError"
            ) {
                throw new Error("Database connection error");
            } else if (error.message && error.message.includes("not found")) {
                console.error(`[Worker] Permanent data error`, error.message);
                return;
            } else {
                // unknown error let bullmq handle it
                throw error;
            }
        }
    },
    {
        connection,
        concurrency: 1,
        autorun: true,
        limiter: {
            max: 5,
            duration: 1000
        }
    }
);

worker.on("failed", async (job, err) => {
    console.error(
        `[Worker][Failed] Job ${job.id} for ticket ${job.data.ticketId} failed after ${job.attemptsMade} attempts:`,
        err
    );
});