import mongoose from "mongoose";
import Ticket from "../models/Ticket.js";
import TicketDiscussion from "../models/TicketDiscussion.js";
import TicketMaster from "../models/Master.js";


const MONGO_URI = "mongodb+srv://techMahindra:techMahindra@clustertechm.1dsekxg.mongodb.net/?retryWrites=true&w=majority&appName=ClusterTechM";
const users = [
  "668fcd60e7a0c0076b7cf201",
  "668fcd60e7a0c0076b7cf202",
  "668fcd60e7a0c0076b7cf203",
  "668fcd60e7a0c0076b7cf204",
  "668fcd60e7a0c0076b7cf205"
];

const priorities = ["P1", "P2", "P3"];
const severities = ["High", "Medium", "Low"];
const departments = ["CMP", "GLS", "SCFU", "YONO"];
const appNames = ["flask"];
const sources = ["Call", "Email", "Message", "FileUpload", "Others"];
const statuses = ["Open", "In Progress", "Closed", "Resolved"];

function randomDate(start, end) {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

async function seed() {
  if (!MONGO_URI) {
    console.error("MONGO_URI not set in environment variables.");
    process.exit(1);
  }
  await mongoose.connect(MONGO_URI);

//   await Ticket.deleteMany({});
//   await TicketDiscussion.deleteMany({});

  const tickets = [];
  const discussions = [];

  var total = 30;
  for (let i = 0; i < total; i++) {
    // Fixed date: 10-Jul-25
    const createdAt = new Date("2025-07-10T10:00:00Z");
    const updatedAt = new Date(createdAt.getTime() + (12 + Math.floor(Math.random() * 48)) * 60 * 60 * 1000);
    const slaDeadline = new Date(updatedAt.getTime() + (24 + Math.floor(Math.random() * 48)) * 60 * 60 * 1000);

    const ticketNumber = `4411112${i + 1}`;
    const userId = users[i % users.length];

    // All tickets Closed for this test
    const status = "Closed";
    const resolvedTime = new Date(updatedAt.getTime() + 3600 * 1000); // 1 hour after updatedAt

    const ticket = {
      ticketNumber,
      customerName: `Customer${i + 1}`,
      customerEmail: `customer${i + 1}@email.com`,
      sourceType: sources[i % sources.length],
      otherModeText: sources[i % sources.length] === "Others" ? "Walk-in" : "",
      lastModifiedAt: updatedAt,
      status,
      closingRemark: "",
      description: `Sample issue description ${i + 1}`,
      assignedTo: null,
      masterData: null,
      priority: priorities[i % priorities.length],
      severity: severities[i % severities.length],
      expected_SLA: 24,
      department: departments[i % departments.length],
      appName: appNames[i % appNames.length],
      assignedAt: null,
      slaDeadline,
      creationTime: createdAt,
      slaStatusFlag: false,
      createdBy: userId,
      customerPhoneNumber: `90000000${i + 1}`,
      userDetail: userId,
      resolvedTime,
      createdAt,
      updatedAt
    };

    tickets.push(ticket);

    // Multiple remarks for realism
    const remarks = [
      {
        isCustomerDetail: i % 2 === 0,
        userDetail: userId,
        resolvedTime: null,
        message: `Initial discussion for ticket ${ticketNumber}`
      },
      {
        isCustomerDetail: i % 2 !== 0,
        userDetail: users[(i + 1) % users.length],
        resolvedTime: null,
        message: `Follow-up for ticket ${ticketNumber}`
      }
    ];

    const discussion = {
      ticketNumber,
      discussionBy: userId,
      remarks,
      subject: `Subject for ticket ${ticketNumber}`,
      discussionType: i % 2 === 0 ? "Internal" : "Customer",
      createdAt,
      updatedAt
    };

    discussions.push(discussion);
  }

  await Ticket.insertMany(tickets);
  await TicketDiscussion.insertMany(discussions);

  console.log("Sample tickets and discussions inserted!");
  await mongoose.disconnect();
}

seed().catch(err => {
  console.error(err);
  process.exit(1);
});
