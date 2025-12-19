import Ticket from '../../models/Ticket.js';
import TicketDiscussion from '../../models/TicketDiscussion.js';
import User from '../../models/User.js';

// Get full discussion history for a ticket
export const getTicketDiscussionHistory = async (req, res) => {
    try {
        const { ticketNumber } = req.params;

        // Debugging: Log the incoming request
        console.log('Incoming request to getTicketDiscussionHistory');
        console.log('Ticket Number:', ticketNumber);

        const ticket = await Ticket.findOne({ ticketNumber }).lean();
        if (!ticket) {
            console.log('Ticket not found:', ticketNumber);
            return res.status(404).json({ success: false, message: 'Ticket not found' });
        }

        // Debugging: Log ticket details
        console.log('Ticket found:', ticket);

        const discussion = await TicketDiscussion.findOne({ ticketNumber })
            .populate('remarks.userDetail', 'name email department avatar')
            .lean();

        if (!discussion) {
            console.log('No discussion found for ticket:', ticketNumber);
            return res.status(200).json({ 
                success: true, 
                message: 'No discussion found',
                data: { ticketNumber, history: [] }
            });
        }

        // Debugging: Log discussion details
        console.log('Discussion found:', discussion);

        const history = discussion.remarks.map(r => {
            if (r.isCustomerDetail) {
                console.log('Customer remark:', r);
            } else {
                console.log('Analyst remark:', r);
            }
            return r;
        });

        return res.status(200).json({
            success: true,
            message: 'Discussion history fetched',
            data: { ticketNumber, history }
        });
    } catch (error) {
        console.error('Error fetching discussion history:', error);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
};

// Add a reply (customer or analyst) to a ticket discussion
export const addTicketDiscussionReply = async (req, res) => {
    try {
        const { ticketNumber } = req.params;
        const { message, isCustomer } = req.body; // isCustomer: true/false
        const userId = req.user?._id;

        if (!message || !message.trim()) {
            return res.status(400).json({ success: false, message: 'Message is required' });
        }

        const ticket = await Ticket.findOne({ ticketNumber });
        if (!ticket) {
            return res.status(404).json({ success: false, message: 'Ticket not found' });
        }

        let discussion = await TicketDiscussion.findOne({ ticketNumber });

        // Create remark object based on the user type
        const remark = isCustomer
            ? {
                isCustomerDetail: true,
                message,
              }
            : {
                isCustomerDetail: false,
                userDetail: userId, // Make sure userId exists here
                message,
              };

        if (discussion) {
            discussion.remarks.push(remark);
            await discussion.save();
            
            // Update lastModifiedAt in the ticket
            await Ticket.findOneAndUpdate(
                { ticketNumber },
                { lastModifiedAt: new Date() }
            );
        }

        // After adding the reply, re-fetch the updated discussion with populated userDetail
        const updatedDiscussion = await TicketDiscussion.findOne({ ticketNumber })
            .populate('remarks.userDetail', 'name email department avatar')
            .lean();
        
        return res.status(200).json({ 
            success: true, 
            message: 'Reply added',
            data: updatedDiscussion // Return updated discussion for immediate UI update
        });
    } catch (error) {
        console.error('Error adding discussion reply:', error);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
};
