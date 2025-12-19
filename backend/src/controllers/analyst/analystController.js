import User from '../../models/User.js'
import Ticket from '../../models/Ticket.js';
import TicketDiscussion from '../../models/TicketDiscussion.js';
import { io } from '../../index.js';
import mongoose from 'mongoose';

const getMyTickets = async (req, res) => {
  try {
    const analystId = req.user._id;
    const tickets = await Ticket.find({ assignedTo: analystId })

    res.status(200).json({
      success: true,
      message: "Tickets fetched successfully",
      data: tickets
    });
  } catch (error) {
    console.error("Error fetching tickets:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch tickets",
      error: error.message
    });
  }
}
const resolveTicket = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { ticketId } = req.params;
    const { remarks } = req.body;
    const userId = req.user._id;
 
    const prevTicket = await Ticket.findById(ticketId).session(session);
    if (!prevTicket) {
      throw new Error("Ticket not found");
    }
    const prevUpdatedAt = prevTicket.updatedAt; // <-- Save previous updatedAt

    const ticket = await Ticket.findByIdAndUpdate(
      ticketId,
      { status: "Resolved", assignedTo: null, lastModifiedAt: Date.now() },
      { new: true, session }
    );
    if(!ticket){
      throw new Error("Ticket not found");
    }
 
    const resolvedTime = new Date();
    
    const resolutionTimeSeconds = Math.round((resolvedTime - prevUpdatedAt) / 1000);
 
    // Fetch analyst with the session to maintain transaction integrity
    const analyst = await User.findById(userId).session(session);
    if (!analyst) {
      throw new Error("Analyst not found");
    }
   
    const prevAvg = analyst.avgResolutionTime || 0;
    const prevCount = analyst.resolvedTicketCount || 0;
    const newAvg = ((prevAvg * prevCount) + resolutionTimeSeconds) / (prevCount + 1);
   
    // Update analyst in the database directly rather than using save()
    await User.findByIdAndUpdate(
      userId,
      {
        avgResolutionTime: newAvg,
        resolvedTicketCount: prevCount + 1
      },
      { session }
    );
 
    await User.findByIdAndUpdate(
      userId,
      { $inc: { InProgressTickets: -1 } },
      { new: true,session });
 
    await TicketDiscussion.findOneAndUpdate(
      { ticketNumber: ticket.ticketNumber },
      {
        $push: {
          remarks: {
            isCustomerDetail: false,
            userDetail: userId,
            message: remarks,
            resolvedTime: new Date()
          }
        }
      },
      {session}
    );
    await session.commitTransaction();
    session.endSession();
    // Emit ticketResolved event with the ticketId so clients can update their UI
    console.log(`Emitting ticketResolved event with ticketId: ${ticketId}`);
    io.emit("ticketResolved", ticketId);
    res.status(200).json({
      success: true,
      message: "Ticket resolved",
      ticketId: ticketId
    });
   
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error('Error resolving ticket:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to resolve ticket. Please try again.'
    });
  }
};
 

const getTicketDiscussions = async (req, res) => {
  try {
    const { ticketNumber } = req.params;
    const discussion = await TicketDiscussion.findOne({ ticketNumber });
    const ticket = await Ticket.findOne({ ticketNumber }).lean();

    // Collect all analyst userIds
    const analystIds = [];
    discussion.remarks.forEach(r => {
      if (!r.isCustomerDetail && r.userDetail) analystIds.push(r.userDetail.toString());
    });

    // Fetch analyst user details
    const users = await User.find({ _id: { $in: analystIds } }).lean();
    const userMap = {};
    users.forEach(u => {
      userMap[u._id.toString()] = {
        name: u.name,
        email: u.email,
        department: u.department,
        avatar: u.avatar // if you have avatar
      };
    });

    const history = [];
    discussion.remarks.forEach(r => {
      if (r.isCustomerDetail) {
        history.push({
          type: "customer",
          name: ticket.customerName || 'Customer',
          phone: ticket.customerPhoneNumber,
          email: ticket.customerEmail,
          avatar: null,
          message: r.message
        });
      } else if (r.userDetail) {
        const user = userMap[r.userDetail.toString()];
        if (user) {
          history.push({
            type: "analyst",
            name: user.name,
            email: user.email,
            department: user.department,
            avatar: user.avatar,
            message: r.message
          });
        }
      }
    });
    return res.status(200).json({
      success: true,
      message: 'Ticket discussions fetched successfully',
      data: {
        ticketNumber: discussion.ticketNumber,
        history: history
      }
    });
  } catch (error) {
    console.error('Error fetching ticket discussions:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch ticket discussions'
    });
  }
};

const getResolvedTicketsByAnalyst = async (req, res) => {
  try {
    const analystId = req.user._id;
    const hours = Number(req.query.hours)
    const since = new Date(Date.now() - (hours * 60 * 60 * 1000));
    const discussions = await TicketDiscussion.find({
      'remarks': {
        $elemMatch: {
          userDetail: analystId,
          isCustomerDetail: false,
          resolvedTime: { $exists: true }
        }
      }
    }).select('ticketNumber remarks');

    // Map ticketNumber to latest resolvedTime for this analyst
    const ticketResolvedTimes = {};
    discussions.forEach(discussion => {
      const times = discussion.remarks
        .filter(r => String(r.userDetail) === String(analystId) && r.resolvedTime >= since)
        .map(r => new Date(r.resolvedTime));
      if (times.length > 0) {
        ticketResolvedTimes[discussion.ticketNumber] = new Date(Math.max(...times));
      }
    });

    const ticketNumbers = Object.keys(ticketResolvedTimes);
    // Fetch tickets for those ticket numbers (no status filter)
    const tickets = await Ticket.find({
      ticketNumber: { $in: ticketNumbers }
    }).lean();
    // Attach resolvedTime to each ticket
    tickets.forEach(ticket => {
      ticket.resolvedTime = ticketResolvedTimes[ticket.ticketNumber] || null;
    });
    // Sort tickets by resolvedTime descending
    tickets.sort((a, b) => new Date(b.resolvedTime) - new Date(a.resolvedTime));

    res.status(200).json({ success: true, tickets });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

export {
  getMyTickets,
  getTicketDiscussions,
  getResolvedTicketsByAnalyst,
  resolveTicket,
}
