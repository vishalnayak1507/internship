import cron from "node-cron";
import Ticket from "../models/Ticket.js";
import TicketDiscussion from "../models/TicketDiscussion.js";
import { io } from "../index.js";
import { TICKET_CONFIG } from "../constants.js";

// Runs twice a day at midnight and noon
cron.schedule("0 0,12 * * *", async () => {
    try {
        const thresholdDays = TICKET_CONFIG.AUTO_CLOSE_THRESHOLD_DAYS;
        // console.log(`[AUTO-CLOSE CRON] Running automatic ticket closure check (threshold: ${thresholdDays} days)`);
        
        // Calculate date threshold based on configured value
        const thresholdDate = new Date();
        thresholdDate.setDate(thresholdDate.getDate() - thresholdDays);
        
        // Find resolved tickets older than threshold
        const ticketsToClose = await Ticket.find({
            status: "Resolved",
            lastModifiedAt: { $lt: thresholdDate }
        });
        
        console.log(`[AUTO-CLOSE CRON] Found ${ticketsToClose.length} tickets to auto-close`);
        
        // Process each ticket
        for (const ticket of ticketsToClose) {
            console.log(`[AUTO-CLOSE CRON] Auto-closing ticket: ${ticket.ticketNumber}`);
            
            // Update ticket status
            await Ticket.findByIdAndUpdate(
                ticket._id,
                { 
                    status: "Closed",
                    lastModifiedAt: new Date()
                }
            );
            
            // Add system note to ticket discussion
            await TicketDiscussion.findOneAndUpdate(
                { ticketNumber: ticket.ticketNumber },
                {
                    $push: {
                        remarks: {
                            isCustomerDetail: false,
                            userDetail: null,
                            message: `Ticket auto-closed after ${thresholdDays} days in resolved state.`,
                            autoClosedTime: new Date()
                        }
                    }
                }
            );
            
            // Emit socket event for real-time updates
            io.emit("ticketClosed", ticket._id);
        }
        
        console.log(`[AUTO-CLOSE CRON] Successfully closed ${ticketsToClose.length} tickets`);
    } catch (error) {
        console.error("[AUTO-CLOSE CRON] Error in auto-close cron job:", error);
    }
});

console.log("[AUTO-CLOSE CRON] Auto-close ticket service initialized");