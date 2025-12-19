import mongoose from "mongoose";
import User from "./User.js";
import TicketMaster from "./Master.js";

const TicketSchema = new mongoose.Schema(
  {
    ticketNumber: {
      type: String,
      required: true,
      unique: true,
    },
    customerName: {
      type: String,
    },
    customerEmail: {
      type: String,
    },
    sourceType: {
      type: String,
      enum: ["Call", "Email", "Message", "FileUpload", "Others"],
      required: true,
    },
    otherModeText: { type: String, maxlength: 30 },
    lastModifiedAt: {
      type: Date,
    },
    status: {
      type: String,
      enum: ["Open", "In Progress", "Closed", "Resolved"],
    },
    closingRemark: {
      type: String,
      default: "",
    },
    description: {
      type: String,
      default: "",
      maxlength: 300,
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: User,
      default: null,
    },
    masterData: {
      type: mongoose.Schema.Types.ObjectId,
      ref: TicketMaster,
    },
    priority: {
      type: String,
      required: true,
    },
    severity: {
      type: String,
      required: true,
    },
    expected_SLA: {
      type: Number,
      required: true,
    },
    department: {
      type: String,
      default: null,
    },
    appName: {
      type: String,
      default: null,
    },
    assignedAt: {
      type: Date,
      default: null,
    },
    slaDeadline: {
      type: Date,
      required: true,
    },
    creationTime: { type: Date },
    slaStatusFlag: {
      type: Boolean,
      default: false,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    customerPhoneNumber: {
      type: String,
    },
    userDetail: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    resolvedTime: { type: Date },
  },
  { timestamps: true }
);

//helps in faster priority and severity and SLA related queries
TicketSchema.index({ priority: 1 });
TicketSchema.index({ severity: 1 });
TicketSchema.index({ slaDeadline: 1 });
TicketSchema.index({ slaStatusFlag: 1 });
// TicketSchema.index({ ticketNumber: 1 });

const Ticket = mongoose.model("Ticket", TicketSchema);

export default Ticket;