import mongoose from "mongoose";
import Ticket from "../../models/Ticket.js";
import { getStatusFilter, getSlaBreachedFilter } from "../../utils/ticketFilters.js";

// Reusable function to build date filters based on query parameters
const buildDateFilter = (queryParams) => {
  let dateFilter = {};
  const { period, startDate, endDate } = queryParams;

  if (period === "daily") {
    // Today: from local midnight to now
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    const todayStart = new Date(`${yyyy}-${mm}-${dd}T00:00:00`);
    dateFilter = { createdAt: { $gte: todayStart, $lte: now } };
  } else if (period === "weekly") {
    // Start from Monday of this week (local) to now
    const now = new Date();
    const day = now.getDay();
    const daysToMonday = day === 0 ? 6 : day - 1;
    const monday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - daysToMonday);
    monday.setHours(0, 0, 0, 0);
    dateFilter = { createdAt: { $gte: monday, $lte: now } };
  } else if (period === "monthly") {
    // Start from the 1st of this month (local) to now
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    firstDay.setHours(0, 0, 0, 0);
    dateFilter = { createdAt: { $gte: firstDay, $lte: now } };
  } else if (startDate && endDate) {
    // Always treat as local time
    const start = new Date(startDate + "T00:00:00");
    const end = new Date(endDate + "T23:59:59.999");
    dateFilter = {
      createdAt: {
        $gte: start,
        $lte: end,
      },
    };
  }
  return dateFilter;
};

// Helper to get department filter from request
function getDepartmentFromRequest(req) {
  const userRole = req.user?.role;
  const userDepartment = req.user?.department;
  let department;

  if (userRole === "superadmin") {
    const dep = req.query.department;
    if (
      !dep ||
      dep.toLowerCase() === "all" ||
      dep.toLowerCase() === "all departments"
    ) {
      department = undefined; // Show all departments
    } else {
      department = dep;
    }
  } else {
    department = userDepartment;
  }

  return { department, userRole };
}

function getLocalDayRange() {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
  const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
  return { startDate: start, endDate: end };
}

function getLocalWeekRange() {
  const now = new Date();
  const day = now.getDay();
  const diffToMonday = (day === 0 ? -6 : 1) - day;
  const monday = new Date(now.getFullYear(), now.getMonth(), now.getDate() + diffToMonday, 0, 0, 0, 0);
  const sunday = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + 6, 23, 59, 59, 999);
  return { startDate: monday, endDate: sunday };
}

function getLocalMonthRange() {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
  return { startDate: start, endDate: end };
}

function getLocalDayRangeForDate(dateObj) {
  // Accepts a Date object and returns start/end of that local day
  const start = new Date(dateObj.getFullYear(), dateObj.getMonth(), dateObj.getDate(), 0, 0, 0, 0);
  const end = new Date(dateObj.getFullYear(), dateObj.getMonth(), dateObj.getDate(), 23, 59, 59, 999);
  return { startDate: start, endDate: end };
}

export const getDashboardOverview = async (req, res) => {
  try {
    const { department, userRole } = getDepartmentFromRequest(req);
    if (!department && userRole !== "superadmin") {
      return res.status(400).json({
        success: false,
        message: "Department not found for current user",
      });
    }
    let { startDate, endDate, period } = req.query;
    // Consistent local-time-based logic for all periods
    if (period === "today" && (!startDate || !endDate)) {
      const now = new Date();
      const range = getLocalDayRangeForDate(now);
      startDate = range.startDate;
      endDate = range.endDate;
    } else if (period === "this week" && (!startDate || !endDate)) {
      const range = getLocalWeekRange();
      startDate = range.startDate;
      endDate = range.endDate;
    } else if (period === "this month" && (!startDate || !endDate)) {
      const range = getLocalMonthRange();
      startDate = range.startDate;
      endDate = range.endDate;
    } else if (startDate && endDate) {
      // Always treat as local date, and use start/end of that day
      const startObj = new Date(startDate);
      const endObj = new Date(endDate);
      const range = getLocalDayRangeForDate(startObj);
      startDate = range.startDate;
      // If custom range is more than one day, set endDate to end of the endObj day
      if (startDate.getTime() !== endObj.getTime()) {
        endDate = new Date(endObj.getFullYear(), endObj.getMonth(), endObj.getDate(), 23, 59, 59, 999);
      } else {
        endDate = range.endDate;
      }
    }
    // Remove debug log after confirming correctness
    const statusMap = {
      open: "Open",
      "in progress": "In Progress",
      resolved: "Resolved",
      closed: "Closed"
    };
    const deptFilter = department ? { department } : {};
    let openFilter = { ...deptFilter, status: statusMap.open };
    let resolvedFilter = { ...deptFilter, status: statusMap.resolved };
    let closedFilter = { ...deptFilter, status: statusMap.closed };
    let inProgressFilter = { ...deptFilter, status: statusMap["in progress"] };
    let slaBreachedFilter = { ...deptFilter, slaStatusFlag: true, status: { $in: [statusMap["in progress"], statusMap.resolved] } };
    if (period !== "all" && startDate && endDate) {
      openFilter.lastModifiedAt = { $gte: startDate, $lte: endDate };
      resolvedFilter.lastModifiedAt = { $gte: startDate, $lte: endDate };
      closedFilter.lastModifiedAt = { $gte: startDate, $lte: endDate };
      inProgressFilter.createdAt = { $lte: endDate };
      slaBreachedFilter.createdAt = { $lte: endDate };
    }
    const openCount = await Ticket.countDocuments(openFilter);
    const resolvedCount = await Ticket.countDocuments(resolvedFilter);
    const closedCount = await Ticket.countDocuments(closedFilter);
    const inProgressCount = await Ticket.countDocuments(inProgressFilter);
    const slaBreachedCount = await Ticket.countDocuments(slaBreachedFilter);
    const summary = {
      total: openCount + inProgressCount + resolvedCount + closedCount,
      open: openCount,
      inProgress: inProgressCount,
      resolved: resolvedCount,
      closed: closedCount,
      slaBreached: slaBreachedCount,
    };
    res.status(200).json({
      success: true,
      data: summary,
    });
  } catch (error) {
    console.error("Dashboard overview error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch dashboard overview data",
      error: error.message,
    });
  }
};

export const getTicketsBySource = async (req, res) => {
  try {
    const { department, userRole } = getDepartmentFromRequest(req);

    if (!department && userRole !== "superadmin") {
      return res.status(400).json({
        success: false,
        message: "Department not found for current user",
      });
    }

    const dateFilter = buildDateFilter(req.query);
    let matchFilter = { ...dateFilter };

    if (department) {
      matchFilter.department = department;
    }

    const result = await Ticket.aggregate([
      { $match: matchFilter },
      {
        $group: {
          _id: "$sourceType",
          value: { $sum: 1 },
        },
      },
      {
        $project: {
          _id: 0,
          source: "$_id",
          value: 1,
        },
      },
    ]);
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch tickets by source",
      error: error.message,
    });
  }
};

export const getTicketsByStatus = async (req, res) => {
  try {
    const { department, userRole } = getDepartmentFromRequest(req);

    if (!department && userRole !== "superadmin") {
      return res.status(400).json({
        success: false,
        message: "Department not found for current user",
      });
    }

    const dateFilter = buildDateFilter(req.query);
    let matchFilter = { ...dateFilter };

    if (department) {
      matchFilter.department = department;
    }

    const statusCounts = await Ticket.aggregate([
      { $match: matchFilter },
      {
        $group: {
          _id: "$status",
          value: { $sum: 1 },
        },
      },
    ]);

    // Format for frontend: [{ status: "Open", value: 10 }, ...]
    const data = statusCounts.map((item) => ({
      status: item._id,
      value: item.value,
    }));

    res.json({ success: true, data });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch status data" });
  }
};

export const getTicketTrends = async (req, res) => {
  // Debug: Log incoming query params
  console.log('[TicketTrends] Incoming req.query:', req.query);
  try {
    const { department, userRole } = getDepartmentFromRequest(req);

    if (!department && userRole !== "superadmin") {
      return res.status(400).json({
        success: false,
        message: "Department not found for current user",
      });
    }

    // Use the reusable function to build date filter
    const dateFilter = buildDateFilter(req.query);

    // Debug: Log the built date filter
    console.log('[TicketTrends] Built dateFilter:', dateFilter);

    // Combine department filter with date filter (if not superadmin or if department specified)
    let matchFilter = { ...dateFilter };
    if (department) {
      matchFilter.department = department;
    }

    // Debug: Log the final match filter
    console.log('[TicketTrends] Final matchFilter:', matchFilter);

    const trends = await Ticket.aggregate([
      { $match: matchFilter },
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" },
            day: { $dayOfMonth: "$createdAt" },
          },
          total: { $sum: 1 },
          open: { $sum: { $cond: [{ $eq: ["$status", "Open"] }, 1, 0] } },
          inProgress: { $sum: { $cond: [{ $eq: ["$status", "In Progress"] }, 1, 0] } },
          resolved: { $sum: { $cond: [{ $eq: ["$status", "Resolved"] }, 1, 0] } },
          closed: { $sum: { $cond: [{ $eq: ["$status", "Closed"] }, 1, 0] } },
          slaBreached: { $sum: { $cond: [{ $eq: ["$slaStatusFlag", true] }, 1, 0] } },
        },
      },
      {
        $project: {
          _id: 0,
          date: { $dateFromParts: { year: "$_id.year", month: "$_id.month", day: "$_id.day" } },
          total: 1,
          open: 1,
          inProgress: 1,
          resolved: 1,
          closed: 1,
          slaBreached: 1,
        },
      },
      { $sort: { date: 1 } },
    ]);

    // Debug: Log the trends result
    console.log('[TicketTrends] Aggregation result:', trends);

    res.json({ success: true, data: trends });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch ticket trends",
      error: error.message,
    });
  }
};