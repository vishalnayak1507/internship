import { useState, useEffect, useRef, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Inbox,
  RefreshCw,
  User,
  Building,
  Search,
  Clock,
  ArrowUpDown,
} from "lucide-react";
import { AnalystMainLayout } from "@/components/analyst/analystMainLayout.jsx";
import { TicketDetailsPanel } from "./TicketDetailsPanel.jsx";
import { toast } from "react-toastify"
import axiosClient from "@/utils/AxiosClient.jsx";
import { cn } from "@/utils/utils";
import { motion } from "framer-motion";
import { io as socketIOClient } from "socket.io-client";
import CreateTicketManualEntry from "@/components/maker/CreateTicketManualEntry.jsx";
import LogoutButton from "@/components/auth/LogoutButton.jsx";
import { fetchProfile } from '../../utils/fetchProfile';
import "react-toastify/dist/ReactToastify.css";


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

const AnalystDashboard = () => {
  const [isAnalyst, setIsAnalyst] = useState(null);
  const [analystId, setAnalystId] = useState(null);
  const [tickets, setTickets] = useState([]);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [sortConfig, setSortConfig] = useState({
    key: "slaDeadline",
    direction: "asc",
  });
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("in progress");
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const socketRef = useRef(null);
  const [showCreateTicketModal, setShowCreateTicketModal] = useState(false);
  const [showTicketsModal, setShowTicketsModal] = useState(false);
  const [myResolvedTickets, setMyResolvedTickets] = useState([]);
  const [user, setUser] = useState(null);
  const [ticketSuccessMessage, setTicketSuccessMessage] = useState("");
  const logoutBtnRef = useRef(null);
  const autoLogoutTriggered = useRef(false);
  // Analyst role check
  useEffect(() => {
    const checkAnalystRole = async () => {
      try {
        const response = await axiosClient.get("/analyst", {
          withCredentials: true,
        });
        setIsAnalyst(response.data.success);
        setAnalystId(response.data.userId);
        if (response.data.success) {
          await fetchTickets();
          await fetchMyResolvedTickets();
        }
      } catch (error) {
        setIsAnalyst(false);
        toast.error("Failed to verify analyst role");
      } finally {
        setLoading(false);
      }
    };
    checkAnalystRole();
    // eslint-disable-next-line
  }, []);

  useEffect(() => {
    const handleAutoLogout = () => {
      if (autoLogoutTriggered.current) {
        return;
      }
      autoLogoutTriggered.current = true;
      setTickets([]);
      setMyResolvedTickets([]);
      setUser(null);
      try {
        if (logoutBtnRef.current) {
          logoutBtnRef.current.handleLogout("reassign");
        }
      } catch (err) {
        console.error("Error during auto logout:", err);
      }
    }
    const interval = setInterval(async () => {
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      if (user.role !== "analyst") return;
      const loginTime = localStorage.getItem("analystLoginTime");
      if (!loginTime) return;

      const now = Date.now();
      const Hours = 8 * 60 * 60 * 1000;

      if (now - Number(loginTime) >= Hours) {
        try {
          const response = await axiosClient.get("/analyst/my-resolved-tickets?hours=8", {
            withCredentials: true,
          });
          const tickets = response.data.tickets || response.data.data?.tickets || [];
          if (tickets.length === 0 && logoutBtnRef.current) {
            handleAutoLogout();
          }
        } catch (err) {
          console.error("Error checking resolved tickets:", err);
        }
      }
    }, 60 * 1000); // every 1 minute

    // Run once immediately on mount
    (async () => {
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      if (user.role !== "analyst") return;
      const loginTime = localStorage.getItem("analystLoginTime");
      if (!loginTime) return;

      const now = Date.now();
      const Hours = 8 * 60 * 60 * 1000;

      if (now - Number(loginTime) >= Hours) {
        try {
          const response = await axiosClient.get("/analyst/my-resolved-tickets?hours=8", {
            withCredentials: true,
          });
          const tickets = response.data.tickets || response.data.data?.tickets || [];
          if (tickets.length === 0 && logoutBtnRef.current) {
            handleAutoLogout();
          }
        } catch (err) {
          console.error("Error checking resolved tickets:", err);
        }
      }
    })();

    return () => clearInterval(interval);
  }, []);

  // WebSocket connection and ticket updates
  useEffect(() => {
    if (!isAnalyst) return;
    if (isAnalyst) {
      fetchTickets();
      fetchMyResolvedTickets();
      if (!socketRef.current) {
        try {
          socketRef.current = socketIOClient(
            import.meta.env.VITE_SOCKET_IO_URI,
            { withCredentials: true }
          );
          socketRef.current.on("connect", () => {
            socketRef.current.emit("ping", "test");
          });
          socketRef.current.on("disconnect", () => {
            toast.error("WebSocket Disconnected: Real-time updates are unavailable. Please refresh or check your connection.");
          });
          socketRef.current.on("connect_error", (err) => {
            toast.error("WebSocket Connection Error: Could not connect to real-time updates. Please check your network.");
          });
          socketRef.current.on("pong", (message) => {
            console.log("Received pong response:", message);
          });
        } catch (err) {
          toast.error("WebSocket connection failed.");
        }
      }

      const handleTicketsAssigned = async () => {
        await fetchTickets();
      };

      const handleTicketsUpdated = async () => {
        await fetchTickets();
      }

      const handleTicketResolved = async (resolvedTicketId) => {
        // Check if this is the currently selected ticket
        if (selectedTicket && selectedTicket._id === resolvedTicketId) {
          setSelectedTicket(null); // Close the details panel if the resolved ticket is currently selected
        }

        // Update both regular tickets and resolved tickets
        await fetchTickets();
        await fetchMyResolvedTickets();
      }

      // Add handler for ticket transferred event
      const handleTicketTransferred = async () => {
        await fetchTickets();
      }

      // Register event handlers
      socketRef.current.on("ticketAssigned", handleTicketsAssigned);
      socketRef.current.on("ticketsUpdated", handleTicketsUpdated);
      socketRef.current.on("ticketResolved", handleTicketResolved);
      socketRef.current.on("ticketTransferred", handleTicketTransferred);

      return () => {
        if (socketRef.current) {
          // Clean up event handlers
          socketRef.current.off("ticketAssigned", handleTicketsAssigned);
          socketRef.current.off("ticketsUpdated", handleTicketsUpdated);
          socketRef.current.off("ticketResolved", handleTicketResolved);
          socketRef.current.off("ticketTransferred", handleTicketTransferred);
          socketRef.current.disconnect();
          socketRef.current = null;
        }
      };
    }
    // eslint-disable-next-line
  }, [isAnalyst]);

  useEffect(() => {
    if (!socketRef.current) return;
    const handleConnect = () => {
      if (analystId) {
        socketRef.current.emit("joinAnalystRoom", analystId, (ack) => {
          console.log("Server acknowledged joinAnalystRoom:", ack);
        });
      }
    };
    socketRef.current.on("connect", handleConnect);

    // If socket is already connected and user.id is set, emit immediately
    if (socketRef.current.connected && analystId) {
      handleConnect();
    }

    return () => {
      if (socketRef.current) {
        socketRef.current.off("connect", handleConnect);
      }
    };
  }, [analystId]);

  useEffect(() => {
    if (ticketSuccessMessage) {
      const timer = setTimeout(() => {
        setTicketSuccessMessage("");
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [ticketSuccessMessage]);

  const fetchTickets = async () => {
    setLoading(true);
    try {
      const response = await axiosClient.get("/analyst/my-tickets", {
        withCredentials: true,
      });
      setTickets(response.data.data || []);
    } catch (error) {
      setTickets([]);
      toast.error("Failed to fetch your tickets.");
    } finally {
      setLoading(false);
      setLastUpdated(new Date());
    }
  };

  useEffect(() => {
    const getProfile = async () => {
      const profile = await fetchProfile();
      setUser(profile);
    };
    getProfile();
  }, []);

  const fetchMyResolvedTickets = async () => {
    setLoading(true);
    try {
      const response = await axiosClient.get("/analyst/my-resolved-tickets?hours=24", {
        withCredentials: true,
      });
      if (response.data.success) {
        setMyResolvedTickets(response.data.tickets);
      } else {
        setMyResolvedTickets([]);
      }
    } catch (error) {
      setMyResolvedTickets([]);

      toast.error("Failed to fetch resolved tickets.");
    } finally {
      setLoading(false);
      setLastUpdated(new Date());
    }
  };
  // Handle ticket selection
  const handleTicketSelect = (ticket) => {
    setSelectedTicket(ticket);
  };


  const handleResolveTicket = async (ticketId, remarks) => {
    if (!remarks || !remarks.trim()) {
      return;
    }
    try {
      const response = await axiosClient.put(
        `/analyst/resolve/${ticketId}`,
        {
          ticketId,
          remarks,
          lastModifiedAt: Date.now(),
        },
        { withCredentials: true }
      );
      if (response.data.success) {
        setSelectedTicket(null); //Close the panel immediately
        toast.success("Ticket resolved successfully.");
        fetchMyResolvedTickets();
        fetchTickets();
        fetchProfile().then(setUser);
      } else {
        toast.error("Failed to resolve ticket.");
      }
    } catch (error) {
      toast.error("Error resolving ticket: " + (error.response?.data?.message || "Unknown error"));
    }
  };


  // Sort tickets
  const sortTickets = (tickets) => {
    return [...tickets].sort((a, b) => {
      // Priority sorting with consistent mapping
      const priorityOrder = {
        P1: 3,
        HIGH: 3,
        P2: 2,
        MEDIUM: 2,
        P3: 1,
        LOW: 1,
      };

      // Get normalized priority values
      const priorityA = priorityOrder[a.priority?.toUpperCase()] || 0;
      const priorityB = priorityOrder[b.priority?.toUpperCase()] || 0;

      // If priorities are different, sort by priority
      if (priorityA !== priorityB) {
        // Higher priority (larger number) should come first, so reverse the comparison
        return sortConfig.direction === "asc" ? priorityB - priorityA : priorityA - priorityB;
      }

      // If priorities are the same, sort by SLA deadline
      const now = new Date();

      // Handle null/undefined SLA deadlines
      const hasDeadlineA = !!a.slaDeadline;
      const hasDeadlineB = !!b.slaDeadline;

      // If one ticket has a deadline and the other doesn't, prioritize the one with a deadline
      if (hasDeadlineA !== hasDeadlineB) {
        return hasDeadlineA ? -1 : 1;
      }

      // If neither has a deadline, keep the original order
      if (!hasDeadlineA && !hasDeadlineB) {
        return 0;
      }

      const deadlineA = new Date(a.slaDeadline);
      const deadlineB = new Date(b.slaDeadline);

      // Check which tickets have breached SLA
      const isBreachedA = deadlineA < now;
      const isBreachedB = deadlineB < now;

      // If one is breached and the other isn't, breached comes first
      if (isBreachedA !== isBreachedB) {
        return isBreachedA ? -1 : 1;
      }

      // If both are breached or both are not breached, sort by time remaining
      return deadlineA.getTime() - deadlineB.getTime();
    });
  };

  // Change sort direction
  const handleSort = (key) => {
    // For our priority-based sorting, we're always using the same sorting logic
    // but just changing the direction
    setSortConfig((prevConfig) => ({
      key: "priority", // Always use priority as the key for our combined sorting
      direction: prevConfig.direction === "asc" ? "desc" : "asc",
    }));
  };

  // Filter and process tickets
  const processedTickets = () => {
    // Select the appropriate ticket array based on status filter
    let ticketsToProcess = statusFilter === "resolved" ? myResolvedTickets : tickets;

    let result = ticketsToProcess.filter((ticket) => {
      // Filter by status
      if (statusFilter !== "all" && statusFilter !== "resolved") {
        const ticketStatus = ticket.status?.toLowerCase() || "";
        const filterStatus = statusFilter.toLowerCase();

        if (
          filterStatus === "in progress" &&
          ticketStatus !== "in progress" &&
          ticketStatus !== "in-progress"
        ) {
          return false;
        } else if (ticketStatus !== filterStatus) {
          return false;
        }
      }

      // Filter by priority
      if (priorityFilter !== "all") {
        const normalizedPriority = priorityFilter.toUpperCase();
        const ticketPriority = ticket.priority?.toUpperCase();
        if (
          normalizedPriority === "HIGH" &&
          ticketPriority !== "HIGH" &&
          ticketPriority !== "P1"
        )
          return false;
        if (
          normalizedPriority === "MEDIUM" &&
          ticketPriority !== "MEDIUM" &&
          ticketPriority !== "P2"
        )
          return false;
        if (
          normalizedPriority === "LOW" &&
          ticketPriority !== "LOW" &&
          ticketPriority !== "P3"
        )
          return false;
      }

      // Search filter
      if (searchTerm) {
        return (
          ticket.ticketNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (ticket.customerPhoneNumber?.toString() || "").includes(searchTerm) ||
          (ticket.customerName?.toLowerCase() || "").includes(
            searchTerm.toLowerCase()
          ) ||
          (ticket.description?.toLowerCase() || "").includes(
            searchTerm.toLowerCase()
          ) ||
          (ticket.title?.toLowerCase() || "").includes(searchTerm.toLowerCase())
        );
      }

      return true;
    });

    // Apply our optimized sorting regardless of sort key
    // This ensures priority-based sorting with SLA as secondary factor
    return sortTickets(result);
  };

  // Apply all filters and sorting to get the final list of tickets
  const filteredTickets = processedTickets();

  // Calculate statistics
  const getTicketCounts = () => {
    return {
      total: tickets.length,
      open: tickets.filter((t) => t.status?.toLowerCase() === "open").length,
      inProgress: tickets.filter(
        (t) =>
          t.status?.toLowerCase() === "in progress" ||
          t.status?.toLowerCase() === "in-progress"
      ).length,
      resolved: myResolvedTickets.length,
      closed: tickets.filter((t) => t.status?.toLowerCase() === "closed").length,
      assignedToMe: tickets.filter((t) => t.assignedToMe).length,
    };
  };

  const counts = getTicketCounts();

  if (isAnalyst === null || loading) {
    return (
      <div className="flex h-screen bg-gray-50 items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
          <p className="text-gray-600">Loading the dashboard...</p>
        </div>
      </div>
    );
  }

  if (!isAnalyst) {
    return <NotAnalyst />;
  }

  return (
    <div className="flex h-screen bg-white">
      {/* Hidden LogoutButton with ref for programmatic logout */}
      <div style={{ display: "none" }}>
        <LogoutButton ref={logoutBtnRef} userRole="analyst" />
      </div>

      <AnalystMainLayout onTicketCreated={(ticketNumber) =>
        setTicketSuccessMessage(`Ticket Created Successfully! Ticket Number: ${ticketNumber}`)
      } />
      <div className="flex-1 flex flex-col overflow-hidden pt-16">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold text-gray-900">
                Analyst Dashboard
              </h1>
              <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                {counts.inProgress} Ticket{counts.inProgress === 1 ? "" : "s"}
              </Badge>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Clock className="h-4 w-4 text-gray-500" />
                <span className="text-sm text-gray-600">
                  Last updated: {lastUpdated.toLocaleTimeString()}
                </span>
              </div>
              <Button
                variant="outline"
                onClick={fetchTickets}
                className="text-blue-600 border-blue-600 hover:bg-blue-50"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
              <Button
                className="bg-blue-600 hover:bg-blue-700 text-white"
                onClick={() => setShowCreateTicketModal(true)}
              >
                + New Ticket
              </Button>

            </div>
          </div>
        </header>

        <div className="flex-1 flex overflow-hidden">
          {/* Main Content */}
          <div className="flex-1 overflow-auto p-6">
            {/* Status tabs - made to fit in one row on most screens */}
            <Tabs
              value={statusFilter}
              onValueChange={(val) => {
                setStatusFilter(val);
                // Reset search when changing tabs for better UX
                setSearchTerm("");
              }}
              className="mb-6"
            >
              <TabsList className="bg-gray-100 p-1 rounded-lg flex justify-between w-full">
                <TabsTrigger
                  value="in progress"
                  className="flex-1 px-1 sm:px-4 py-2 rounded-md data-[state=active]:bg-white data-[state=active]:shadow-sm"
                >
                  In Progress
                  <Badge
                    variant="secondary"
                    className="ml-1.5 bg-amber-100 text-amber-800"
                  >
                    {counts.inProgress}
                  </Badge>
                </TabsTrigger>
                <TabsTrigger
                  value="resolved"
                  className="flex-1 px-1 sm:px-4 py-2 rounded-md data-[state=active]:bg-white data-[state=active]:shadow-sm"
                >
                  Resolved
                  <Badge
                    variant="secondary"
                    className="ml-1.5 bg-green-100 text-green-800"
                  >
                    {counts.resolved}
                  </Badge>
                </TabsTrigger>
              </TabsList>
            </Tabs>

            {/* Search and Priority Filter */}
            <div className="mb-6 flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search tickets by number, name, or description"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
              <div className="flex gap-2">
                <Select
                  value={priorityFilter}
                  onValueChange={setPriorityFilter}
                >
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Priority Filter" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border shadow-md">
                    <SelectItem
                      value="all"
                      className="bg-white hover:bg-gray-100"
                    >
                      All Priorities
                    </SelectItem>
                    <SelectItem
                      value="high"
                      className="bg-white hover:bg-gray-100"
                    >
                      High Priority
                    </SelectItem>
                    <SelectItem
                      value="medium"
                      className="bg-white hover:bg-gray-100"
                    >
                      Medium Priority
                    </SelectItem>
                    <SelectItem
                      value="low"
                      className="bg-white hover:bg-gray-100"
                    >
                      Low Priority
                    </SelectItem>
                  </SelectContent>
                </Select>

              
              </div>
            </div>

            {/* Tickets Content - Removed the Tickets heading as requested */}
            <div className="mb-8">
              {filteredTickets.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <Card className="p-8 text-center bg-gray-50 border-dashed border-2">
                    <div className="text-gray-500 flex flex-col items-center">
                      <Inbox className="h-12 w-12 text-gray-400 mb-4" />
                      {/* <h3 className="text-lg font-medium mb-2">
                      {statusFilter === "in progress"
                        ? "No tickets assigned to you currently."
                        : "No tickets found"}
                    </h3>
                    <p className="max-w-md mx-auto">
                      {statusFilter === "resolved"
                        ? "You have no resolved tickets at the moment."
                        : "You have no in-progress tickets."}
                    </p> */}
                      <h3 className="text-lg font-medium mb-2">
                        {(searchTerm || priorityFilter !== "all") ? (
                          "No tickets matching your filters"
                        ) : statusFilter === "in progress" ? (
                          "No tickets assigned to you currently."
                        ) : statusFilter === "resolved" ? (
                          "No tickets found"
                        ) : (
                          "No tickets found"
                        )}
                      </h3>
                      <p className="max-w-md mx-auto">
                        {(searchTerm || priorityFilter !== "all") ? (
                          ""
                        ) : statusFilter === "resolved" ? (
                          "You have no resolved tickets at the moment."
                        ) : (
                          "You have no in-progress tickets."
                        )}
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

                    // Visual indicators for different ticket states
                    if (!ticket.assignedTo) {
                      borderColor = "border-purple-500";
                      bgGradient = "from-white to-purple-50";
                    } else if (ticket.slaDeadline) {
                      const deadline = new Date(ticket.slaDeadline);
                      const now = new Date();
                      const timeLeft = deadline - now;
                      if (timeLeft < 0) {
                        // SLA Breached
                        borderColor = "border-red-500";
                        bgGradient = "from-white to-red-50";
                      } else if (timeLeft < 2 * 60 * 60 * 1000) {
                        // Less than 2 hours
                        borderColor = "border-orange-500";
                        bgGradient = "from-white to-orange-50";
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
                          className={`border-l-4 overflow-hidden shadow-sm hover:shadow-md transition-all ${borderColor} bg-gradient-to-r ${bgGradient} cursor-pointer`}
                          onClick={() => handleTicketSelect(ticket)}
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
                                        ticket.status?.toLowerCase() === "open",
                                      "bg-amber-50 text-amber-700 border-amber-200":
                                        ticket.status?.toLowerCase() ===
                                        "in progress" ||
                                        ticket.status?.toLowerCase() ===
                                        "in-progress",
                                      "bg-green-50 text-green-700 border-green-200":
                                        ticket.status?.toLowerCase() ===
                                        "resolved",
                                      "bg-gray-50 text-gray-700 border-gray-200":
                                        ticket.status?.toLowerCase() ===
                                        "closed",
                                    })}
                                  >
                                    {ticket.status}
                                  </Badge>
                                  {statusFilter !== "resolved" && !ticket.assignedTo && (
                                    <Badge className="bg-purple-100 text-purple-800 border-purple-200">
                                      Unassigned
                                    </Badge>
                                  )}
                                  {/* Removed "Assigned to me" badge as requested */}
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
                                {ticket.slaDeadline && (
                                  <>
                                    <p
                                      className={cn(
                                        "text-sm font-medium",
                                        getSLAColorClass(ticket.slaDeadline)
                                      )}
                                    >
                                      SLA: {formatDeadline(ticket.slaDeadline)}
                                    </p>
                                    <SlaTimer deadline={ticket.slaDeadline} />
                                  </>
                                )}
                              </div>
                            </div>
                            <div className="mt-3 bg-gray-50 p-3 rounded-md">
                              <p className="text-gray-700 line-clamp-2 text-sm">
                                <span className="font-medium">
                                  Description:
                                </span>{" "}
                                {truncateText(
                                  ticket.description || ticket.title,
                                  80
                                ) || "No description provided."}
                              </p>

                            </div>
                            <div className="mt-4 flex justify-between items-center">
                              <div className="flex items-center text-sm text-gray-500">
                                <Clock className="h-3.5 w-3.5 mr-1" />
                                <span>{timeAgo(ticket.createdAt)}</span>
                              </div>
                              <div className="flex gap-2">
                                {/* <Button
                                  variant="default"
                                  size="sm"
                                  className="bg-blue-600 hover:bg-blue-700 text-white"
                                  onClick={() => handleTicketSelect(ticket)}
                                >
                                  View Details
                                </Button> */}
                                {/* Hide View Details button in resolved tab */}
                                {statusFilter !== "resolved" && (
                                  <Button
                                    variant="default"
                                    size="sm"
                                    className="bg-blue-600 hover:bg-blue-700 text-white"
                                    onClick={() => handleTicketSelect(ticket)}
                                  >
                                    View Details
                                  </Button>
                                )}
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

          {/* Right Sidebar - Updated to remove Ticket Distribution and Refresh Data button */}
          <div className="hidden lg:block w-80 bg-white border-l border-gray-200 p-6 overflow-auto">
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-3">
                  Quick Stats
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  <Card className="p-3 text-center">
                    <h3 className="text-2xl font-bold text-blue-600">
                      {counts.inProgress}
                    </h3>
                    <p className="text-xs text-gray-600">In Progress</p>
                  </Card>
                  <Card className="p-3 text-center">
                    <h3 className="text-2xl font-bold text-amber-600">
                      {counts.resolved}
                    </h3>
                    <p className="text-xs text-gray-600">Resolved</p>
                  </Card>
                  <Card className="p-3 text-center col-span-2">
                    <h3 className="text-lg font-semibold text-gray-800 mb-1">Avg. Resolution Time</h3>
                    <div className="text-xl font-bold text-green-700">
                      {user
                        ? (() => {
                          const totalSec = Math.round(user.avgResolutionTime || 0);
                          const hours = Math.floor(totalSec / 3600);
                          const minutes = Math.floor((totalSec % 3600) / 60);
                          const seconds = totalSec % 60;
                          return `${hours > 0 ? hours + "h " : ""}${minutes > 0 ? minutes + "m " : ""}${seconds}s`;
                        })()
                        : <span className="text-gray-400">Loading...</span>}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {user
                        ? `Based on ${user.resolvedTicketCount || 0} resolved ticket${user.resolvedTicketCount > 1 ? "s" : ""}`
                        : ""}
                    </div>
                  </Card>

                </div>
              </div>

              {/* Removed "Ticket Distribution" section as requested */}

              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-3">
                  SLA Overview
                </h3>
                <div className="space-y-2 bg-gray-50 p-3 rounded-md">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Urgent (&lt; 2h)</span>
                    <Badge variant="outline" className="bg-red-50 text-red-600">
                      {
                        tickets.filter((t) => {
                          if (!t.slaDeadline) return false;
                          const deadline = new Date(t.slaDeadline);
                          const now = new Date();
                          const timeLeft = deadline - now;
                          return timeLeft > 0 && timeLeft < 2 * 60 * 60 * 1000;
                        }).length
                      }
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Breached</span>
                    <Badge variant="outline" className="bg-red-50 text-red-700">
                      {
                        tickets.filter(
                          (t) =>
                            t.slaDeadline &&
                            new Date(t.slaDeadline) < new Date()
                        ).length
                      }
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Good Standing</span>
                    <Badge
                      variant="outline"
                      className="bg-green-50 text-green-700"
                    >
                      {
                        tickets.filter((t) => {
                          if (!t.slaDeadline) return false;
                          const deadline = new Date(t.slaDeadline);
                          const now = new Date();
                          return (
                            deadline > now &&
                            deadline - now >= 2 * 60 * 60 * 1000
                          );
                        }).length
                      }
                    </Badge>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-3">
                  Priority Breakdown
                </h3>
                <div className="space-y-1">
                  {/* Calculate counts */}
                  {(() => {
                    const highCount = tickets.filter(
                      (t) =>
                        t.priority === "P1" ||
                        t.priority === "HIGH" ||
                        t.priority?.toUpperCase() === "HIGH"
                    ).length;

                    const mediumCount = tickets.filter(
                      (t) =>
                        t.priority === "P2" ||
                        t.priority === "MEDIUM" ||
                        t.priority?.toUpperCase() === "MEDIUM"
                    ).length;

                    const lowCount = tickets.filter(
                      (t) =>
                        t.priority === "P3" ||
                        t.priority === "LOW" ||
                        t.priority?.toUpperCase() === "LOW"
                    ).length;

                    const total = tickets.length || 1;
                    const highPercentage = (highCount / total) * 100;
                    const mediumPercentage = (mediumCount / total) * 100;
                    const lowPercentage = (lowCount / total) * 100;

                    return (
                      <>
                        {/* Counter Numbers above Progress Bar */}
                        <div className="flex text-xs font-medium mb-1">
                          {highCount > 0 && (
                            <div
                              style={{ width: `${highPercentage}%` }}
                              className="text-center text-red-600"
                            >
                              {highCount}
                            </div>
                          )}
                          {mediumCount > 0 && (
                            <div
                              style={{ width: `${mediumPercentage}%` }}
                              className="text-center text-amber-600"
                            >
                              {mediumCount}
                            </div>
                          )}
                          {lowCount > 0 && (
                            <div
                              style={{ width: `${lowPercentage}%` }}
                              className="text-center text-blue-600"
                            >
                              {lowCount}
                            </div>
                          )}
                        </div>

                        {/* Progress bar visualization */}
                        <div className="h-2 bg-gray-200 rounded-full overflow-hidden flex">
                          {/* High Priority */}
                          {highCount > 0 && (
                            <div
                              className="h-full bg-red-500"
                              style={{ width: `${highPercentage}%` }}
                            />
                          )}

                          {/* Medium Priority */}
                          {mediumCount > 0 && (
                            <div
                              className="h-full bg-amber-500"
                              style={{ width: `${mediumPercentage}%` }}
                            />
                          )}

                          {/* Low Priority */}
                          {lowCount > 0 && (
                            <div
                              className="h-full bg-blue-500"
                              style={{ width: `${lowPercentage}%` }}
                            />
                          )}
                        </div>
                      </>
                    );
                  })()}

                  {/* Labels */}
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <div className="flex items-center">
                      <span className="h-2 w-2 bg-red-500 rounded-full inline-block mr-1"></span>
                      High/P1
                    </div>
                    <div className="flex items-center">
                      <span className="h-2 w-2 bg-amber-500 rounded-full inline-block mr-1"></span>
                      Med/P2
                    </div>
                    <div className="flex items-center">
                      <span className="h-2 w-2 bg-blue-500 rounded-full inline-block mr-1"></span>
                      Low/P3
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Ticket Details Panel */}
      <TicketDetailsPanel
        open={!!selectedTicket}
        ticket={selectedTicket}
        userId={User?.id}//new
        onClose={() => setSelectedTicket(null)}
        onResolve={handleResolveTicket}
      />
      <CreateTicketManualEntry
        isOpen={showCreateTicketModal}
        onRequestClose={() => setShowCreateTicketModal(false)}
        showTicketsModal={showTicketsModal}
        closeTicketsModal={() => setShowTicketsModal(false)}
        openTicketsModal={() => setShowTicketsModal(true)}
        defaultDepartment={user?.department}
        onTicketCreated={(ticketNumber) =>
          setTicketSuccessMessage(`Ticket Created Successfully! Ticket Number: ${ticketNumber}`)
        }
      />
    </div>

  );
};

// Helper functions
const toIST = (dateString) => {
  if (!dateString) return "N/A";
  const date = new Date(dateString);
  const offset = 5.5 * 60 * 60 * 1000;
  const istDate = new Date(date.getTime() + offset);
  return istDate;
};

const formatDate = (dateString) => {
  const istDate = toIST(dateString);
  return istDate === "N/A"
    ? "N/A"
    : istDate.toLocaleDateString("en-IN", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
      timeZone: "Asia/Kolkata",
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
    case "HIGH":
    case "P1":
      return "bg-red-600 text-white border-red-300";
    case "MEDIUM":
    case "P2":
      return "bg-amber-600 text-white border-amber-300";
    case "LOW":
    case "P3":
      return "bg-green-600 text-white border-blue-300";
    default:
      return "bg-gray-600 text-white border-gray-300";
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
  const words = text.split(" ");
  if (words.length <= wordLimit) return text;
  return words.slice(0, wordLimit).join(" ") + "...";
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

export default AnalystDashboard;