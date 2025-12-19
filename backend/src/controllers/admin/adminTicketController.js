import Ticket from "../../models/Ticket.js";
import User from "../../models/User.js";
import { Parser } from "json2csv";
import pkg from "xlsx";
import { format } from "date-fns";
const { utils: XLSXUtils, write: XLSXWrite } = pkg;

// Store the Excel row limit in a constant at the top for easy change
const EXCEL_ROW_LIMIT = 1000000; // Change this value as needed (e.g., 1000000 for production)

export const adminExportTickets = async (req, res) => {
  try {
    const user = req.user;
    // Get format parameter (default to xlsx)
    const format = req.query.format || "xlsx";

    let filter = {};

    // Track applied filters for filename
    const filterInfo = {
      department: [],
      status: [],
      sla: null,
      dateRange: null,
    };

    // Department filter handling
    if (user.role === "admin") {
      filter.department = user.department;
      filterInfo.department.push(user.department);
    } else if (user.role === "superadmin") {
      // Handle both 'department' and 'departments' parameters
      if (req.query.departments) {
        const departmentList = req.query.departments.split(",");
        filter.department = { $in: departmentList };
        filterInfo.department = departmentList;
      } else if (req.query.department) {
        // Check if single department or comma-separated list
        if (req.query.department.includes(",")) {
          const departments = req.query.department.split(",");
          filter.department = { $in: departments };
          filterInfo.department = departments;
        } else {
          filter.department = req.query.department;
          filterInfo.department.push(req.query.department);
        }
      }
    }

    // Status filter (multi-select)
    if (req.query.status) {
      const statuses = req.query.status.split(",");
      filter.status = { $in: statuses };
      filterInfo.status = statuses;
    }

    // SLA Breached filter
    if (req.query.slaBreached === "true") {
      filter.slaStatusFlag = true;
      filterInfo.sla = "breached";
    } else if (req.query.slaBreached === "false") {
      filter.slaStatusFlag = false;
      filterInfo.sla = "not-breached";
    }

    // Date filters
    if (req.query.startDate || req.query.endDate) {
      filter.createdAt = filter.createdAt || {};
      filterInfo.dateRange = "";

      if (req.query.startDate) {
        filter.createdAt.$gte = new Date(req.query.startDate);
        filterInfo.dateRange += formatFilenameDatePart(req.query.startDate);
      }

      if (req.query.endDate) {
        const endDateObj = new Date(req.query.endDate);
        endDateObj.setDate(endDateObj.getDate() + 1); // Include the end date fully
        filter.createdAt.$lte = endDateObj;
        filterInfo.dateRange +=
          (filterInfo.dateRange ? "_to_" : "") +
          formatFilenameDatePart(req.query.endDate);
      }
    }

    // Log the filter for debugging
    console.log("Export filter:", JSON.stringify(filter));

    // --- Add countOnly support for frontend popup ---
    if (req.query.countOnly === "true") {
      const count = await Ticket.countDocuments(filter);
      return res.json({ count });
    }

    // Generate a meaningful filename
    const filename = generateMeaningfulFilename(filterInfo, user);

    // Fetch tickets with selective population (avoiding populate on problematic createdBy)
    const tickets = await Ticket.find(filter)
      .populate("assignedTo", "name email username")
      .sort({ createdAt: -1 })
      .lean();

    // Extract unique creator IDs and usernames
    const creatorIds = [];
    const creatorUsernames = [];

    tickets.forEach((ticket) => {
      if (ticket.createdBy) {
        // Check if createdBy is a string (username) or ObjectId
        if (typeof ticket.createdBy === "string") {
          creatorUsernames.push(ticket.createdBy);
        } else {
          try {
            const idStr = ticket.createdBy.toString();
            creatorIds.push(ticket.createdBy);
          } catch (e) {
            console.log("Invalid createdBy:", ticket.createdBy);
          }
        }
      }
    });

    // Fetch users by ID and username
    let usersById = [];
    let usersByUsername = [];

    if (creatorIds.length > 0) {
      usersById = await User.find({
        _id: { $in: creatorIds },
      }).lean();
    }

    if (creatorUsernames.length > 0) {
      usersByUsername = await User.find({
        username: { $in: creatorUsernames },
      }).lean();
    }

    // Create lookup maps
    const userByIdMap = {};
    usersById.forEach((user) => {
      userByIdMap[user._id.toString()] = user;
    });

    const userByUsernameMap = {};
    usersByUsername.forEach((user) => {
      userByUsernameMap[user.username] = user;
    });

    // Format the data for export with better field names
    const formattedTickets = tickets.map((ticket) => {
      let creator = null;

      // Handle both ObjectId and string createdBy fields
      if (ticket.createdBy) {
        if (typeof ticket.createdBy === "string") {
          creator = userByUsernameMap[ticket.createdBy];
        } else {
          try {
            const createdById = ticket.createdBy.toString();
            creator = userByIdMap[createdById];
          } catch (e) {
            // Handle the case where toString() fails
            console.log("Error processing createdBy:", e.message);
          }
        }
      }

      return {
        // "Ticket ID": ticket._id.toString(),
        "Ticket Number": ticket.ticketNumber || "",
        // "Subject": ticket.subject || '',
        Description: ticket.description?.substring(0, 100) || "",
        Status: ticket.status || "",
        Priority: ticket.priority || "",
        Severity: ticket.severity || "",
        Department: ticket.department || "",
        // Customer fields
        "Customer Name": ticket.customerName || "",
        "Customer Email": ticket.customerEmail || "",
        "Customer Phone": ticket.customerPhoneNumber || "",
        "Source Type": ticket.sourceType || "",
        // User fields - handles both string and ObjectId references
        "Created By":
          creator?.name ||
          (typeof ticket.createdBy === "string" ? ticket.createdBy : "Unknown"),
        "Created By Email": creator?.email || "",
        // "Created By Username": creator?.username || (typeof ticket.createdBy === 'string' ? ticket.createdBy : ''),
        "Assigned To": ticket.assignedTo?.name || "Unassigned",
        "Assigned To Email": ticket.assignedTo?.email || "",
        // Date fields
        "Created At": formatDate(ticket.createdAt),
        "Updated At": formatDate(ticket.updatedAt),
        "Resolution Time (hrs)":
          ticket.status === "Resolved" || ticket.status === "Closed"
            ? Math.round(
                (new Date(
                  ticket.updatedAt ||
                    ticket.lastModifiedAt ||
                    ticket.modifiedTime
                ) -
                  new Date(ticket.createdAt || ticket.creationTime)) /
                  36000
              ) / 100
            : "",
        "SLA Breached": ticket.slaStatusFlag ? "Yes" : "No",
        "SLA Deadline": formatDate(ticket.slaDeadline),
      };
    });

    // Choose format based on query parameter
    if (format === "xlsx") {
      // Return Excel file
      // Create workbook and worksheet
      const workbook = XLSXUtils.book_new();
      const totalSheets = Math.ceil(formattedTickets.length / EXCEL_ROW_LIMIT);
      const colWidths = [
        { wch: 15 }, // Ticket Number
        { wch: 50 }, // Description
        { wch: 15 }, // Status
        { wch: 15 }, // Priority
        { wch: 15 }, // Severity
        { wch: 20 }, // Department
        { wch: 25 }, // Customer Name
        { wch: 25 }, // Customer Email
        { wch: 20 }, // Customer Phone
        { wch: 15 }, // Source Type
        { wch: 20 }, // Created By
        { wch: 25 }, // Created By Email
        { wch: 20 }, // Assigned To
        { wch: 25 }, // Assigned To Email
        { wch: 20 }, // Created At
        { wch: 20 }, // Updated At
        { wch: 15 }, // Resolution Time
        { wch: 15 }, // SLA Breached
        { wch: 20 }, // SLA Deadline
      ];
      const statusColors = {
        Open: "e53935", // Red
        InProgress: "fb8c00", // Orange
        Resolved: "43a047", // Green
        Closed: "757575", // Gray
      };
      for (let i = 0; i < totalSheets; i++) {
        const chunk = formattedTickets.slice(
          i * EXCEL_ROW_LIMIT,
          (i + 1) * EXCEL_ROW_LIMIT
        );
        const worksheet = XLSXUtils.json_to_sheet(chunk);
        worksheet["!cols"] = colWidths;
        // Style the header row
        const range = XLSXUtils.decode_range(worksheet["!ref"]);
        for (let C = range.s.c; C <= range.e.c; ++C) {
          const address = XLSXUtils.encode_cell({ r: 0, c: C });
          if (!worksheet[address]) continue;
          worksheet[address].s = {
            font: { bold: true, color: { rgb: "FFFFFF" } },
            fill: { fgColor: { rgb: "4285F4" } },
          };
        }
        // Add zebra striping for better readability
        for (let R = 1; R <= chunk.length; R++) {
          const rowStyle = {
            fill: {
              fgColor: { rgb: R % 2 === 0 ? "F5F5F5" : "FFFFFF" },
            },
          };
          for (let C = range.s.c; C <= range.e.c; ++C) {
            const address = XLSXUtils.encode_cell({ r: R, c: C });
            if (!worksheet[address]) continue;
            worksheet[address].s = rowStyle;
          }
        }
        // Color-code status cells
        let statusColIndex = -1;
        const headers = Object.keys(chunk[0] || {});
        headers.forEach((header, idx) => {
          if (header === "Status") statusColIndex = idx;
        });
        if (statusColIndex >= 0) {
          for (let R = 1; R <= chunk.length; R++) {
            const address = XLSXUtils.encode_cell({ r: R, c: statusColIndex });
            const status = worksheet[address]?.v;
            if (status && statusColors[status]) {
              worksheet[address].s = {
                font: { color: { rgb: "FFFFFF" } },
                fill: { fgColor: { rgb: statusColors[status] } },
              };
            }
          }
        }
        XLSXUtils.book_append_sheet(workbook, worksheet, `Tickets${i + 1}`);
      }
      // Write to buffer
      const excelBuffer = XLSXWrite(workbook, {
        bookType: "xlsx",
        type: "buffer",
      });
      // Send response with meaningful filename
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${filename}.xlsx"`
      );
      res.setHeader(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      );
      return res.send(excelBuffer);
    } else {
      // Use the existing CSV export method
      const parser = new Parser();
      const csv = parser.parse(formattedTickets);

      res.header("Content-Type", "text/csv");
      res.attachment(`${filename}.csv`);
      return res.send(csv);
    }
  } catch (err) {
    console.error("Export error:", err);
    res
      .status(500)
      .json({ success: false, message: "Export failed", error: err.message });
  }
};

// Helper function to format dates nicely for display
function formatDate(date) {
  if (!date) return "";
  try {
    return format(new Date(date), "dd-MMM-yyyy HH:mm:ss");
  } catch (err) {
    console.error("Error formatting date:", err);
    return "";
  }
}

// Helper function to format dates for filenames (YYYYMMDD)
function formatFilenameDatePart(dateStr) {
  const date = new Date(dateStr);
  return date.toISOString().split("T")[0].replace(/-/g, "");
}

// Generate a meaningful filename based on filters
function generateMeaningfulFilename(filterInfo, user) {
  const parts = ["tickets"];

  // Add department info
  if (filterInfo.department.length > 0) {
    if (filterInfo.department.length === 1) {
      parts.push(
        `dept-${filterInfo.department[0].replace(/\s+/g, "_").toLowerCase()}`
      );
    } else if (filterInfo.department.length <= 3) {
      parts.push(`depts-${filterInfo.department.length}`);
    } else {
      parts.push("multiple-depts");
    }
  }

  // Add status info
  if (filterInfo.status.length > 0) {
    if (filterInfo.status.length === 1) {
      parts.push(`${filterInfo.status[0].toLowerCase()}`);
    } else {
      parts.push(`${filterInfo.status.length}-statuses`);
    }
  }

  // Add SLA info
  if (filterInfo.sla) {
    parts.push(`sla-${filterInfo.sla}`);
  }

  // Add date range
  if (filterInfo.dateRange) {
    parts.push(filterInfo.dateRange);
  } else {
    // Add current date if no range specified
    parts.push(formatFilenameDatePart(new Date()));
  }

  // Add user role for tracking
  parts.push(user.role);

  return parts.join("-");
}