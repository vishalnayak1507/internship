import Ticket from "../../models/Ticket.js";
import TicketDiscussion from "../../models/TicketDiscussion.js";

// Get tickets assigned to a specific analyst
export const getTicketsByAnalyst = async (req, res) => {
  try {
    const { userId } = req.params;
    const tickets = await Ticket.find({ assignedTo: userId }).populate("assignedTo", "name email");
    res.status(200).json({ success: true, tickets });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get count of in-progress tickets assigned to analyst within time range
export const getInProgressTicketsCount = async (req, res) => {
  try {
    const { userId } = req.params;
    const { startDate, endDate } = req.query;
    
    // Validate time filter parameters
    if (!startDate || !endDate) {
      return res.status(400).json({ 
        success: false, 
        message: "Start date and end date are required" 
      });
    }
    
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    // Query for all in-progress tickets assigned to the analyst within time range
    const count = await Ticket.countDocuments({
      assignedTo: userId,
      status: "In Progress",
      createdAt: { $lte: end }
    });
    
    // Query for SLA breached in-progress tickets
    const slaBreachedCount = await Ticket.countDocuments({
      assignedTo: userId,
      status: "In Progress",
      createdAt: { $lte: end },
      slaStatusFlag: true // This indicates SLA breach
    });
    
    res.status(200).json({ 
      success: true, 
      totalCount: count,
      slaBreachedCount: slaBreachedCount,
      timeRange: { startDate: start, endDate: end } 
    });
    
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get count of resolved tickets by analyst within time range
export const getResolvedTicketsCount = async (req, res) => {
  try {
    const { userId } = req.params;
    const { startDate, endDate } = req.query;
    
    // Validate time filter parameters
    if (!startDate || !endDate) {
      return res.status(400).json({ 
        success: false, 
        message: "Start date and end date are required" 
      });
    }
    
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    // Find all ticket discussions where analyst has marked resolution within time range
    const discussionDocuments = await TicketDiscussion.find({
      "remarks.userDetail": userId,
      "remarks.resolvedTime": { $gte: start, $lte: end }
    });
    
    // Extract unique ticket numbers to avoid counting same ticket multiple times
    const resolvedTicketNumbers = new Set();
    
    for (const discussion of discussionDocuments) {
      // Look through remarks for entries by the analyst with resolution times in the range
      for (const remark of discussion.remarks) {
        if (
          remark.userDetail && 
          remark.userDetail.toString() === userId &&
          remark.resolvedTime && 
          remark.resolvedTime >= start && 
          remark.resolvedTime <= end
        ) {
          resolvedTicketNumbers.add(discussion.ticketNumber);
          break; // Found one match in this ticket, no need to check other remarks
        }
      }
    }
    
    const uniqueTicketNumbers = Array.from(resolvedTicketNumbers);
    const totalCount = uniqueTicketNumbers.length;
    
    // Get count of SLA breached resolved tickets
    let slaBreachedCount = 0;
    if (uniqueTicketNumbers.length > 0) {
      slaBreachedCount = await Ticket.countDocuments({
        ticketNumber: { $in: uniqueTicketNumbers },
        slaStatusFlag: true
      });
    }
    
    res.status(200).json({ 
      success: true, 
      totalCount: totalCount,
      slaBreachedCount: slaBreachedCount,
      timeRange: { startDate: start, endDate: end } 
    });
    
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};