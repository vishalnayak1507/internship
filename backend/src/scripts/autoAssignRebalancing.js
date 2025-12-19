import User from "../models/User.js";
import Ticket from "../models/Ticket.js";
import Redis from "ioredis";
import mongoose from "mongoose";

const redis = new Redis();

// Helper: count open tickets by department
async function getOpenCountByDepartment(department) {
    return Ticket.countDocuments({
        status: "Open",
        department: department
    });
}

// Helper: get weighted load for an analyst
async function getAnalystWeightedLoad(analystId, session = null) {
    const priorities = [
        { priority: "P1", weight: 3 },
        { priority: "P2", weight: 2 },
        { priority: "P3", weight: 1 }
    ];
    let load = 0;
    for (const { priority, weight } of priorities) {
        const count = await Ticket.countDocuments({
            assignedTo: analystId,
            status: "In Progress",
            priority
        }).session(session || undefined);
        load += count * weight;
    }
    return load;
}

async function acquireLock(key, ttl = 10000) {
    const result = await redis.set(key, "locked", "NX", "PX", ttl);
    if (result === "OK") {
        console.log(`[Lock] Acquired lock for key: ${key}`);
    } else {
        console.log(`[Lock] Could not acquire lock for key: ${key} (already locked)`);
    }
    return result === "OK";
}

async function releaseLock(key) {
    await redis.del(key);
    console.log(`[Lock] Released lock for key: ${key}`);
}

async function autoAssignRebalancing(newAnalyst) {
    const department = newAnalyst.department;
    const lockKey = `rebalance_lock_${department}`;
    if (!(await acquireLock(lockKey, 10000))) {
        console.log(`[Rebalance] Skipping rebalance for ${department}, lock is held.`);
        return;
    }
    try {
        console.log(`[Rebalance] Starting rebalance for new analyst ${newAnalyst._id} in department ${department}`);
        const analysts = await User.find({
            department,
            role: 'analyst',
            isActive: true,
            _id: { $ne: newAnalyst._id },
        }).select("_id").lean();
        if (analysts.length === 0) {
            console.log(`[Rebalance] No other analysts found in department ${department}.`);
            return;
        }

        // Calculate weighted loads
        const analystLoads = [];
        let totalWeightedLoad = 0;
        for (const analyst of analysts) {
            const load = await getAnalystWeightedLoad(analyst._id);
            analystLoads.push({ ...analyst, weightedLoad: load });
            totalWeightedLoad += load;
        }
        const newAnalystLoad = await getAnalystWeightedLoad(newAnalyst._id);
        const avgWeightedLoad = Math.floor(totalWeightedLoad / analysts.length);

        if (newAnalystLoad >= avgWeightedLoad) {
            console.log(`[Rebalance] New analyst ${newAnalyst._id} already has >= average weighted load (${avgWeightedLoad}).`);
            return;
        }

        // Sort donors by weighted load descending
        analystLoads.sort((a, b) => b.weightedLoad - a.weightedLoad);
        let needed = avgWeightedLoad - newAnalystLoad;
        let totalTransferred = 0;

        const priorities = [
            { priority: "P1", weight: 3 },
            { priority: "P2", weight: 2 },
            { priority: "P3", weight: 1 }
        ];

        for (const { priority, weight } of priorities) {
            if (needed <= 0) break;
            for (const donor of analystLoads) {
                if (needed <= 0 || donor.weightedLoad < weight) continue;
                const session = await mongoose.startSession();
                try {
                    session.startTransaction();

                    // Find a ticket that is still assigned to donor, in progress, and with the right priority
                    const ticket = await Ticket.findOneAndUpdate(
                        { assignedTo: donor._id, status: "In Progress", priority },
                        { assignedTo: newAnalyst._id, status: "In Progress" },
                        { new: true, session }
                    ).select("_id assignedTo").lean();

                    if (ticket) {
                        // Update donor and newAnalyst ticket counts atomically
                        await User.findByIdAndUpdate(donor._id, {
                            $inc: { InProgressTickets: -1 }
                        }, { new: true, session });
                        await User.findByIdAndUpdate(newAnalyst._id, {
                            $inc: { InProgressTickets: 1 }
                        }, { new: true, session });

                        donor.weightedLoad -= weight;
                        needed -= weight;
                        totalTransferred++;
                        await session.commitTransaction();
                        console.log(`[Rebalance] Transferred ticket ${ticket._id} (${priority}) from analyst ${donor._id} to new analyst ${newAnalyst._id}`);
                    } else {
                        await session.abortTransaction();
                    }
                } catch (err) {
                    await session.abortTransaction();
                    console.error(`[Rebalance][Error] Failed to transfer ticket for priority ${priority} from analyst ${donor._id} to new analyst ${newAnalyst._id}:`, err);
                } finally {
                    session.endSession();
                }
            }
        }
        console.log(`[Rebalance] Completed for new analyst ${newAnalyst._id} in department ${department}. Total tickets transferred: ${totalTransferred}`);
    } catch (err) {
        console.error(`[Rebalance][Error] Unexpected error during rebalance for analyst ${newAnalyst._id}:`, err);
    } finally {
        await releaseLock(lockKey);
    }
}

export async function watchNewAnalysts() {
    const pipeline = [
        {
            $match: {
                operationType: { $in: ['insert', 'update'] },
                'fullDocument.role': 'analyst',
                'fullDocument.isActive': true,
            }
        }
    ];
    const changeStream = User.watch(pipeline, { fullDocument: 'updateLookup' });

    changeStream.on('change', async (change) => {
        const newAnalyst = change.fullDocument;
        if (!newAnalyst) return;
        try {
            const openCount = await getOpenCountByDepartment(newAnalyst.department);
            if (openCount === 0) {
                console.log(`[ChangeStream] Triggering rebalance for new analyst ${newAnalyst._id} in department ${newAnalyst.department}`);
                await autoAssignRebalancing(newAnalyst);
            } else {
                console.log(`[ChangeStream] Skipping rebalance: there are ${openCount} open tickets in the queue for department ${newAnalyst.department}.`);
            }
        } catch (err) {
            console.error(`[ChangeStream][Error] Error handling change event for analyst ${newAnalyst._id}:`, err);
        }
    });
    console.log("watching for new analysts...");
}