import XLSX from "xlsx";
import path from "path";
import { parse, isValid } from "date-fns";
import Ticket from "../../models/Ticket.js";
import TicketMaster from "../../models/Master.js";
import User from "../../models/User.js";
import TicketDiscussion from "../../models/TicketDiscussion.js";
import { autoAssignQueue } from "../../scripts/autoAssignQueue.js";
import { io } from "../../index.js";
import mongoose from "mongoose";
import * as chrono from "chrono-node"; // npm install chrono-node

// Helper to normalize keys: lower case, trimmed, and map alternates
const normalizeKey = (key) => key.trim().toLowerCase();

const HEADER_MAP = {
  ticketnumber: "ticketNumber",
  customername: "customerName",
  customeremail: "customerEmail",
  sourcetype: "sourceType",
  lastmodifiedat: "lastModifiedAt",
  status: "status",
  closingremark: "closingRemark",
  assignedanalystid: "assignedAnalystId",
  analystname: "analystName",
  categoryname: "categoryName",
  modulename: "moduleName",
  priority: "priority",
  severity: "severity",
  expected_sla: "expected_SLA",
  department: "department",
  appname: "appName",
  assignedat: "assignedAt",
  sladeadline: "slaDeadline",
  creationtime: "creationTime",
  modifiedtime: "modifiedTime",
  slastatusflag: "slaStatusFlag",
  description: "description",
};

// Define required fields for a valid ticket upload
const REQUIRED_FIELDS = ["ticketNumber", "customerName", "description"];

// --- Robust date parsing ---

function excelSerialToDate(serial) {
  // Excel's epoch starts at 1899-12-30
  const excelEpoch = new Date(Date.UTC(1899, 11, 30));
  return new Date(excelEpoch.getTime() + serial * 24 * 60 * 60 * 1000);
}

function parseExcelDate(value) {
  if (!value) return null;

  // 1. Handle Excel serial numbers (typical range: 60 to 60000)
  if (!isNaN(value) && Number(value) > 59 && Number(value) < 60000) {
    return excelSerialToDate(Number(value));
  }

  // 2. Try date-fns with known formats
  const formats = [
    "dd-MMM-yy HH:mm:ss",
    "dd-MMM-yy HH:mm",
    "dd-MMM-yy",
    "dd-MMM-yyyy HH:mm:ss",
    "dd-MMM-yyyy HH:mm",
    "dd-MMM-yyyy",
    "dd/MM/yyyy HH:mm",
    "dd/MM/yyyy",
    "MMM-dd-yy",
    "MMM-dd-yyyy HH:mm",
    "MMM-dd-yyyy",
    "yyyy-MM-dd'T'HH:mm:ssXXX",
    "yyyy-MM-dd HH:mm:ss",
    "yyyy-MM-dd",
    "MM/dd/yyyy",
    "M/d/yyyy",
    "d-MMM-yy",
    "d-MMM-yyyy",
  ];
  for (const format of formats) {
    try {
      const parsed = parse(String(value), format, new Date());
      if (isValid(parsed)) return parsed;
    } catch {}
  }

  // 3. Try chrono-node for natural language and fuzzy parsing
  const chronoParsed = chrono.parseDate(String(value));
  if (chronoParsed && isValid(chronoParsed)) return chronoParsed;

  // 4. Fallback to JS Date
  const jsDate = new Date(value);
  if (isValid(jsDate)) return jsDate;

  return null;
}

function cleanEnum(val, options) {
  return typeof val === "string"
    ? options.find((opt) => opt.toLowerCase() === val.toLowerCase())
    : undefined;
}

function normalizeRowKeys(row) {
  const normalized = {};
  Object.keys(row).forEach((origKey) => {
    const normKey = normalizeKey(origKey);
    const canonicalKey = HEADER_MAP[normKey] || origKey.trim();
    normalized[canonicalKey] = row[origKey];
  });
  return normalized;
}

export const handleExcelUpload = async (req, res) => {
  try {
    await autoAssignQueue.pause();
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    // Determine file extension
    const ext = path.extname(req.file.originalname).toLowerCase();
    let jsonData = [];

    // Read file as buffer
    if (ext === ".csv" || ext === ".xlsx" || ext === ".xls") {
      const workbook = XLSX.readFile(req.file.path);
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      jsonData = XLSX.utils.sheet_to_json(sheet);
      jsonData = jsonData.map((row) => normalizeRowKeys(row));
    } else {
      return res.status(400).json({ error: "Unsupported file type" });
    }

    if (!jsonData.length) {
      return res.status(400).json({ error: "File contains no data" });
    }

    // Validate required fields in the first row
    const firstRow = jsonData[0];
    const missingFields = REQUIRED_FIELDS.filter(
      (field) =>
        !(field in firstRow) ||
        firstRow[field] === undefined ||
        firstRow[field] === null ||
        String(firstRow[field]).trim() === ""
    );
    if (missingFields.length > 0) {
      return res.status(400).json({
        error: `File is missing required columns: ${missingFields.join(", ")}`,
      });
    }

    let insertedCount = 0;
    let updatedCount = 0;
    const processedTickets = [];

    for (let i = 0; i < jsonData.length; i++) {
      const row = jsonData[i];
      // Optionally, you could also validate required fields for every row here if needed

      // If department is missing or empty, use admin's department
      if (
        (!row.department || String(row.department).trim() === "") &&
        req.user &&
        req.user.department
      ) {
        row.department = req.user.department;
      }

      // Ticket Number
      let safeTicketNumber;
      if (
        row.ticketNumber !== undefined &&
        row.ticketNumber !== null &&
        String(row.ticketNumber).trim() !== "" &&
        String(row.ticketNumber).toLowerCase() !== "null"
      ) {
        safeTicketNumber = String(row.ticketNumber).trim();
      } else {
        const randomStr = Math.random().toString(36).substring(2, 8);
        safeTicketNumber = `TICKET_${Date.now()}_${i}_${randomStr}`;
      }

      // Enums
      const validSourceType =
        cleanEnum(row.sourceType, ["Call", "Email", "Message", "FileUpload"]) ||
        "FileUpload";
      const validStatus =
        cleanEnum(row.status, ["Open", "In Progress", "Closed", "Resolved"]) ||
        "Open";

      // Dates
      const created = parseExcelDate(row.creationTime) || new Date();
      const modified = parseExcelDate(row.lastModifiedAt) || created;
      const assignedAt = parseExcelDate(row.assignedAt) || null;

      // --- Flexible Master Data Lookup ---
      let masterDoc = null;
      const masterQuery = {};
      if (row.categoryId) masterQuery.categoryId = row.categoryId;
      if (row.moduleId) masterQuery.moduleId = row.moduleId;
      if (masterQuery.categoryId && masterQuery.moduleId) {
        masterDoc = await TicketMaster.findOne(masterQuery);
      }

      let expected_SLA =
        masterDoc && masterDoc.expected_SLA
          ? Number(masterDoc.expected_SLA)
          : 24;

      let priority = row.priority || (masterDoc && masterDoc.priority) || "P2";
      let severity =
        row.severity || (masterDoc && masterDoc.severity) || "Medium";

      // Calculate slaDeadline (required)
      let slaDeadline;
      if (row.slaDeadline) {
        slaDeadline = parseExcelDate(row.slaDeadline);
      } else {
        slaDeadline = new Date(Date.now() + expected_SLA * 3600000);
      }

      // assignedTo: lookup by assignedAnalystId and analystName, or null if missing
      let assignedToId = null;
      if (
        row.assignedAnalystId &&
        String(row.assignedAnalystId).trim() !== ""
      ) {
        const searchUserId = String(row.assignedAnalystId).trim();
        const user = await User.findOne({
          userId: searchUserId,
        });
        if (user && user.isActive) {
          assignedToId = user._id;
        }
      }

      // Build ticket object
      const ticketData = {
        ticketNumber: safeTicketNumber,
        customerName: row.customerName || "",
        customerEmail: row.customerEmail || "",
        sourceType: validSourceType,
        lastModifiedAt: modified,
        status: validStatus,
        closingRemark: row.closingRemark || "",
        description: (row.description || "").toString().trim().slice(0, 300),
        assignedTo: assignedToId,
        masterData: masterDoc ? masterDoc._id : null,
        priority,
        severity,
        expected_SLA,
        department: row.department || null, // Now row.department is set to admin's department if missing
        appName: row.appName || null,
        assignedAt,
        slaDeadline,
        creationTime: created,
        modifiedTime: modified,
        slaStatusFlag: String(row.slaStatusFlag).toLowerCase() === "true",
      };

      let ticketDoc;
      try {
        // Try to insert
        ticketDoc = await Ticket.create(ticketData);
        insertedCount++;
        processedTickets.push(ticketDoc);
      } catch (err) {
        if (err.code === 11000) {
          // Duplicate key error
          ticketDoc = await Ticket.findOneAndUpdate(
            { ticketNumber: safeTicketNumber },
            { $set: ticketData },
            { new: true }
          );
          updatedCount++;
          processedTickets.push(ticketDoc);
        } else {
          // Log validation or other errors
          console.error(
            `Ticket insert error for ticketNumber ${safeTicketNumber}:`,
            err.message,
            err.errors
          );
        }
      }

      // If description is present, upsert/append in TicketDiscussion
      if (row.description && String(row.description).trim() !== "") {
        const discussionFilter = { ticketNumber: safeTicketNumber };
        const newRemark = {
          isCustomerDetail: true,
          userDetail: null,
          message: row.description,
        };

        const discussion = await TicketDiscussion.findOne(discussionFilter);

        let shouldAppend = true;
        if (
          discussion &&
          Array.isArray(discussion.remarks) &&
          discussion.remarks.length > 0
        ) {
          const lastRemark = discussion.remarks[discussion.remarks.length - 1];
          if (lastRemark && lastRemark.message === newRemark.message) {
            shouldAppend = false;
          }
        }

        if (shouldAppend) {
          await TicketDiscussion.findOneAndUpdate(
            discussionFilter,
            {
              $push: { remarks: newRemark },
              $setOnInsert: {
                discussionBy: null,
                subject: "Ticket Description",
                discussionType: "Customer",
              },
            },
            { upsert: true, new: true }
          );
        }
      }

      // If assignedTo is null, add to auto-assign queue otherwise assign ticket to respective analyst who are referred in file upload
      if (ticketDoc.status !== "Closed" && ticketDoc.status !== "In Progress") {
        if (ticketDoc.assignedTo === null) {
          await autoAssignQueue.add(
            "assign",
            {
              ticketId: ticketDoc._id,
              department: ticketDoc.department,
            },
            {
              priority:
                ticketDoc.priority === "P1"
                  ? 1
                  : ticketDoc.priority === "P2"
                    ? 2
                    : 3,
              attempts: 5,
              backoff: {
                type: "exponential",
                delay: 5000,
              },
            }
          );
          await Ticket.findOneAndUpdate(
            { ticketNumber: safeTicketNumber },
            { $set: { status: "Open" } },
            { new: true }
          );
        } else {
          // --- TRANSACTIONAL ASSIGNMENT ---
          const session = await mongoose.startSession();
          try {
            session.startTransaction();
            // Find ticket with assignedTo: null inside transaction
            const ticket = await Ticket.findOne(
              { ticketNumber: safeTicketNumber, assignedTo: null },
              null,
              { session }
            );
            if (ticket) {
              ticket.assignedTo = ticketDoc.assignedTo;
              ticket.status = "In Progress";
              await ticket.save({ session });
              await User.findByIdAndUpdate(
                ticketDoc.assignedTo,
                { $inc: { InProgressTickets: 1 } },
                { new: true, session }
              );
              await session.commitTransaction();
              // Emit socket event after commit
              io.to(`analyst-${ticketDoc.assignedTo}`).emit("ticketAssigned", {
                ticket: ticketDoc,
                message: "A ticket has been assigned to you from file upload",
              });
            } else {
              await session.abortTransaction();
            }
          } catch (error) {
            await session.abortTransaction();
            throw error;
          } finally {
            session.endSession();
          }
        }
      }
    }

    // Log total number of tickets in the DB
    const totalTickets = await Ticket.countDocuments();

    return res.status(200).json({
      message: `✅ Tickets processed: ${insertedCount + updatedCount} (Inserted: ${insertedCount}, Updated: ${updatedCount})`,
      insertedCount,
      updatedCount,
      totalTickets,
      tickets: processedTickets,
    });
  } catch (err) {
    res.status(500).json({
      message: "❌ Upload failed",
      error: err.message,
    });
  } finally {
    await autoAssignQueue.resume();
  }
};
