import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { cn } from '@/utils/utils';
import {
  CheckCircle, X, Clock, AlertCircle, MessageSquare,
  FileText, User, Calendar, RefreshCw,
  Mail, Smartphone, Clock3
} from 'lucide-react';
import axiosClient from '@/utils/AxiosClient.jsx';
import { toast } from 'sonner';

export const TicketDetailsPanel = ({
  open,
  ticket,
  onClose,
  userId,
  onResolve
}) => {
  const [activeTab, setActiveTab] = useState("details");
  const [discussions, setDiscussions] = useState([]);
  const [ticketDescription, setTicketDescription] = useState("");
  const [resolutionRemarks, setResolutionRemarks] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadingDiscussions, setLoadingDiscussions] = useState(false);

  // Fetch ticket discussions when ticket changes
  useEffect(() => {
    if (ticket && open) {
      fetchTicketData();
    }

    // Reset states when panel opens with a new ticket
    if (open && ticket) {
      setResolutionRemarks("");
      setActiveTab("details");
    }
  }, [ticket?._id, open]);

  const fetchTicketData = async () => {
    if (!ticket?.ticketNumber) return;

    setLoadingDiscussions(true);
    try {
      const response = await axiosClient.get(`/analyst/ticket-discussions/${ticket.ticketNumber}`);

      // Use the same response for both discussions and description
      if (response.data?.data?.history?.length > 0) {
        setDiscussions(response.data.data.history);

        // Find the first customer message for description
        const customerMessage = response.data.data.history.find(item => item.type === "customer");
        if (customerMessage) {
          setTicketDescription(customerMessage.message);
        }
        else {
          setTicketDescription("NO DESCRIPTION PROVIDED");
        }
      } else {
        const defaultDiscussion = {
          type: "customer",
          name: ticket.customerName || "Customer",
          phone: ticket.customerPhoneNumber,
          email: ticket.customerEmail,
          avatar: null,
          message: ""
        };

        setDiscussions([defaultDiscussion]);
        setTicketDescription("NO DESCRIPTION PROVIDED");
      }
    } catch (error) {
      console.error("Error fetching ticket data:", error);
      // Handle error case
      setDiscussions([{
        type: "customer",
        name: ticket.customerName || "Customer",
        phone: ticket.customerPhoneNumber,
        email: ticket.customerEmail,
        avatar: null,
        message: ""
      }]);
      setTicketDescription("NO DESCRIPTION PROVIDED");
    } finally {
      setLoadingDiscussions(false);
    }
  };


  const handleResolveConfirm = async () => {
    const trimmedRemarks = resolutionRemarks.trim();
    if (!trimmedRemarks.trim() || !ticket) return;

    setIsSubmitting(true);
    try {
      await onResolve(ticket._id, trimmedRemarks);
      onClose();
    } catch (error) {
      console.error('Error resolving ticket:', error);
      toast.error("Error resolving ticket: " + (error.response?.data?.message || "Unknown error"));
    } finally {
      setIsSubmitting(false);
    }
  };


  const handleRefreshDiscussions = (e) => {
    if (e) e.preventDefault();
    fetchTicketData();
  };

  // THIS IS THE KEY FUNCTION THAT NEEDED TO BE FIXED
  const handleKeyDown = (e) => {
    // Fix: Using resolutionRemarks instead of remarks
    if (e.key === 'Enter' && !e.shiftKey && resolutionRemarks.trim()) {
      e.preventDefault();
      handleResolveConfirm(); // Call the confirm handler rather than directly calling onResolve
    }
  };

  // Handle tab change with preventDefault
  const handleTabChange = (value) => {
    setActiveTab(value);
  };

  if (!ticket) return null;
  const canResolve =
    ticket.status?.toLowerCase() !== "resolved" &&
    ticket.assignedTo?._id === userId;

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      if (!isOpen) onClose();
    }}>
      <DialogContent className="max-w-3xl w-full p-0 overflow-hidden max-h-[100vh] rounded-lg shadow-xl border-0">
        {/* Accessibility: Add DialogTitle and DialogDescription */}
        <DialogTitle className="sr-only">
          Ticket Details - {ticket.ticketNumber}
        </DialogTitle>
        <DialogDescription className="sr-only">
          View, discuss, and resolve the selected ticket.
        </DialogDescription>
        {/* Style the close button for better visibility */}
        <style>{`
          .vaz-dialog-close {
            color: #fff !important;
            background: rgba(0,0,0,0.12) !important;
            border-radius: 9999px;
            transition: background 0.2s, color 0.2s;
          }
          .vaz-dialog-close:hover {
            background: #fff !important;
            color: #2563eb !important;
            box-shadow: 0 2px 8px 0 rgba(0,0,0,0.10);
          }
          .vaz-dialog-close svg {
            width: 1.5rem;
            height: 1.5rem;
            stroke-width: 2.5;
          }
        `}</style>
        <div className="flex flex-col h-[93vh]">
          {/* Make the close button more prominent by targeting the Dialog close button */}
          {/* If your Dialog component allows passing className to the close button, add 'vaz-dialog-close' there. Otherwise, this CSS will target the button by inspecting the DOM. */}
          {/* Header with ticket info */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white p-5 relative">
            {/* Only one close button should be rendered by Dialog/DialogContent, so remove this one */}
            <div className="flex items-start gap-3">
              <div>
                <div className="h-10 w-10 rounded-full bg-white/20 flex items-center justify-center animate-pulse">
                  <FileText className="h-5 w-5 text-white" />
                </div>
              </div>
              <div className="flex-1">
                <div className="flex flex-wrap items-center">
                  <h2 className="text-lg font-semibold">{ticket.ticketNumber}</h2>
                </div>
              </div>
            </div>
          </div>

          {/* Tabs Navigation */}
          <div className="bg-white border-b px-6 py-2 shrink-0">
            <Tabs
              defaultValue="details"
              className="w-full"
              value={activeTab}
              onValueChange={handleTabChange}
            >
              <TabsList className="grid grid-cols-3 w-full max-w-md">
                <TabsTrigger
                  type="button" // Set explicit button type
                  value="details"
                  className="data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700 transition-all duration-200"
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Details
                </TabsTrigger>
                <TabsTrigger
                  type="button" // Set explicit button type
                  value="discussions"
                  className="data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700 transition-all duration-200"
                >
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Discussions
                </TabsTrigger>
                {canResolve && (
                  <TabsTrigger
                    value="resolve"
                    className="data-[state=active]:bg-green-50 data-[state=active]:text-green-700 transition-all duration-200"
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Resolve
                  </TabsTrigger>
                )}
              </TabsList>
            </Tabs>
          </div>

          {/* Content area with proper scrolling */}
          <div className="flex-1 overflow-auto bg-gray-50">
            {activeTab === "details" && (
              <div className="p-6 mt-0 animate-in fade-in-0 duration-300">
                <TicketDetailsView
                  ticket={ticket}
                  description={ticketDescription}
                  discussions={discussions}//
                />
              </div>
            )}
            {activeTab === "discussions" && (
              <div className="mt-0 flex flex-col animate-in fade-in-0 duration-300">
                <div className="flex items-center justify-between p-4 border-b bg-white sticky top-0 z-10">
                  <h3 className="text-sm font-medium">Conversation History</h3>
                  <Button
                    variant="outline"
                    size="sm"
                    type="button"
                    onClick={handleRefreshDiscussions}
                    disabled={loadingDiscussions}
                    className="h-8 px-2 transition-all duration-200 hover:scale-105 hover:shadow-sm"
                  >
                    <RefreshCw className={cn(
                      "h-3.5 w-3.5 mr-1",
                      loadingDiscussions && "animate-spin"
                    )} />
                    Refresh
                  </Button>
                </div>
                <TicketDiscussions
                  discussions={discussions}
                  loading={loadingDiscussions}
                />
              </div>
            )}
            {activeTab === "resolve" && (
              <div className="p-6 flex justify-center animate-in fade-in-0 duration-300">
                <ResolveTicketView
                  ticket={ticket}
                  remarks={resolutionRemarks}
                  setRemarks={setResolutionRemarks}
                  onConfirm={handleResolveConfirm}
                  isSubmitting={isSubmitting}
                  handleKeyDown={handleKeyDown}
                />
              </div>
            )}
          </div>

          {/* Fixed footer */}
          <div className="border-t bg-white p-4 flex justify-between shrink-0 sticky bottom-0">
            {canResolve && activeTab === "resolve" ? (
              <div className="flex w-full justify-between">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.preventDefault();
                    setActiveTab("details");
                  }}
                  className="transition-all duration-200 hover:scale-105"
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  size="sm"
                  onClick={(e) => {
                    e.preventDefault();
                    handleResolveConfirm();
                  }}
                  disabled={!resolutionRemarks.trim() || isSubmitting}
                  className="bg-green-600 hover:bg-green-700 transition-all duration-200 hover:scale-105 disabled:hover:scale-100"
                >
                  {isSubmitting ? (
                    <>
                      <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></span>
                      Submitting...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Resolve Ticket
                    </>
                  )}
                </Button>
              </div>
            ) : (
              <div className="flex space-x-3">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={(e) => {
                    e.preventDefault();
                    setActiveTab(activeTab === "details" ? "discussions" : "details");
                  }}
                  className="transition-all duration-200 hover:scale-105"
                >
                  {activeTab === "details" ? (
                    <>
                      <MessageSquare className="h-4 w-4 mr-2" />
                      View Discussions
                    </>
                  ) : (
                    <>
                      <FileText className="h-4 w-4 mr-2" />
                      View Details
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

// // Ticket Details View Component with improved layout
// const TicketDetailsView = ({ ticket, description }) => {
//   return (
//     <div className="space-y-6 max-w-4xl mx-auto">
//       {/* Single Ticket Details Card */}
//       <div className="bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow duration-300">
//         <div className="bg-gradient-to-r from-blue-50 to-blue-100 px-4 py-3 border-b border-blue-200">
//           <div className="flex items-center">
//             <FileText className="h-4 w-4 text-blue-600 mr-2" />
//             <h3 className="font-medium text-blue-800">Ticket Details</h3>
//           </div>
//         </div>
//         <div className="p-4">
//           <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-8 text-sm">
//             <div>
//               <span className="text-gray-500 block mb-1">Customer Name</span>
//               <div className="font-medium">{ticket.customerName || "N/A"}</div>
//             </div>
//             <div>
//               <span className="text-gray-500 block mb-1">Status</span>
//               <Badge
//                 className={cn(
//                   "font-normal transition-all duration-200 hover:scale-105",
//                   getStatusClasses(ticket.status)
//                 )}
//               >
//                 {ticket.status}
//               </Badge>
//             </div>
//             <div>
//               <span className="text-gray-500 block mb-1">Email</span>
//               <div className="flex items-center">
//                 <Mail className="h-3.5 w-3.5 mr-1" />
//                 {ticket.customerEmail || "N/A"}
//               </div>
//             </div>
//             <div>
//               <span className="text-gray-500 block mb-1">Priority</span>
//               <Badge
//                 variant={getPriorityVariant(ticket.priority)}
//                 className="transition-all duration-200 hover:scale-105"
//               >
//                 {ticket.priority}
//               </Badge>
//             </div>
//             <div>
//               <span className="text-gray-500 block mb-1">Phone</span>
//               <div className="flex items-center">
//                 <Smartphone className="h-3.5 w-3.5 mr-1" />
//                 {ticket.customerPhoneNumber || "N/A"}
//               </div>
//             </div>
//             <div>
//               <span className="text-gray-500 block mb-1">Created</span>
//               <div className="flex items-center">
//                 <Calendar className="h-3.5 w-3.5 mr-1 text-gray-400" />
//                 {formatDate(ticket.createdAt, true)}
//               </div>
//             </div>
//             <div>
//               <span className="text-gray-500 block mb-1">Department</span>
//               <div>{ticket.department || "N/A"}</div>
//             </div>
//             <div>
//               <span className="text-gray-500 block mb-1">SLA Target</span>
//               <div className={cn(
//                 "flex items-center font-medium",
//                 getSLAColorClass(ticket.slaDeadline)
//               )}>
//                 <Clock3 className="h-3.5 w-3.5 mr-1" />
//                 {formatDeadline(ticket.slaDeadline)}
//               </div>
//             </div>
//           </div>
//         </div>
//       </div>

//       {/* Issue Description */}
//       <div className="bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow duration-300">
//         <div className="bg-gradient-to-r from-blue-50 to-blue-100 px-4 py-3 border-b border-blue-200">
//           <div className="flex items-center">
//             <AlertCircle className="h-4 w-4 text-blue-600 mr-2" />
//             <h3 className="font-medium text-blue-800">Description</h3>
//           </div>
//         </div>
//         <div className="p-4">
//           <div className="bg-gray-50 border border-gray-200 rounded-md p-4 whitespace-pre-wrap text-sm">
//             {description || "No description provided."}
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };

const TicketDetailsView = ({ ticket, discussions = [] }) => {
  // Get description from first discussion entry if available
  const descriptionFromDiscussion = discussions.length > 0 ? discussions[0].message : null;
  const displayDescription = descriptionFromDiscussion || ticket.description || "No description provided.";

  // SLA breached logic
  const breached = ticket.slaDeadline && new Date(ticket.slaDeadline) < new Date();
  
  // Priority badge styling based on priority level
  const getPriorityBadgeStyle = (priority) => {
    switch (priority?.toUpperCase()) {
      case 'HIGH': case 'P1': return 'bg-gradient-to-r from-red-500 to-rose-600';
      case 'MEDIUM': case 'P2': return 'bg-gradient-to-r from-amber-500 to-orange-600';
      case 'LOW': case 'P3': return 'bg-gradient-to-r from-green-500 to-emerald-600';
      default: return 'bg-gradient-to-r from-blue-500 to-blue-600';
    }
  };
  
  return (
    <div className="flex flex-col gap-4 pb-0">
      {/* Customer Section - Enhanced with light blue gradient */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden border-l-4 border-l-blue-500 hover:shadow-md transition-all duration-300">
        <div className="px-4 py-3 flex items-center justify-between bg-gradient-to-r from-blue-50/80 to-blue-50/40">
          <div className="flex items-center">
            <User className="h-4 w-4 text-blue-600 mr-2" />
            <h3 className="font-medium text-blue-800">Customer Information</h3>
          </div>
        </div>
        <div className="p-4 grid grid-cols-3 gap-4 bg-gradient-to-br from-white to-blue-50/30">
          <div>
            <span className="text-blue-900/80 text-xs uppercase block mb-1 font-semibold">Name</span>
            <p className="text-gray-900">{ticket.customerName}</p>
          </div>
          <div>
            <span className="text-blue-900/80 text-xs uppercase block mb-1 font-semibold">Email</span>
            <p className="text-gray-900 truncate">{ticket.customerEmail || "N/A"}</p>
          </div>
          <div>
            <span className="text-blue-900/80 text-xs uppercase block mb-1 font-semibold">Phone</span>
            <p className="text-gray-900">{ticket.customerPhoneNumber || "N/A"}</p>
          </div>
        </div>
      </div>
      
      {/* Ticket Information - Enhanced with light blue gradient */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden border-l-4 border-l-indigo-500 hover:shadow-md transition-all duration-300">
        <div className="px-4 py-3 bg-gradient-to-r from-indigo-50/80 to-indigo-50/40">
          <div className="flex items-center">
            <FileText className="h-4 w-4 text-indigo-600 mr-2" />
            <h3 className="font-medium text-indigo-800">Ticket Information</h3>
           <div className="ml-2">
              {/* Small oval priority badge without dot */}
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full text-white ${getPriorityBadgeStyle(ticket.priority)}`}>
                {ticket.priority}
              </span>
            </div>
          </div>
        </div>
        <div className="px-4 pb-4 pt-1 grid grid-cols-3 gap-x-4 gap-y-4 bg-gradient-to-br from-white to-blue-50/25">
          {/* Column 1 */}
          <div>
            <span className="text-indigo-900/80 text-xs uppercase block mb-1 font-semibold">Ticket Number</span>
            <div className="flex items-center">
              <div className="h-2 w-2 rounded-full bg-indigo-400 mr-2"></div>
              <p className="text-gray-900">{ticket.ticketNumber}</p>
            </div>
          </div>
          
          <div>
            <span className="text-indigo-900/80 text-xs uppercase block mb-1 font-semibold">Status</span>
            <Badge className={`${getStatusClasses(ticket.status)}`}>
              {ticket.status}
            </Badge>
          </div>
          <div>
            <span className="text-indigo-900/80 text-xs uppercase block mb-1 font-semibold">Created</span>
            <div className="flex items-center text-gray-900">
              <Calendar className="h-3.5 w-3.5 mr-1.5 text-indigo-500" />
              <span>{formatDate(ticket.createdAt, true)}</span>
            </div>
          </div>
          
          
          {/* Row 2 */}
          <div>
            <span className="text-indigo-900/80 text-xs uppercase block mb-1 font-semibold">Department</span>
            <div className="flex items-center">
              <div className="h-2 w-2 rounded-full bg-indigo-400 mr-2"></div>
              <p className="text-gray-900">{ticket.department}</p>
            </div>
          </div>
          
          <div>
            <span className="text-indigo-900/80 text-xs uppercase block mb-1 font-semibold">Source</span>
            <div className="flex items-center">
              <div className="h-2 w-2 rounded-full bg-indigo-400 mr-2"></div>
              <p className="text-gray-900">{ticket.sourceType || "N/A"}</p>
            </div>
          </div>
          
          <div>
            <span className="text-indigo-900/80 text-xs uppercase block mb-1 font-semibold">SLA Deadline</span>
            <div className={`flex items-center ${getSLAColorClass(ticket.slaDeadline)}`}>
              <Clock className="h-3.5 w-3.5 mr-1.5" />
              {ticket.slaDeadline ? (
                breached ? (
                  <span>SLA Breached ({formatDate(ticket.slaDeadline, true)})</span>
                ) : (
                  <span>{formatDeadline(ticket.slaDeadline)}</span>
                )
              ) : (
                <span className="text-gray-500">No SLA</span>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Description Section - Enhanced with light blue gradient */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden border-l-4 border-l-violet-500 hover:shadow-md transition-all duration-300">
        <div className="px-4 py-3 bg-gradient-to-r from-violet-50/80 to-violet-50/40">
          <div className="flex items-center">
            <AlertCircle className="h-4 w-4 text-violet-600 mr-2" />
            <h3 className="font-medium text-violet-800">Description</h3>
          </div>
        </div>
        <div className="p-4 bg-gradient-to-br from-white to-blue-50/25">
          <div className="bg-white border border-gray-200 rounded-md p-4 whitespace-pre-wrap text-sm shadow-sm">
            {displayDescription}
          </div>
        </div>
      </div>
    </div>
  );
};

// Enhanced Ticket Discussions Component with improved tooltips
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
    <div className="flex-1 p-6 space-y-4">
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
              "max-w-[80%] rounded-lg p-4 shadow-sm group relative hover:shadow-md transition-shadow duration-200",
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

                    {/* IMPROVED TOOLTIP */}
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
              <p className="text-sm whitespace-pre-wrap">{discussion.message}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
};

// Resolve Ticket View Component
const ResolveTicketView = ({
  ticket,
  remarks,
  setRemarks,
  onConfirm,
  isSubmitting,
  handleKeyDown
}) => {
  return (
    <div className="w-full max-w-2xl bg-white rounded-lg shadow-sm overflow-hidden border border-green-100 animate-in fade-in-0 duration-300">
      <div className="bg-gradient-to-r from-green-50 to-green-100 px-4 py-3 border-b border-green-200">
        <div className="flex items-center">
          <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
          <h3 className="font-medium text-green-800">Resolve Ticket #{ticket.ticketNumber}</h3>
        </div>
      </div>
      <div className="p-5 space-y-4">
        <div className="text-sm text-gray-700 bg-green-50 p-3 rounded-md border border-green-100">
          <p>
            You are about to resolve the ticket for <strong>{ticket.customerName}</strong>.
          </p>
          <p className="mt-2">
            Please provide detailed information about how the issue was resolved.
            These notes will be sent to the customer.
          </p>
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between">
            <label className="block text-sm font-medium text-gray-700">
              Resolution Notes <span className="text-red-500">*</span>
            </label>
            <span className="text-xs text-gray-500">
              {remarks.length}/300 characters
            </span>
          </div>
          <Textarea
            placeholder="Please provide detailed information about how the issue was resolved..."
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
            onKeyDown={handleKeyDown} // This passes the keyboard event handler
            rows={6}
            maxLength={300}
            className="resize-none w-full focus:ring-green-500 focus:border-green-500 transition-all duration-200 focus:shadow-sm"
          />
          <p className="text-xs text-gray-500 mt-1 flex items-center">
            <AlertCircle className="h-3 w-3 mr-1" />
            These notes will be visible to the customer
          </p>
        </div>

        <div className="bg-gray-50 border border-gray-200 rounded-md p-4">
          <h4 className="text-xs uppercase text-gray-500 mb-2">Original Issue</h4>
          <p className="text-sm">{ticket.description}</p>
        </div>
      </div>
    </div>
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

const formatDeadline = (dateString) => {
  if (!dateString) return "No SLA";
  const deadline = new Date(dateString);
  const now = new Date();
  const timeLeft = deadline - now;

  if (timeLeft < 0) return "SLA Breached";
  if (timeLeft < 2 * 60 * 60 * 1000) {
    const minutesLeft = Math.floor(timeLeft / (60 * 1000));
    return `${minutesLeft} min left`;
  }
  if (timeLeft < 24 * 60 * 60 * 1000) {
    const hoursLeft = Math.floor(timeLeft / (60 * 60 * 1000));
    return `${hoursLeft} hours left`;
  }
  const daysLeft = Math.floor(timeLeft / (24 * 60 * 60 * 1000));
  return `${daysLeft} days left`;
};

const getPriorityVariant = (priority) => {
  switch (priority?.toUpperCase()) {
    case 'HIGH': case 'P1': return 'destructive';
    case 'MEDIUM': case 'P2': return 'warning';
    case 'LOW': case 'P3': return 'default';
    default: return 'secondary';
  }
};

const getSLAColorClass = (dateString) => {
  if (!dateString) return "text-gray-600";

  const deadline = new Date(dateString);
  const now = new Date();
  const timeLeft = deadline - now;

  if (timeLeft < 0) return "text-red-600";
  if (timeLeft < 2 * 60 * 60 * 1000) return "text-red-600";
  if (timeLeft < 4 * 60 * 60 * 1000) return "text-amber-600";
  return "text-green-600";
};

const getStatusClasses = (status) => {
  switch (status?.toLowerCase()) {
    case 'open': return 'bg-blue-50 text-blue-700 border-blue-200';
    case 'in progress': return 'bg-amber-50 text-amber-700 border-amber-200';
    case 'resolved': return 'bg-green-50 text-green-700 border-green-200';
    case 'closed': return 'bg-gray-50 text-gray-700 border-gray-200';
    default: return 'bg-gray-50 text-gray-700 border-gray-200';
  }
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