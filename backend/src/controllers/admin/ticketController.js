import Ticket from "../../models/Ticket.js";
import TicketDiscussion from "../../models/TicketDiscussion.js";

// Get all tickets (with optional query params for filtering)
export const getAllTickets = async (req, res, next) => {
  try {
    // Ensure user is authenticated and is an admin or superadmin
    if (req.user.role !== "admin" && req.user.role !== "superadmin") {
      return res.status(403).json({
        success: false,
        message: "Access denied. Admins or Superadmins only.",
      });
    }
    console.log("User Role:", req.user.role);

    // Handle department filtering
    let departmentFilter = {};
    if (req.user.role === "admin") {
      // Admins can only access tickets for their own department
      const adminDepartment = req.user.department;
      if (!adminDepartment) {
        return res.status(400).json({
          success: false,
          message: "Admin department not found.",
        });
      }
      console.log("Admin Department:", adminDepartment);
      departmentFilter = { department: adminDepartment };
    } else if (req.user.role === "superadmin") {
      // Superadmins can filter by any department using query params
      if (req.query.department) {
        departmentFilter = { department: req.query.department };
      }
    }

    // Find tickets based on department filter
    // Only select fields needed for the list
    const tickets = await Ticket.find(departmentFilter)
      .select(
        "ticketNumber createdAt lastModifiedAt status priority department assignedTo slaDeadline customerName customerEmail description closingRemark slaStatusFlag"
      )
      .populate("assignedTo", "name email")
      .lean();

    // Get all ticketNumbers
    const ticketNumbers = tickets.map((t) => t.ticketNumber);

    // Fetch latest analyst remarks for all tickets in one go
    const discussions = await TicketDiscussion.find({
      ticketNumber: { $in: ticketNumbers },
    })
      .select("ticketNumber remarks")
      .populate("remarks.userDetail", "name")
      .lean();

    // Build a map of ticketNumber -> latestAnalystName
    const latestAnalystMap = {};
    for (const discussion of discussions) {
      const analystRemark = [...(discussion.remarks || [])]
        .reverse()
        .find((r) => r.isCustomerDetail === false && r.userDetail);
      if (analystRemark && analystRemark.userDetail && analystRemark.userDetail.name) {
        latestAnalystMap[discussion.ticketNumber] = analystRemark.userDetail.name;
      }
    }

    // Attach latestAnalyst to each ticket
    tickets.forEach((ticket) => {
      if (!ticket.assignedTo && latestAnalystMap[ticket.ticketNumber]) {
        ticket.latestAnalyst = latestAnalystMap[ticket.ticketNumber];
      }
    });

    res.json({ success: true, data: tickets });
  } catch (error) {
    next(error);
  }
};