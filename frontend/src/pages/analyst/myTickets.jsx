import { useState, useEffect, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Inbox, RefreshCw, User, Building, Search, Clock, ArrowUpDown } from 'lucide-react';
import { AnalystMainLayout } from '@/components/analyst/analystMainLayout.jsx';
import { TicketDetailsPanel } from './TicketDetailsPanel.jsx';
import { useToast } from '@/hooks/use-toast';
import axiosClient from '@/utils/AxiosClient.jsx';
import { cn } from '@/utils/utils';
import { motion } from 'framer-motion';
import { io as socketIOClient } from 'socket.io-client';

// Error component for unauthorized users
const NotAnalyst = () => (
  <div className="flex h-screen items-center justify-center bg-gray-50">
    <div className="text-center">
      <h1 className="text-2xl font-bold text-red-600 mb-4">Access Restricted</h1>
      <p className="text-gray-700">You do not have the required permissions to access this page.</p>
    </div>
  </div>
);

// SLA Timer component
const SlaTimer = ({ deadline }) => {
  const [timeRemaining, setTimeRemaining] = useState("");

  useEffect(() => {
    const updateTimer = () => {
      if (!deadline) return;
      const now = new Date();
      const deadlineDate = new Date(deadline);
      const timeDiff = deadlineDate - now;
      if (timeDiff > 0) {
        const hours = Math.floor(timeDiff / (1000 * 60 * 60));
        const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));
        setTimeRemaining(`${hours}h ${minutes}m remaining`);
      } else {
        const elapsed = Math.abs(timeDiff);
        const hours = Math.floor(elapsed / (1000 * 60 * 60));
        const minutes = Math.floor((elapsed % (1000 * 60 * 60)) / (1000 * 60));
        setTimeRemaining(`Breached ${hours}h ${minutes}m ago`);
      }
    };
    updateTimer();
    const intervalId = setInterval(updateTimer, 60000);
    return () => clearInterval(intervalId);
  }, [deadline]);

  return (
    <div className="flex items-center gap-1">
      <Clock className="h-3 w-3" />
      <span className="text-xs">{timeRemaining || "N/A"}</span>
    </div>
  );
};

const MyTickets = () => {
  const [isAnalyst, setIsAnalyst] = useState(null);
  const [tickets, setTickets] = useState([]);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [sortConfig, setSortConfig] = useState({ key: 'slaDeadline', direction: 'asc' });
  const [filterConfig] = useState({ status: 'all', priority: 'all' });
  const { toast } = useToast();
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const socketRef = useRef(null);
  const [activeTab, setActiveTab] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [timeFilter, setTimeFilter] = useState('all');

  // Analyst role check
  useEffect(() => {
    const checkAnalystRole = async () => {
      try {
        const response = await axiosClient.get('/analyst', { withCredentials: true });
        const isUserAnalyst = response.data.success;
        setIsAnalyst(isUserAnalyst);
        
        // Immediately fetch tickets if user is an analyst
        if (isUserAnalyst) {
          await fetchMyTickets();
        }
      } catch (error) {
        setIsAnalyst(false);
        toast({
          title: "Error",
          description: "Failed to verify analyst role",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };
    checkAnalystRole();
    // eslint-disable-next-line
  }, []);

  // WebSocket connection and ticket updates
  useEffect(() => {
    if (isAnalyst) {
      // Don't fetch tickets here - it's now handled in the checkAnalystRole function
      if (!socketRef.current) {
        try {
          socketRef.current = socketIOClient(import.meta.env.VITE_SOCKET_IO_URI, { withCredentials: true });
          socketRef.current.on("connect", () => {
            console.log("Socket connected successfully");
            // Test the connection by sending a test event
            socketRef.current.emit("ping", "test");
          });
          socketRef.current.on("disconnect", () => {
            toast({
              title: "WebSocket Disconnected",
              description: "Real-time updates are unavailable. Please refresh or check your connection.",
              variant: "destructive"
            });
          });
          socketRef.current.on("connect_error", (err) => {
            console.error("Socket connection error:", err);
            toast({
              title: "WebSocket Connection Error",
              description: "Could not connect to real-time updates. Please check your network.",
              variant: "destructive"
            });
          });
        } catch (err) {
          console.error("WebSocket initialization error:", err);
          toast({
            title: "WebSocket Error",
            description: "WebSocket connection failed.",
            variant: "destructive"
          });
        }
      }
      
      // Create event handler functions (defined here to have access to state)
      const handleTicketsAssigned = () => {
        console.log("Tickets assigned event received");
        fetchMyTickets();
      };

      const handleTicketsUpdated = () => {
        console.log("Tickets updated event received");
        fetchMyTickets();
      };
      
      const ticketResolvedHandler = (ticketId) => {
        console.log("Ticket resolved event received for ticket:", ticketId);
        
        if (!ticketId) {
          console.error("Received ticketResolved event without ticketId");
          fetchMyTickets(); // Refresh all tickets as fallback
          return;
        }
        
        // Immediately update the state for resolved tickets
        setTickets(prevTickets => {
          console.log("Current tickets:", prevTickets.map(t => t._id));
          console.log("Filtering out resolved ticket:", ticketId);
          
          // Ensure we're doing string comparison for reliable ID matching
          const updatedTickets = prevTickets.filter(ticket => String(ticket._id) !== String(ticketId));
          console.log(`Filtered tickets: ${prevTickets.length} -> ${updatedTickets.length}`);
          return updatedTickets;
        });
        
        // Close the ticket panel if open
        if (selectedTicket && String(selectedTicket._id) === String(ticketId)) {
          console.log("Closing ticket panel for resolved ticket");
          setSelectedTicket(null);
        }
      };
      

      
      // Set up event listeners for real-time updates
      socketRef.current.on("ticketsAssigned", handleTicketsAssigned);
      socketRef.current.on("ticketsUpdated", handleTicketsUpdated);
      socketRef.current.on("ticketResolved", ticketResolvedHandler);

      return () => {
        if (socketRef.current) {
          console.log("Cleaning up socket event listeners");
          socketRef.current.off("ticketsAssigned", handleTicketsAssigned);
          socketRef.current.off("ticketsUpdated", handleTicketsUpdated);
          socketRef.current.off("ticketResolved", ticketResolvedHandler);
          socketRef.current.disconnect();
          socketRef.current = null;
        }
      };
    }
    // eslint-disable-next-line
  }, [isAnalyst, selectedTicket]);


  const fetchMyTickets = async () => {
    try {
      // Only set loading on initial load, not on background refreshes
      const isInitialLoad = tickets.length === 0;
      if (isInitialLoad) {
        setLoading(true);
      }
      
      const response = await axiosClient.get('/analyst/my-tickets', { withCredentials: true });
      const fetchedTickets = response.data.data || [];
      console.log("Fetched tickets:", fetchedTickets.length);
      
      setTickets(fetchedTickets);
      setLastUpdated(new Date());
    } catch (error) {
      console.error("Error fetching tickets:", error);
      let message = "Failed to fetch your assigned tickets";
      if (error.response?.status === 403) {
        message = "You are not authorized to view these tickets. Please login again.";
      }
      toast({
        title: "Error",
        description: message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle ticket selection
  const handleTicketSelect = (ticket) => {
    setSelectedTicket(ticket);
  };

  // Handle ticket resolution
  const handleResolveTicket = async (ticketId, remarks) => {
    try {
      console.log("Resolving ticket:", ticketId);
      
      const response = await axiosClient.put(`/analyst/resolve/${ticketId}`, {
        remarks: remarks
      }, { withCredentials: true });

      if (response.data.success) {
        console.log("Ticket successfully resolved:", ticketId);
        
        // Update the local state immediately to REMOVE the resolved ticket
        setTickets(prevTickets => {
          console.log("Current tickets before filtering:", prevTickets.length);
          
          // Ensure we're doing string comparison for reliable ID matching
          const ticketIdStr = String(ticketId);
          const updatedTickets = prevTickets.filter(ticket => {
            const currentId = String(ticket._id);
            const keep = currentId !== ticketIdStr;
            if (!keep) {
              console.log(`Removing ticket with ID ${currentId}`);
            }
            return keep;
          });
          
          console.log("Tickets after filtering:", updatedTickets.length);
          return updatedTickets;
        });
        
        // Close the ticket details panel if the resolved ticket was selected
        if (selectedTicket && String(selectedTicket._id) === String(ticketId)) {
          console.log("Closing ticket panel for resolved ticket");
          setSelectedTicket(null);
        }
        
        toast({
          title: "Ticket Resolved",
          description: "The ticket has been successfully resolved.",
        });
        return true;
      } else {
        throw new Error(response.data.message || 'Failed to resolve ticket');
      }
    } catch (error) {
      console.error("Error resolving ticket:", error);
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to resolve the ticket",
        variant: "destructive"
      });
      throw error;
    }
  };

  // Handle status update
  const handleStatusUpdate = async (ticketId, newStatus, reply = null) => {
    try {
      await axiosClient.put(`/api/tickets/${ticketId}/status`, {
        status: newStatus,
        reply: reply
      });
      
      // Update the local state immediately to reflect the status change
      setTickets(prevTickets => 
        prevTickets.map(ticket => 
          ticket._id === ticketId ? { ...ticket, status: newStatus } : ticket
        )
      );
      
      // Close the ticket details panel if this ticket's status was updated to something other than 'In Progress'
      if (selectedTicket && selectedTicket._id === ticketId && newStatus !== 'In Progress') {
        setSelectedTicket(null);
      }
      
      // Also fetch fresh data from the server
      await fetchMyTickets();
      
      toast({
        title: "Status Updated",
        description: `Ticket status changed to ${newStatus}.`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update ticket status",
        variant: "destructive"
      });
    }
  };

  // Sort tickets
  const sortTickets = (tickets) => {
    return [...tickets].sort((a, b) => {
      if (sortConfig.key === 'priority') {
        const priorityOrder = { P1: 3, HIGH: 3, P2: 2, MEDIUM: 2, P3: 1, LOW: 1 };
        const valA = priorityOrder[a[sortConfig.key]?.toUpperCase()] || 0;
        const valB = priorityOrder[b[sortConfig.key]?.toUpperCase()] || 0;
        return sortConfig.direction === 'asc' ? valA - valB : valB - valA;
      }
      if (sortConfig.key === 'slaDeadline') {
        const dateA = new Date(a[sortConfig.key] || 0);
        const dateB = new Date(b[sortConfig.key] || 0);
        return sortConfig.direction === 'asc'
          ? dateA.getTime() - dateB.getTime()
          : dateB.getTime() - dateA.getTime();
      }
      const valA = a[sortConfig.key] || '';
      const valB = b[sortConfig.key] || '';
      if (sortConfig.direction === 'asc') {
        return valA.localeCompare(valB);
      } else {
        return valB.localeCompare(valA);
      }
    });
  };

  // Change sort direction
  const handleSort = (key) => {
    setSortConfig(prevConfig => ({
      key,
      direction: prevConfig.key === key && prevConfig.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  // Filter and sort tickets
  const processedTickets = () => {
    console.log("Processing tickets, total count:", tickets.length);
    // Filter out any resolved tickets and keep only 'In Progress' ones
    // Also apply search filter if any text is entered in the search field
    let result = tickets.filter(ticket => {
      // Log ticket status for debugging
      console.log(`Ticket ${ticket._id} status: ${ticket.status}`);
      
      // Only include tickets that are in progress
      if (!ticket.status || (ticket.status !== 'In Progress' && ticket.status !== 'In Progress')) {
        console.log(`Filtering out ticket ${ticket._id} with status ${ticket.status}`);
        return false;
      }
      
      // Apply search filter if search term exists
      if (!searchTerm) return true;
      
      return (
        ticket.ticketNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ticket.customerPhoneNumber?.toString().includes(searchTerm) ||
        ticket.customerName?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    });

    if (sortConfig.key === 'slaDeadline') {
      result.sort((a, b) => {
        const getCategory = (ticket) => {
          if (!ticket.slaDeadline) return 4;
          const deadline = new Date(ticket.slaDeadline);
          const now = new Date();
          const timeLeft = deadline - now;
          if (timeLeft < 0) return 0;
          if (timeLeft < 2 * 60 * 60 * 1000) return 1;
          if (timeLeft < 4 * 60 * 60 * 1000) return 2;
          return 3;
        };
        const catA = getCategory(a);
        const catB = getCategory(b);
        if (catA === catB) {
          const deadlineA = new Date(a.slaDeadline || 0);
          const deadlineB = new Date(b.slaDeadline || 0);
          return sortConfig.direction === 'asc'
            ? deadlineA.getTime() - deadlineB.getTime()
            : deadlineB.getTime() - deadlineA.getTime();
        }
        return sortConfig.direction === 'asc'
          ? catA - catB
          : catB - catA;
      });
      return result;
    }
    return sortTickets(result);
  };

  const filteredTickets = processedTickets();

  if (isAnalyst === null || loading) {
    return (
      <div className="flex h-screen bg-gray-50 items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
          <p className="text-gray-600">Loading your tickets...</p>
        </div>
      </div>
    );
  }

  if (!isAnalyst) {
    return <NotAnalyst />;
  }
 

  return (
    <div className="flex h-screen bg-white">
      <AnalystMainLayout />
      <div className="flex-1 flex flex-col overflow-hidden pt-16">
        <div className="flex-1 flex overflow-hidden">
          {/* Main Content */}
          <div className="flex-1 overflow-auto p-6">
            {/* Tabs UI */}
            <div className="mb-4">
              <div className="flex gap-2">
                {['all', 'Open', 'In Progress', 'Resolved', 'Closed'].map(tab => (
                  <Button
                    key={tab}
                    variant={activeTab === tab ? 'default' : 'outline'}
                    onClick={() => setActiveTab(tab)}
                  >
                    {tab}
                  </Button>
                ))}
              </div>
            </div>
            {/* Search and Filter */}
            <div className="mb-6 flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search by ticket number, Customer name or phone number"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => handleSort("slaDeadline")}
                  className="text-gray-700"
                >
                  <ArrowUpDown className="h-4 w-4 mr-1" />
                  SLA{" "}
                  {sortConfig.key === "slaDeadline" &&
                    (sortConfig.direction === "asc" ? "↑" : "↓")}
                </Button>
                <Button
                  variant="outline"
                  onClick={fetchMyTickets}
                  className="text-blue-600 border-blue-600 hover:bg-blue-50"
                >
                  Refresh
                </Button>
              </div>
            </div>
            {/* All Assigned Tickets Section */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                  <Inbox className="h-6 w-6 text-blue-600" />
                  Assigned Tickets
                </h2>
                <div className="flex items-center gap-2">
                  <Badge
                    variant="outline"
                    className="bg-blue-50 border-blue-200"
                  >
                    {filteredTickets.length} Total
                  </Badge>
                </div>
              </div>
              {filteredTickets.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <Card className="p-8 text-center bg-gray-50 border-dashed border-2">
                    <div className="text-gray-500 flex flex-col items-center">
                      <Inbox className="h-12 w-12 text-gray-400 mb-4" />
                      <h3 className="text-lg font-medium mb-2">
                        No tickets assigned
                      </h3>
                      <p className="max-w-md mx-auto">
                        You currently don't have any tickets assigned to you.
                        New tickets will appear here.
                      </p>
                    </div>
                  </Card>
                </motion.div>
              ) : (
                <motion.div
                  className="grid gap-4"
                  initial="hidden"
                  animate="visible"
                  variants={{
                    hidden: { opacity: 0 },
                    visible: {
                      opacity: 1,
                      transition: {
                        staggerChildren: 0.1,
                      },
                    },
                  }}
                >
                  {filteredTickets.map((ticket) => {
                    let borderColor = "border-gray-200";
                    let bgGradient = "from-white to-blue-50";
                    if (ticket.slaDeadline) {
                      const deadline = new Date(ticket.slaDeadline);
                      const now = new Date();
                      const timeLeft = deadline - now;
                      if (timeLeft < 0) {
                        // borderColor = "border-red-500";
                        // bgGradient = "from-white to-blue-50";
                      } else if (timeLeft < 2 * 60 * 60 * 1000) {
                        // borderColor = "border-orange-500";
                        // bgGradient = "from-white to-orange-50";
                      } else if (timeLeft < 4 * 60 * 60 * 1000) {
                        // borderColor = "border-yellow-500";
                        // bgGradient = "from-white to-yellow-50";
                      } else {
                        // borderColor = "border-green-500";
                        // bgGradient = "from-white to-green-50";
                      }
                    }
                    return (
                      <motion.div
                        key={ticket._id}
                        variants={{
                          hidden: { opacity: 0, y: 20 },
                          visible: { opacity: 1, y: 0 },
                        }}
                        whileHover={{ scale: 1.01 }}
                        transition={{
                          type: "spring",
                          stiffness: 300,
                          damping: 30,
                        }}
                      >
                        <Card
                          className={`border-l-4 overflow-hidden shadow-sm hover:shadow-md transition-all ${borderColor} bg-gradient-to-r ${bgGradient}`}
                        >
                          <CardContent className="p-5">
                            <div className="flex justify-between items-start">
                              <div className="space-y-2">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <h3 className="font-bold text-lg text-gray-900">
                                    {ticket.ticketNumber}
                                  </h3>
                                  <Badge
                                    variant="outline"
                                    className={cn(
                                      getPriorityClass(ticket.priority)
                                    )}
                                  >
                                    {ticket.priority}
                                  </Badge>
                                  <Badge
                                    variant="outline"
                                    className={cn({
                                      "bg-blue-50 text-blue-700 border-blue-200":
                                        ticket.status === "Open",
                                      "bg-amber-50 text-amber-700 border-amber-200":
                                        ticket.status === "In Progress",
                                      "bg-green-50 text-green-700 border-green-200":
                                        ticket.status === "Resolved",
                                      "bg-gray-50 text-gray-700 border-gray-200":
                                        ticket.status === "Closed",
                                    })}
                                  >
                                    {ticket.status}
                                  </Badge>
                                </div>
                                <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                                  <div className="flex items-center gap-1">
                                    <User className="h-3.5 w-3.5 text-gray-500" />
                                    <span className="text-gray-700">
                                      {ticket.customerName || "Unknown"}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <Building className="h-3.5 w-3.5 text-gray-500" />
                                    <span className="text-gray-700">
                                      {ticket.department || "N/A"}
                                    </span>
                                  </div>
                                </div>
                              </div>
                              <div className="text-right flex flex-col items-end">
                                     <p
                                        className={cn(
                                          "text-sm font-medium",
                                          getSLAColorClass(ticket.slaDeadline)
                                        )}
                                      >
                                        SLA: {formatDeadline(ticket.slaDeadline)}
                                      </p>
                                      <SlaTimer deadline={ticket.slaDeadline} />
                              </div>
                            </div>
                            <div className="mt-3 bg-gray-50 p-3 rounded-md">
                              <p className="text-gray-700 line-clamp-2 text-sm">
                                <span className="font-medium">
                                  Description:
                                </span>{" "}
                                {truncateText(ticket.description, 80) ||
                                  "No description provided."}
                              </p>
                            </div>
                            <div className="mt-4 flex justify-between items-center">
                              <div className="flex items-center text-sm text-gray-500">
                                <Clock className="h-3.5 w-3.5 mr-1" />
                                <span>{timeAgo(ticket.createdAt)}</span>
                              </div>
                              <div className="flex gap-2">
                                <Button
                                  variant="default"
                                  size="sm"
                                  className="bg-blue-600 hover:bg-blue-700 text-white"
                                  onClick={() => handleTicketSelect(ticket)}
                                >
                                  View Details
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    );
                  })}
                </motion.div>
              )}
            </div>
          </div>
          {/* Right Sidebar - Quick Actions */}
          <div className="hidden lg:block w-80 bg-white border-l border-gray-200 p-6 overflow-auto">
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-3">Quick Stats</h3>
                <div className="grid grid-cols-2 gap-3">
                  <Card className="p-3 text-center">
                    <h3 className="text-2xl font-bold text-blue-600">
                      {tickets.filter(t => t.status === 'In Progress').length}
                    </h3>
                    <p className="text-xs text-gray-600">In Progress</p>
                  </Card>
                  <Card className="p-3 text-center">
                    <h3 className="text-2xl font-bold text-green-600">
                      {tickets.filter(t => t.status === 'Resolved').length}
                    </h3>
                    <p className="text-xs text-gray-600">Resolved</p>
                  </Card>
                </div>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-3">SLA Overview</h3>
                <div className="space-y-2 bg-gray-50 p-3 rounded-md">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Urgent (&lt; 2h)</span>
                    <Badge variant="outline" className="bg-red-50 text-red-600">
                      {tickets.filter(t => {
                        if (!t.slaDeadline) return false;
                        const deadline = new Date(t.slaDeadline);
                        const now = new Date();
                        const timeLeft = deadline - now;
                        return timeLeft > 0 && timeLeft < 2 * 60 * 60 * 1000;
                      }).length}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Breached</span>
                    <Badge variant="outline" className="bg-red-50 text-red-700">
                      {tickets.filter(t => new Date(t.slaDeadline) < new Date()).length}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Good Standing</span>
                    <Badge variant="outline" className="bg-green-50 text-green-700">
                      {tickets.filter(t => {
                        const deadline = new Date(t.slaDeadline);
                        const now = new Date();
                        return deadline > now && deadline - now >= 2 * 60 * 60 * 1000;
                      }).length}
                    </Badge>
                  </div>
                </div>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-3">Priority Breakdown</h3>
                <div className="space-y-2">
                  <div
                    className="h-2 bg-gray-200 rounded-full overflow-hidden"
                    role="progressbar"
                  >
                    {['P1', 'P2', 'P3'].map((priority) => {
                      const count = tickets.filter(t => t.priority === priority).length;
                      const percentage = tickets.length ? (count / tickets.length) * 100 : 0;
                      let color = 'bg-blue-500';
                      if (priority === 'P1') color = 'bg-red-500';
                      if (priority === 'P2') color = 'bg-amber-500';
                      return (
                        <div
                          key={priority}
                          className={`h-full ${color} inline-block`}
                          style={{ width: `${percentage}%` }}
                        ></div>
                      );
                    })}
                  </div>
                  <div className="flex justify-between text-xs text-gray-500">
                    <div className="flex items-center">
                      <span className="h-2 w-2 bg-red-500 rounded-full inline-block mr-1"></span>
                      P1: {tickets.filter(t => t.priority === 'P1').length}
                    </div>
                    <div className="flex items-center">
                      <span className="h-2 w-2 bg-amber-500 rounded-full inline-block mr-1"></span>
                      P2: {tickets.filter(t => t.priority === 'P2').length}
                    </div>
                    <div className="flex items-center">
                      <span className="h-2 w-2 bg-blue-500 rounded-full inline-block mr-1"></span>
                      P3: {tickets.filter(t => t.priority === 'P3').length}
                    </div>
                  </div>
                </div>
              </div>
              <div>
                <Button
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                  onClick={() => fetchMyTickets()}
                >
                  Refresh Data
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* Ticket Details Panel */}
      <TicketDetailsPanel
        open={!!selectedTicket}
        ticket={selectedTicket}
        onClose={() => setSelectedTicket(null)}
        onStatusUpdate={handleStatusUpdate}
        onResolve={handleResolveTicket}
        userId={User?.id}
      />
    </div>
  );
};

// Helper functions
const toIST = (dateString) => {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  const offset = 5.5 * 60 * 60 * 1000;
  const istDate = new Date(date.getTime() + offset);
  return istDate;
};

const formatDate = (dateString) => {
  const istDate = toIST(dateString);
  return istDate === 'N/A'
    ? 'N/A'
    : istDate.toLocaleDateString('en-IN', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
      timeZone: 'Asia/Kolkata'
    });
};

const formatDeadline = (dateString) => {
  if (!dateString) return "No SLA";
  const deadline = new Date(dateString);
  const now = new Date();
  const timeLeft = deadline - now;
  if (timeLeft < 0) return "SLA Breached";
  const hoursLeft = Math.floor(timeLeft / (1000 * 60 * 60));
  const minutesLeft = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
  return `${hoursLeft}h ${minutesLeft}m left`;
};

const getPriorityClass = (priority) => {
  switch (priority?.toUpperCase()) {
    case 'HIGH': case 'P1':
      return 'bg-red-600 text-white border-red-300';
    case 'MEDIUM': case 'P2':
      return 'bg-amber-600 text-white border-amber-300';
    case 'LOW': case 'P3':
      return 'bg-green-600 text-white border-blue-300';
    default:
      return 'bg-gray-600 text-white border-gray-300';
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

const truncateText = (text, wordLimit) => {
  if (!text) return "";
  const words = text.split(' ');
  if (words.length <= wordLimit) return text;
  return words.slice(0, wordLimit).join(' ') + '...';
};

const timeAgo = (date) => {
  if (!date) return "Unknown time";
  const now = new Date();
  const past = new Date(date);
  const diffMs = now - past;
  const diffSec = Math.round(diffMs / 1000);
  const diffMin = Math.round(diffSec / 60);
  const diffHour = Math.round(diffMin / 60);
  const diffDay = Math.round(diffHour / 24);
  if (diffSec < 60) return `${diffSec} seconds ago`;
  if (diffMin < 60) return `${diffMin} minutes ago`;
  if (diffHour < 24) return `${diffHour} hours ago`;
  if (diffDay === 1) return "yesterday";
  return `${diffDay} days ago`;
};

export default MyTickets;