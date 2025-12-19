import cron from "node-cron";
import Ticket from "../models/Ticket.js";

cron.schedule("*/1 * * * *", async () => {
    const now = new Date();
    const statusFilter = {status : {$in : ["Open","In Progress"]}};
    const breachResult = await Ticket.updateMany(
        { slaDeadline: { $lt: now }, slaStatusFlag: false, ...statusFilter },
        { $set: { slaStatusFlag: true } }
    );
    const resetResult = await Ticket.updateMany(
        { slaDeadline: { $gt: now }, slaStatusFlag: true },
        { $set: { slaStatusFlag: false } }
    );
    // console.log(`[CRON] ${new Date().toLocaleString()} - SLA breach updated:`, 
    //     `Breached set: ${breachResult.modifiedCount}, Reset: ${resetResult.modifiedCount}`);
});