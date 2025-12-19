/* eslint-disable no-unused-vars */
import React, { useState, useEffect } from "react";
import axios from "axios";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock } from "lucide-react";
import {
  priorityColors,
  getTicketCardStyle,
  statusColors,
  isSLABreached,
} from "../../../utils/admin/ticketHelpers";

// Helper: SLA status and timer logic
function getSLAStatusAndTimer(ticket) {
  if (!ticket.slaDeadline) return { breached: false, timerText: "", deadlineText: "No SLA" };

  const deadline = new Date(ticket.slaDeadline);
  let compareTime;
  let timerText = "";
  let deadlineText = "";
  // Use isSLABreached helper
  const breached = isSLABreached(ticket);

  const getTimeParts = (ms) => {
    const absMs = Math.abs(ms);
    const days = Math.floor(absMs / (1000 * 60 * 60 * 24));
    const hours = Math.floor((absMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((absMs % (1000 * 60 * 60)) / (1000 * 60));
    return { days, hours, minutes };
  };

  if (ticket.status === "Closed" || ticket.status === "Resolved"||ticket.status === "resolved"||ticket.status === "closed") {
     compareTime = ticket.lastModifiedAt
    ? new Date(ticket.lastModifiedAt)
    : ticket.updatedAt
    ? new Date(ticket.updatedAt)
    : new Date();
    const diffMs = compareTime - deadline;
    deadlineText = deadline.toLocaleString();
    if (breached) {
      const { days, hours, minutes } = getTimeParts(diffMs);
      let parts = [];
      if (days) parts.push(`${days}d`);
      if (hours) parts.push(`${hours}h`);
      if (minutes || parts.length === 0) parts.push(`${minutes}m`);
      timerText = `Breached by ${parts.join(" ")}`;
    } else {
      timerText = "";
    }
  } else {
    compareTime = new Date();
    const diffMs = compareTime - deadline;
    deadlineText = deadline.toLocaleString();
    const { days, hours, minutes } = getTimeParts(diffMs);
    let parts = [];
    if (days) parts.push(`${days}d`);
    if (hours) parts.push(`${hours}h`);
    if (minutes || parts.length === 0) parts.push(`${minutes}m`);
    if (breached) {
      timerText = `Breached ${parts.join(" ")} ago`;
    } else {
      timerText = `Will be breached in ${parts.join(" ")}`;
    }
  }
  return { breached, timerText, deadlineText };
}

// SLA Timer component (refreshes every 60s)
const SlaTimer = ({ ticket }) => {
  const [timerText, setTimerText] = useState(getSLAStatusAndTimer(ticket).timerText);

  useEffect(() => {
    const update = () => setTimerText(getSLAStatusAndTimer(ticket).timerText);
    update();
    const interval = setInterval(update, 60000);
    return () => clearInterval(interval);
  }, [ticket]);

  if (!timerText) return null;
  const { breached } = getSLAStatusAndTimer(ticket);

  return (
    <span
      className={`flex items-center gap-1 text-base font-medium ${breached ? "text-red-600" : "text-blue-800"
        }`}
    >
      <Clock className="h-4 w-4" />
      {timerText}
    </span>
  );
};

// Add this helper function near the top (outside the component)
const formatDate = (dateString, includeTime = false) => {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  if (includeTime) {
    return date.toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
};

// Add this helper function near the top (outside the component)
const getSubjectPreview = (text, wordLimit = 20) => {
  if (!text) return "No subject provided";
  const words = text.split(/\s+/);
  if (words.length <= wordLimit) return text;
  return words.slice(0, wordLimit).join(" ") + "...";
};

// Enhanced function to get the latest analyst from ticket discussions
const getLatestAnalyst = async (ticketNumber) => {
  try {
    const response = await axios.get(`http://localhost:8000/api/ticketdiscussion/${ticketNumber}`);
    const history = response.data?.data?.history;
    
    if (history && history.length > 0) {
      // Find the last remark where isCustomerDetail is false (analyst remark)
      const analystRemark = [...history]
        .reverse()
        .find(r => r.isCustomerDetail === false && r.userDetail);
      
      if (analystRemark && analystRemark.userDetail) {
        return analystRemark.userDetail.name || null;
      }
    }
    return null;
  } catch (err) {
    console.error("Failed to fetch discussions:", err);
    return null;
  }
};

const TicketCard = ({ ticket, onClick }) => {
  // Use the latestAnalyst from ticket if available
  const [latestAnalyst, setLatestAnalyst] = useState(ticket.latestAnalyst || null);
  const [discussionSubject, setDiscussionSubject] = useState(null);

  useEffect(() => {
    // Only fetch if latestAnalyst is not already present
    if (!ticket.latestAnalyst && !ticket.assignedTo) {
      const fetchTicketDiscussionDetails = async () => {
        try {
          const response = await axios.get(`http://localhost:8000/api/ticketdiscussion/${ticket.ticketNumber}`);
          const history = response.data?.data?.history;
          if (history && history.length > 0) {
            if (history[0]?.message) {
              setDiscussionSubject(history[0].message);
            }
            const analystRemark = [...history]
              .reverse()
              .find(r => r.isCustomerDetail === false && r.userDetail);
            if (analystRemark && analystRemark.userDetail) {
              const latestName = analystRemark.userDetail.name || "N/A";
              setLatestAnalyst(latestName);
              // Optionally: ticket.latestAnalyst = latestName;
            }
          }
        } catch (err) {
          setLatestAnalyst(null);
        }
      };
      fetchTicketDiscussionDetails();
    } else {
      // If already present, set it immediately
      setLatestAnalyst(ticket.latestAnalyst || (ticket.assignedTo && ticket.assignedTo.name) || null);
    }
    // eslint-disable-next-line
  }, [ticket.latestAnalyst, ticket.assignedTo, ticket.ticketNumber]);

  const handleCardClick = (e) => {
    e.preventDefault();
    try {
      if (typeof onClick === "function") {
        onClick(e, ticket);
      }
    } catch (error) {
      console.error("Error navigating to ticket details:", error);
    }
  };

  const handleViewButtonClick = (e) => {
    e.stopPropagation();
    handleCardClick(e);
  };

  // SLA status and timer
  const { breached } = getSLAStatusAndTimer(ticket);

  return (
    <Card
      className={`bg-gradient-to-br ${getTicketCardStyle(ticket)} border shadow-lg transition-all hover:shadow-xl hover:scale-[1.01] cursor-pointer w-[98%] mx-auto`}
      onClick={handleCardClick}
    >
      {/* Reduce the gap-2 to gap-1 in the parent container */}
      <CardContent className="p-2 flex flex-col gap-1">
        {/* First Row: Ticket Number, Priority, Status, SLA Breached badge */}
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-bold text-base text-black">
              {ticket.ticketNumber}
            </span>
            <Badge className={`${priorityColors[ticket.priority] || "bg-gray-400"} text-white font-bold`}>
              {ticket.priority || "N/A"}
            </Badge>
            <Badge
              className={`font-bold ${statusColors[ticket.status] || "bg-gray-400 text-white"}`}
              style={{
                border: "1px solid #222",
                filter: "brightness(0.95)",
              }}
            >
              {ticket.status || "N/A"}
            </Badge>
            {breached && (
              <Badge className="bg-red-600 text-white font-bold">SLA Breached</Badge>
            )}
          </div>
          <div className="flex flex-col items-end min-w-[140px]">
            <span className="font-bold text-sm text-black">
              SLA Deadline: {ticket.slaDeadline ? formatDate(ticket.slaDeadline, true) : "N/A"}
            </span>
          </div>
        </div>


        {/* Second Row: Customer Name (left), right side SLA timer */}
        {/* Reduce mt-1 mb-1 to mb-0.5 */}
        <div className="flex items-center justify-between gap-1">
          <div className="flex items-center gap-1">
            <span className="font-semibold text-base text-blue-900 mb-1">Customer:</span>
            <span className="analyst-name text-sm text-slate-900">
              {ticket.customerName || "No name provided"}
            </span>
          </div>
          <div>
            <SlaTimer ticket={ticket} />
          </div>
        </div>

        {/* <div className="flex items-center text-xs flex-wrap ">
          <span 
            className="font-semibold text-base text-blue-800  ">Email:</span>
          <span className="analyst-email font-semibold text-sm text-slate-800 ml-1">
            {ticket.customerEmail || "No email provided"}
          </span>
        </div> */}

        {/* Fourth Row: Department (left), Assigned To (center), Created At (right) */}
        {/* Reduce mb-1 to mb-0.5 */}
        <div className="flex w-full items-center text-xs mb-0.5">
          {/* Department - left */}
          <div className="flex-1 min-w-0">
            <span className="font-semibold text-base text-blue-900">Department:</span>
            <span className="analyst-name text-sm text-slate-900 ml-1">
              {ticket.department || "N/A"}
            </span>
          </div>
          {/* Assigned To - center */}
          <div className="flex-1 min-w-0 text-center">
            <span className="font-semibold text-base text-blue-900">Assigned To:</span>
            <span className="analyst-name text-sm text-slate-900 ml-1">
              {ticket.assignedTo && ticket.assignedTo.name
                ? ticket.assignedTo.name
                : latestAnalyst
                  ? latestAnalyst
                  : "Unassigned"}
            </span>
          </div>
          {/* Created At - right */}
          <div className="flex-1 min-w-0 text-right">
            <span className="font-semibold text-base text-blue-900 ">Created at:</span>
            <span className="analyst-name text-sm text-slate-900 ml-1">
              {ticket.createdAt
                ? formatDate(ticket.createdAt, true)
                : "N/A"}
            </span>
          </div>
        </div>

        <div className="mb-0.5 flex items-center gap-1">
          <strong className="font-semibold text-base text-blue-800 mb-1">Subject:</strong>
          <span className="analyst-name text-sm text-slate-900">
            {getSubjectPreview(discussionSubject || ticket.description || ticket.closingRemark)}
          </span>
        </div>

        {/* View Ticket Button at bottom right */}
        
        <div className="flex flex-col items-end ">
          <Button
            variant="link"
            className="text-blue-600 text-sm p-0 w-fit hover:text-blue-800 hover:underline"
            onClick={handleViewButtonClick}
          >
            View Ticket
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default TicketCard;