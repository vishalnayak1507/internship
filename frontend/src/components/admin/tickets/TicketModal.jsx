/* eslint-disable no-unused-vars */
import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { cn } from '@/utils/utils';
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  X, Clock, AlertCircle, MessageSquare,
  FileText, User, Calendar, Briefcase, RefreshCw,
  Mail, Smartphone, Clock3, ExternalLink,CheckCircle
} from "lucide-react";
import axios from "axios";
import {
  priorityColors,
  statusColors,
  isSLABreached,
} from "../../../utils/admin/ticketHelpers";

// SLA logic helpers
function getSLAStatusAndTimer(ticket) {
  if (!ticket?.slaDeadline) return { breached: false, timerText: "", deadlineText: "No SLA" };

  const deadline = new Date(ticket.slaDeadline);
  let compareTime;
  let timerText = "";
  let deadlineText = deadline.toLocaleString();

  // Use isSLABreached directly
  const breached = isSLABreached(ticket);

  // Helper to get days, hours, minutes
  const getTimeParts = (ms) => {
    const absMs = Math.abs(ms);
    const days = Math.floor(absMs / (1000 * 60 * 60 * 24));
    const hours = Math.floor((absMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((absMs % (1000 * 60 * 60)) / (1000 * 60));
    return { days, hours, minutes };
  };

  if (ticket.status === "Closed" || ticket.status === "Resolved") {
    compareTime = (ticket.lastModifiedAt)
      ? new Date(ticket.lastModifiedAt)
      : new Date();
    const diffMs = compareTime - deadline;
    if (breached) {
      const { days, hours, minutes } = getTimeParts(diffMs);
      let parts = [];
      if (days) parts.push(`${days}d`);
      if (hours) parts.push(`${hours}h`);
      if (minutes || parts.length === 0) parts.push(`${minutes}m`);
      timerText = (
        <span className="text-white-500 font-bold text-sm">
          Breached by {parts.join(" ")}
        </span>
      );
    } else {
      timerText = "";
    }
  } else {
    compareTime = new Date();
    const diffMs = compareTime - deadline;
    const { days, hours, minutes } = getTimeParts(diffMs);
    let parts = [];
    if (days) parts.push(`${days}d`);
    if (hours) parts.push(`${hours}h`);
    if (minutes || parts.length === 0) parts.push(`${minutes}m`);
    if (breached) {
      timerText = (
        <span className="text-white font-semibold">
          Breached {parts.join(" ")} ago
        </span>
      );
    } else {
      timerText = (
        <span className="text-white font-semibold">
          Will be breached in {parts.join(" ")}
        </span>
      );
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

  return (
    <span className="flex items-center gap-1 text-base font-semibold">
      <Clock className="h-4 w-4" />
      {timerText}
    </span>
  );
};

// Helper functions
const formatDate = (dateString, includeTime = false) => {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  if (includeTime) {
    return date.toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric'
  });
};



const getInitials = (name) => {
  if (!name) return 'CU';
  return name
    .split(' ')
    .map((part) => part[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
};

const TicketModal = ({ isOpen, onClose, ticket }) => {
  const [activeTab, setActiveTab] = useState("details");
  const [discussions, setDiscussions] = useState([]);
  const [loadingDiscussions, setLoadingDiscussions] = useState(false);

  useEffect(() => {
    if (ticket && isOpen) {
      fetchTicketDiscussions();
      setActiveTab("details");
    }
    // eslint-disable-next-line
  }, [ticket?._id, isOpen]);

  // Fetch and map discussions for UI
  const fetchTicketDiscussions = async () => {
    if (!ticket?.ticketNumber) return;
    setLoadingDiscussions(true);
    try {
      const response = await axios.get(`http://localhost:8000/api/ticketdiscussion/${ticket.ticketNumber}`);
      const history = response.data?.data?.history || [];
      if (history.length > 0) {
        setDiscussions(history.map(r => {
          const isCustomer = r.isCustomerDetail;
          return {
            type: isCustomer ? "customer" : "analyst",
            // Use customer name from ticket for customer messages
            name: isCustomer ? (ticket.customerName || "Customer") : (r.userDetail?.name || "Analyst"),
            // Only include these fields for analyst messages
            email: isCustomer ? ticket.customerEmail : r.userDetail?.email,
            department: isCustomer ? null : r.userDetail?.department,
            // Add customer phone only for customer messages
            phone: isCustomer ? ticket.customerPhoneNumber : null,
            avatar: null,
            message: r.message
          };
        }));
      } else {
        setDiscussions([{
          type: "customer",
          name: ticket.customerName || "Customer",
          phone: ticket.customerPhoneNumber,
          email: ticket.customerEmail,
          avatar: null,
          message: ticket.description || "Ticket created"
        }]);
      }
    } catch {
      setDiscussions([{
        type: "customer",
        name: ticket.customerName || "Customer",
        phone: ticket.customerPhoneNumber,
        email: ticket.customerEmail,
        avatar: null,
        message: ticket.description || "Ticket created"
      }]);
    } finally {
      setLoadingDiscussions(false);
    }
  };

  if (!ticket) return null;

  const { breached, timerText, deadlineText } = getSLAStatusAndTimer(ticket);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl w-full p-0 overflow-hidden max-h-[95vh] rounded-lg shadow-xl border-0">
        <DialogTitle className="sr-only">Ticket Details</DialogTitle>
        <div className="flex flex-col h-[95vh] max-h-[95vh]">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-500 to-blue-500 text-white p-5 relative">
            <div className="flex items-start">
              <div className="mr-3">
                <div className="h-10 w-10 rounded-full bg-white/20 flex items-center justify-center">
                  <FileText className="h-5 w-5 text-white" />
                </div>
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h2 className="text-lg font-bold text-gray-100">{ticket.ticketNumber}</h2>
                  <span
                    className={`px-1.5 py-0.5 rounded font-bold text-sm ml-1 ${priorityColors[ticket.priority] || "bg-gray-400"} text-gray-100`}
                    style={{ minWidth: 8, display: "inline-block", textAlign: "center" }}
                  >
                    {ticket.priority}
                  </span>
                  <Badge className="bg-white/25 text-white border-0 font-semibold ml-3">
                    {ticket.status}
                  </Badge>
                </div>
                <div className="flex items-center gap-3 mt-2">
                  {breached && (
                    <Badge className="bg-red-500 text-white ml-2 font-semibold">⚠️ SLA Breached</Badge>
                  )}
                  <div className="ml-2">
                    <SlaTimer ticket={ticket} />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Tabs Navigation */}
          <div className="bg-white border-b px-6 py-2">
            <Tabs
              defaultValue="details"
              className="w-full"
              value={activeTab}
              onValueChange={setActiveTab}
            >
              <TabsList className="grid grid-cols-2 w-full max-w-md">
                <TabsTrigger value="details" className="data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700">
                  <FileText className="h-4 w-4 mr-2" />
                  Details
                </TabsTrigger>
                <TabsTrigger value="discussions" className="data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700">
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Discussions
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          {/* Content area */}
          <div className="flex-1 overflow-auto bg-gray-50">
            <Tabs
              value={activeTab}
              className="h-full"
              onValueChange={setActiveTab}
            >
              <TabsContent value="details" className="p-6 mt-0 h-full">
                <TicketDetailsView
                  ticket={ticket}
                  breached={breached}
                  deadlineText={deadlineText}
                  timerText={timerText}
                  setActiveTab={setActiveTab}
                  discussions={discussions}
                />
              </TabsContent>
              <TabsContent value="discussions" className="mt-0 h-full flex flex-col">
                {/* Sticky header OUTSIDE scroll area */}
                <div className="flex items-center justify-between p-4 border-b bg-white sticky top-0 z-10">
                  <h3 className="text-sm font-medium">
                    Conversation History
                  </h3>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={fetchTicketDiscussions}
                    disabled={loadingDiscussions}
                    className="h-8 px-2"
                  >
                    <RefreshCw className={`h-3.5 w-3.5 mr-1 ${loadingDiscussions ? "animate-spin" : ""}`} />
                    Refresh
                  </Button>
                </div>
                {/* Changed: Removed the flex-1 and overflow-y-auto to prevent extra scrollbar */}
                <div className="px-4 pt-4 pb-6 ">
                  <TicketDiscussions
                    discussions={discussions}
                    loading={loadingDiscussions}
                    customerName={ticket.customerName}
                    description={ticket.description}
                    ticketId={ticket._id}
                  />
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

// Helper to get recent analyst names from discussions
const getRecentAnalysts = (discussions, assignedTo) => {
  // Filter only analyst remarks (isCustomerDetail === false)
  const analystNames = [];
  const seen = new Set();

  // Go through discussions from most recent to oldest
  for (let i = discussions.length - 1; i >= 0; i--) {
    const d = discussions[i];
    if (d.type === "analyst" && d.name && !seen.has(d.name)) {
      // Exclude assignedTo if already shown
      if (!assignedTo || d.name !== assignedTo.name) {
        analystNames.push(d.name);
        seen.add(d.name);
      }
    }
  }
  return analystNames;
};

// Ticket Details View
const TicketDetailsView = ({ ticket, breached, setActiveTab, discussions = [] }) => {
  // Get assignedTo name if present
  const assignedToName = ticket.assignedTo?.name || null;
  // Get recent analysts from discussions (excluding assignedTo if present)
  const recentAnalysts = getRecentAnalysts(discussions, ticket.assignedTo);

  // Get description from first discussion entry if available
  const descriptionFromDiscussion = discussions.length > 0 ? discussions[0].message : null;
  const displayDescription = descriptionFromDiscussion || ticket.description || "No description provided.";

  // Find the last analyst remark for resolution
  const lastAnalystRemark = (() => {
    for (let i = discussions.length - 1; i >= 0; i--) {
      if (discussions[i].type === "analyst" && discussions[i].message) {
        return discussions[i].message;
      }
    }
    return null;
  })();

  return (
    <div className="flex flex-col gap-6 pb-0">
      {/* Customer Card */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden border border-blue-100">
        <div className="bg-blue-50 px-4 py-3 border-b border-blue-100">
          <div className="flex items-center">
            <User className="h-4 w-4 text-blue-600 mr-2" />
            <h3 className="font-medium text-blue-800">Customer</h3>
          </div>
        </div>
        <div className="p-4">
          <div className="grid grid-cols-2 gap-x-6">
            <div>
              <span className="text-blue-900 font-semibold block">Customer Name</span>
              <p className="ml-1 text-black-800 font-semibold">{ticket.customerName}</p>
            </div>
            {ticket.customerEmail && (
              <div>
                <span className="text-blue-900 font-semibold block">Customer Email</span>
                <div className="ml-1 text-black-800 font-semibold">
                  {ticket.customerEmail}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      {/* Ticket Details Card */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden border border-blue-100">
        <div className="bg-blue-50 px-4 py-3 border-b border-blue-100">
          <div className="flex items-center ">
            <FileText className="h-4 w-4 text-blue-600 mr-2" />
            <h3 className="font-medium text-blue-800">Ticket Info</h3>
          </div>
        </div>
        <div className="p-4">
          <div className="grid grid-cols-2 gap-x-6 gap-y-4 text-s">
            {/* First row: Ticket Number (with Priority badge) and Status */}
            <div>
              <span className="text-blue-900 font-semibold block mb-1">Ticket Number</span>
              <span className="font-bold text-gray-900 flex items-center">
                {ticket.ticketNumber}
                <Badge className={`ml-3 ${priorityColors[ticket.priority] || "bg-gray-400"} text-white font-bold text-xs`}>
                  {ticket.priority}
                </Badge>
              </span>
            </div>
            <div>
              <span className="text-blue-900 font-semibold block mb-1">Status</span>
              <Badge
                className={`font-serif ${statusColors[ticket.status] || "bg-gray-400 text-white"} text-sm`}
                style={{
                  border: "1px solid #222",
                  filter: "brightness(0.95)",
                }}
              >
                {ticket.status}
              </Badge>
            </div>
            {/* Second row: Source and Department */}
            <div>
              <span className="text-blue-900 font-semibold block mb-1">Source</span>
              <Badge variant="outline" className="font-serif text-gray-800 bg-gray-100 border-gray-200">
                {ticket.sourceType || 'N/A'}
              </Badge>
            </div>
            <div>
              <span className="text-blue-900 font-semibold block mb-1">Department</span>
              <Badge variant="outline" className="font-serif text-gray-800 bg-gray-100 border-gray-200">
                {ticket.department}
              </Badge>
            </div>
            {/* Third row: Created and SLA Deadline */}
            <div>
              <span className="text-blue-900 font-semibold block mb-1">Created At</span>
              <div className="flex items-center text-black-800 font-semibold">
                <Calendar className="h-3.5 w-3.5 mr-1 text-gray-800" />
                {formatDate(ticket.createdAt, true)}
              </div>
            </div>
            <div>
              <span className="text-blue-900 font-semibold block mb-1">SLA Deadline</span>
              <div className="flex items-center text-gray-800 font-semibold">
                <Clock className="h-3.5 w-3.5 mr-1 text-gray-800" />
                {ticket.slaDeadline ? (
                  breached ? (
                    <span className="text-red-600 font-sm">
                      {formatDate(ticket.slaDeadline, true)}
                    </span>
                  ) : (
                    <span className="text-white-600 font-sm">
                      {formatDate(ticket.slaDeadline, true)}
                    </span>
                  )
                ) : (
                  <span className="text-gray-400">No SLA</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* Issue Description */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="bg-gradient-to-r from-blue-50 to-blue-100 px-4 py-3 border-b border-gray-200">
          <div className="flex items-center">
            <AlertCircle className="h-4 w-4 text-gray-600 mr-2" />
            <h3 className="font-medium text-blue-900">Description</h3>
          </div>
        </div>
        <div className="p-4">
          <div className="bg-gray-50 border border-gray-200 rounded-md p-4 whitespace-pre-wrap text-sm">
            {displayDescription}
          </div>
        </div>
      </div>
      {/* Resolution Section */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="bg-gradient-to-r from-blue-50 to-blue-100 px-4 py-3 border-b border-gray-200">
          <div className="flex items-center">
            <CheckCircle className="h-4 w-4 text-grey-600 mr-2" />
            <h3 className="font-medium text-blue-800">Resolution</h3>
          </div>
        </div>
        <div className="p-4">
          <div className="bg-gray-50 border border-gray-200 rounded-md p-4 whitespace-pre-wrap text-sm">
            {(ticket.status === "Open" || ticket.status === "In Progress")
              ? "(Ticket hasn't solved)"
              : (lastAnalystRemark || "No resolution provided.")}
          </div>
        </div>
      </div>
      {/* Assignment Info */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="bg-gradient-to-r from-blue-50 to-blue-100 px-4 py-3 border-b border-green-200">
          <div className="flex items-center">
            <Briefcase className="h-4 w-4 text-grey-600 mr-2" />
            <h3 className="font-medium text-blue-800">Assigned To:</h3>
          </div>
        </div>
        <div className="p-4">
          <div className="flex flex-col gap-3">
            {assignedToName ? (
              <>
                {/* Assigned Analyst */}
                <div className="border rounded-lg p-3 flex items-center gap-3 bg-green-50">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-green-100 text-green-700 text-xs">
                      {getInitials(assignedToName)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-bold text-gray-900">{assignedToName}</div>
                    <div className="text-xs text-gray-700 mt-1 font-semibold">Recent Analyst</div>
                  </div>
                </div>
                {/* Recent Analysts */}
                {recentAnalysts.map((name, idx) => (
                  <div key={idx} className="border rounded-lg p-3 flex items-center gap-3 bg-gray-50 ml-8">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-blue-100 text-blue-700 text-xs">
                        {getInitials(name)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-bold text-gray-900">{name}</div>
                    </div>
                  </div>
                ))}
              </>
            ) : recentAnalysts.length > 0 ? (
              recentAnalysts.map((name, idx) => (
                <div key={idx} className="border rounded-lg p-3 flex items-center gap-3 bg-gray-50">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-blue-100 text-blue-700 text-xs">
                      {getInitials(name)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-bold text-gray-900">{name}</div>
                    {idx === 0 && (
                      <div className="text-xs text-gray-700 mt-1 font-semibold">Recent Analyst</div>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-gray-500 text-sm">Unassigned</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Ticket Discussions
const TicketDiscussions = ({ discussions, loading }) => {
  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-500">Loading discussion history...</p>
        </div>
      </div>
    );
  }

  if (!discussions || discussions.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
        <MessageSquare className="h-12 w-12 text-gray-300 mb-3" />
        <h3 className="text-lg font-medium text-gray-700 mb-1">No discussions yet</h3>
        <p className="text-gray-500 mb-6 max-w-md">
          There are no messages or updates in this ticket's history.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {discussions.map((discussion, index) => {
        const isCustomer = discussion.type === "customer";
        const initials = getInitials(discussion.name);

        return (
          <div
            key={index}
            className={cn(
              "flex animate-in fade-in-0 slide-in-from-bottom-2 duration-300",
              isCustomer ? "justify-start" : "justify-end"
            )}
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <div className={cn(
              "max-w-[80%] rounded-lg p-4 shadow-sm group relative hover:shadow-md transition-shadow duration-200 break-words",
              isCustomer
                ? "bg-white text-gray-800 rounded-tl-none border border-gray-100"
                : "bg-blue-50 text-blue-800 rounded-tr-none border border-blue-100"
            )}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center">
                  <div className="relative group">
                    <Avatar className={cn(
                      "h-6 w-6 mr-2 cursor-pointer transition-transform duration-200 group-hover:scale-110",
                      isCustomer ? "bg-blue-100" : "bg-indigo-100"
                    )}>
                      <AvatarFallback className={cn(
                        isCustomer ? "text-blue-700" : "text-indigo-700"
                      )}>
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                    {/* Tooltip */}
                    <div className="absolute bottom-full left-0 mb-2 z-20 bg-white rounded-lg shadow-lg px-3 py-2 text-xs opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-200 min-w-[180px] border-l-4 border-l-blue-500">
                      <div className="flex items-center gap-2 pb-1.5 mb-1.5 border-b border-gray-100">
                        <div className={cn(
                          "h-5 w-5 rounded-full flex items-center justify-center text-[10px] font-bold",
                          isCustomer ? "bg-blue-100 text-blue-600" : "bg-indigo-100 text-indigo-600"
                        )}>
                          {initials}
                        </div>
                        <span className="font-semibold">{discussion.name}</span>
                      </div>
                      {discussion.email && (
                        <div className="flex items-center gap-1.5 text-gray-600 mb-0.5">
                          <Mail className="h-3 w-3" />
                          <span>{discussion.email}</span>
                        </div>
                      )}
                      {discussion.phone && (
                        <div className="flex items-center gap-1.5 text-gray-600 mb-0.5">
                          <Smartphone className="h-3 w-3" />
                          <span>{discussion.phone}</span>
                        </div>
                      )}
                      {discussion.department && (
                        <div className="flex items-center gap-1.5 text-gray-600">
                          <User className="h-3 w-3" />
                          <span>{discussion.department}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <span className={cn(
                    "text-sm font-medium",
                    isCustomer ? "text-gray-800" : "text-blue-800"
                  )}>
                    {discussion.name}
                  </span>
                </div>
              </div>
              <p className="text-sm whitespace-pre-wrap break-words">{discussion.message}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default TicketModal;