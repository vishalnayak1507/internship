import React, { useState, useEffect, useRef } from "react";
/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable no-unused-vars */
import axios from "axios";

import AdminMainLayout from "../../components/admin/layoutComponents/AdminMainLayout";
import TicketCard from "../../components/admin/tickets/TicketCard";
import TicketFilters from "../../components/admin/tickets/TicketFilters";
import TicketStatusTabs from "../../components/admin/tickets/TicketStatusTabs";
import TicketModal from "../../components/admin/tickets/TicketModal";
import { useDepartment } from "../../utils/admin/DepartmentContext";
import { RefreshCw, ChevronLeft, ChevronRight } from "lucide-react";
import { isSLABreached } from "../../utils/admin/ticketHelpers";
import { Button } from "@/components/ui/button";
import { io } from "socket.io-client";
import LoadingSpinner from "../../components/common/LoadingSpinner";

// Helper to get ticket creation date as UTC Date object
function getTicketCreatedDate(ticket) {
  return ticket.createdAt ? new Date(ticket.createdAt) : null;
}

// Helper to get ticket last modified date as UTC Date object
function getTicketLastModifiedDate(ticket) {
  return ticket.lastModifiedAt
    ? new Date(ticket.lastModifiedAt)
    : getTicketCreatedDate(ticket);
}

// Helper to parse a date string (yyyy-mm-dd) as UTC Date at midnight
function parseDateAsUTC(dateStr, endOfDay = false) {
  if (!dateStr) return null;
  const [year, month, day] = dateStr.split("-");
  if (endOfDay) {
    return new Date(Date.UTC(year, month - 1, day, 23, 59, 59, 999));
  }
  return new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));
}

const TicketList = () => {
  const [tickets, setTickets] = useState([]);
  const [refreshKey, setRefreshKey] = useState(0);
  const [loading, setLoading] = useState(false); // 1. Add loading state

  // Modified to always default to today and New status
  const getInitialFilters = () => {
    try {
      const saved = JSON.parse(localStorage.getItem("adminTicketFilters"));
      const lastVisit = localStorage.getItem("ticketListLastVisit");
      const now = Date.now();
     
      if (!lastVisit || (now - parseInt(lastVisit)) > 60000) {
        localStorage.setItem("ticketListLastVisit", now.toString());
        return {
          statusFilter: "New", // Changed from "All" to "New"
          activeFilters: { time: ["today"] },
          search: "",
          fromDate: "",
          toDate: ""
        };
      }
     
      localStorage.setItem("ticketListLastVisit", now.toString());
      return saved || {
        statusFilter: "New", // Changed from "All" to "New"
        activeFilters: { time: ["today"] },
        search: "",
        fromDate: "",
        toDate: ""
      };
    } catch {
      return {
        statusFilter: "New", // Changed from "All" to "New"
        activeFilters: { time: ["today"] },
        search: "",
        fromDate: "",
        toDate: ""
      };
    }
  };

  const initialFilters = getInitialFilters();

  const [statusFilter, setStatusFilter] = useState(
    initialFilters.statusFilter || "New"
  );
  const [search, setSearch] = useState("");
  const [activeFilters, setActiveFilters] = useState(
    initialFilters.activeFilters || { time: ["today"] }
  );
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [filteredTickets, setFilteredTickets] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const ticketsPerPage = 20;
  const [gotoPage, setGotoPage] = useState(currentPage);
  const socketRef = useRef(null);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter, search, activeFilters, fromDate, toDate]);
 
  // Track when component mounts and unmounts
  useEffect(() => {
    localStorage.setItem("ticketListLastVisit", Date.now().toString());
    return () => {};
  }, []);

  let selectedDepartment = "";
  let departmentRefreshKey = 0;  // Renamed from refreshKey to avoid duplicate
  try {
    const departmentContext = useDepartment();
    selectedDepartment = departmentContext?.selectedDepartment || "";
    departmentRefreshKey = departmentContext?.refreshKey || 0;
  } catch (error) {
    console.log("Department context not available yet");
  }

  // Fetch tickets function definition
  const fetchTickets = async () => {
    setLoading(true); // 2. Set loading true before fetch
    try {
      const params = {};
      if (selectedDepartment && selectedDepartment !== "All")
        params.department = selectedDepartment;

      const response = await axios.get(
        "http://localhost:8000/api/auth/ticketdet",
        {
          withCredentials: true,
          headers: {
            Authorization: `Bearer ${localStorage.getItem("authToken")}`,
          },
          params,
        }
      );

      // Fetch latest analyst information for tickets without assignedTo
      let fetchedTickets =
        response.data && Array.isArray(response.data.data)
          ? response.data.data
          : [];

      // for (const ticket of fetchedTickets) {
      //   if (!ticket.assignedTo) {
      //     try {
      //       const discussionResponse = await axios.get(
      //         `http://localhost:8000/api/ticketdiscussion/${ticket.ticketNumber}`
      //       );
      //       const history = discussionResponse.data?.data?.history;
      //       if (history && history.length > 0) {
      //         const analystRemark = [...history]
      //           .reverse()
      //           .find((r) => r.isCustomerDetail === false && r.userDetail);

      //         if (analystRemark && analystRemark.userDetail) {
      //           ticket.latestAnalyst = analystRemark.userDetail.name || "";
      //         }
      //       }
      //     } catch (err) {
      //       console.error(
      //         `Failed to fetch discussion for ticket ${ticket.ticketNumber}:`,
      //         err
      //       );
      //     }
      //   } else if (ticket.assignedTo) {
      //     // If assignedTo exists, use that as latestAnalyst for search consistency
      //     ticket.latestAnalyst = ticket.assignedTo.name || "";
      //   }
      // }

      setTickets(fetchedTickets);
    } catch (error) {
      console.error("Failed to fetch tickets", error);
      setTickets([]);
    } finally {
      setLoading(false); // 3. Set loading false after fetch
    }
  };

  // Socket.IO for real-time updates
  useEffect(() => {
    socketRef.current = io("http://localhost:8000", { withCredentials: true });

    socketRef.current.on("ticket:new", (ticket) => {
      fetchTickets();
    });

    return () => {
      if (socketRef.current) socketRef.current.disconnect();
    };
  }, []); // Only on mount

  // Fetch tickets on department or refreshKey change
  useEffect(() => {
    fetchTickets();
  }, [selectedDepartment, refreshKey, departmentRefreshKey]); // Added departmentRefreshKey

  // Get current time range based on active filters
  const getTimeRange = () => {
    const now = new Date();
    let startDate, endDate;

    if (fromDate || toDate) {
      startDate = fromDate ? parseDateAsUTC(fromDate) : new Date(0);
      endDate = toDate
        ? parseDateAsUTC(toDate, true)
        : new Date(8640000000000000);
    } else if (activeFilters.time?.length > 0) {
      const timeFilter = activeFilters.time[0];

      if (timeFilter === "today") {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        startDate = today;

        const tomorrow = new Date(today);
        tomorrow.setDate(today.getDate() + 1);
        endDate = tomorrow;
      } else if (timeFilter === "week") {
        const currentDay = now.getDay();
        const daysToMonday = currentDay === 0 ? 6 : currentDay - 1;

        const monday = new Date(now);
        monday.setDate(now.getDate() - daysToMonday);
        monday.setHours(0, 0, 0, 0);
        startDate = monday;

        const nextMonday = new Date(monday);
        nextMonday.setDate(monday.getDate() + 7);
        endDate = nextMonday;
      } else if (timeFilter === "month") {
        const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
        firstDay.setHours(0, 0, 0, 0);
        startDate = firstDay;

        const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
        nextMonth.setHours(0, 0, 0, 0);
        endDate = nextMonth;
      } else if (timeFilter === "year") {
        const firstDay = new Date(now.getFullYear(), 0, 1);
        firstDay.setHours(0, 0, 0, 0);
        startDate = firstDay;

        const nextYear = new Date(now.getFullYear() + 1, 0, 1);
        nextYear.setHours(0, 0, 0, 0);
        endDate = nextYear;
      }
    } else {
      // Default to all time if no time filter
      startDate = new Date(0);
      endDate = new Date(8640000000000000);
    }

    return { startDate, endDate };
  };

  // Modified filtering and sorting logic
  useEffect(() => {
    let filtered = [...tickets];
    const { startDate, endDate } = getTimeRange();
    const activeTimeFilter = activeFilters.time?.[0] || null;

    // Enhanced search by assignedTo name or latest analyst name or ticket number
    filtered = filtered.filter((ticket) => {
      const assignedToName = ticket.assignedTo?.name?.toLowerCase() || "";
      const latestAnalystName = ticket.latestAnalyst?.toLowerCase() || "";
      const ticketNumber = ticket.ticketNumber?.toLowerCase() || "";
      const searchTerm = search.toLowerCase();

      return (
        search === "" ||
        assignedToName.includes(searchTerm) ||
        latestAnalystName.includes(searchTerm) ||
        ticketNumber.includes(searchTerm)
      );
    });

    // Status filter logic
    if (statusFilter === "Total") {
      // Show all Open, In Progress, Resolved, Closed tickets for the time filter
      filtered = filtered.filter((ticket) => {
        const createdAt = getTicketCreatedDate(ticket);
        const lastModified = getTicketLastModifiedDate(ticket);
        if (ticket.status === "Open" || ticket.status === "In Progress") {
          return createdAt && createdAt <= endDate;
        }
        if (ticket.status === "Resolved" || ticket.status === "Closed") {
          return lastModified && lastModified >= startDate && lastModified <= endDate;
        }
        return false;
      });
    } else if (statusFilter === "Open" || statusFilter === "In Progress") {
      filtered = filtered.filter((ticket) => {
        const createdAt = getTicketCreatedDate(ticket);
        return ticket.status === statusFilter && createdAt <= endDate;
      });
    } else if (statusFilter === "Resolved" || statusFilter === "Closed") {
      filtered = filtered.filter((ticket) => {
        const lastModified = getTicketLastModifiedDate(ticket);
        return (
          ticket.status === statusFilter &&
          lastModified >= startDate &&
          lastModified <= endDate
        );
      });
    }

    // SLA Breached filter
    if (activeFilters.slaBreached) {
      filtered = filtered.filter(isSLABreached);
    }

    if(statusFilter === "Resolved" || statusFilter === "Closed") {
      filtered.sort((a, b) => {
        const aLastModified = getTicketLastModifiedDate(a);
        const bLastModified = getTicketLastModifiedDate(b);
        return bLastModified - aLastModified;
      })
    }
    else {
      filtered.sort((a, b) => {
        const aDeadline = a.slaDeadline ? new Date(a.slaDeadline) : new Date(8640000000000000);
        const bDeadline = b.slaDeadline ? new Date(b.slaDeadline) : new Date(8640000000000000);
        return aDeadline - bDeadline;
      });
    }

    filtered.timeFilter = activeTimeFilter;

    setFilteredTickets(filtered);
    setCurrentPage(1);
  }, [tickets, statusFilter, search, activeFilters, fromDate, toDate]);

  // Get counts of tickets for different statuses
  const getStatusCounts = () => {
    const { startDate, endDate } = getTimeRange();

    // Calculate counts for each status based on time range rules
    const filteredCounts = {
      New: 0,
      Open: 0,
      "In Progress": 0,
      Resolved: 0,
      Closed: 0,
      "SLA Breached": tickets.filter(isSLABreached).length,
    };

    const totalCounts = {
      New: 0,
      Open: 0,
      "In Progress": 0,
      Resolved: 0,
      Closed: 0,
      "SLA Breached": tickets.filter(isSLABreached).length,
    };

    // Calculate counts for filtered tickets
    filteredTickets.forEach((ticket) => {
      const status = ticket.status;
      if (
        status === "Open" ||
        status === "In Progress" ||
        status === "Resolved" ||
        status === "Closed"
      ) {
        filteredCounts[status]++;
      }

      // New tickets are those created within time range
      const createdAt = getTicketCreatedDate(ticket);
      if (createdAt && createdAt >= startDate && createdAt <= endDate) {
        filteredCounts.New++;
      }
    });

    // Calculate counts for all tickets
    tickets.forEach((ticket) => {
      const status = ticket.status;
      const createdAt = getTicketCreatedDate(ticket);
      const lastModified = getTicketLastModifiedDate(ticket);

      // For "Open" and "In Progress" - count if created <= endDate
      if (
        (status === "Open" || status === "In Progress") &&
        createdAt &&
        createdAt <= endDate
      ) {
        totalCounts[status]++;
      }

      // For "Resolved" and "Closed" - count if lastModified within range
      if (
        (status === "Resolved" || status === "Closed") &&
        lastModified &&
        lastModified >= startDate &&
        lastModified <= endDate
      ) {
        totalCounts[status]++;
      }

      // For "New" tickets - count if created within time range
      if (createdAt && createdAt >= startDate && createdAt <= endDate) {
        totalCounts.New++;
      }
    });

    return { total: totalCounts, filtered: filteredCounts };
  };

  const { total: totalStatusCounts, filtered: filteredStatusCounts } =
    getStatusCounts();

  const handleOpenTicket = (ticket) => {
    setSelectedTicket(ticket);
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setSelectedTicket(null);
  };

  // Handler for refresh button
  const handleRefresh = () => {
    setRefreshKey((k) => k + 1);
  };

  // Component cleanup and navigation detection
  useEffect(() => {
    return () => {
      // Save current filters on unmount
      const filterState = {
        statusFilter,
        activeFilters,
        search,
        fromDate,
        toDate,
      };
      localStorage.setItem("adminTicketFilters", JSON.stringify(filterState));
    };
  }, [statusFilter, activeFilters, search, fromDate, toDate]);

  // Get current tickets for pagination
  const indexOfLastTicket = currentPage * ticketsPerPage;
  const indexOfFirstTicket = indexOfLastTicket - ticketsPerPage;
  const currentTickets = filteredTickets.slice(
    indexOfFirstTicket,
    indexOfLastTicket
  );

  // Calculate total pages
  const totalPages = Math.ceil(filteredTickets.length / ticketsPerPage);

  return (
    <AdminMainLayout>
      <div className="min-h-screen">
        {/* Sticky Filters + Status Tabs below navbar */}
        <div className="sticky top-16 z-30 bg-white ">
          <TicketFilters
            search={search}
            setSearch={setSearch}
            activeFilters={activeFilters}
            setActiveFilters={setActiveFilters}
            fromDate={fromDate}
            setFromDate={setFromDate}
            toDate={toDate}
            setToDate={setToDate}
            tickets={tickets}
            setFilteredTickets={setFilteredTickets}
            onRefresh={handleRefresh}
          />
          <TicketStatusTabs
            statusFilter={statusFilter}
            setStatusFilter={setStatusFilter}
            tickets={tickets} // Pass all tickets for counting
            filteredTickets={filteredTickets} // Pass filtered tickets for the time filter info
            timeRange={getTimeRange()} // Pass the current time range
            activeFilters={activeFilters} // Pass active filters including slaBreached
            search={search} // Pass the search term
          />
        </div>

        {/* Ticket Cards (scrollable) */}
        <div
          className="flex flex-col gap-4 mt-4 h-[calc(100vh-260px)] overflow-y-auto overflow-x-hidden pr-4 pb-4 hide-scrollbar"
          key={
            statusFilter +
            Object.keys(activeFilters).join("-") +
            search +
            currentPage
          }
        >
          {loading ? ( // 4. Show spinner if loading
            <div className="flex justify-center items-center h-64">
              <LoadingSpinner />
            </div>
          ) : filteredTickets.length === 0 ? (
            <div
              className="text-center text-gray-500 py-10 bg-gray-50 rounded-lg border border-gray-200"
              key="no-tickets"
            >
              No tickets found.
            </div>
          ) : (
            <div className="w-full overflow-x-hidden flex flex-col space-y-3 ">
              {currentTickets.map((ticket, index) => (
                <div key={ticket._id || index} className="w-full first:mt-2">
                  <TicketCard
                    ticket={ticket}
                    onClick={() => handleOpenTicket(ticket)}
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Pagination Controls */}
        {filteredTickets.length > 0 && (
          <div className="sticky bottom-0 left-0 right-0 flex justify-between items-center px-4 py-2 bg-white border-t border-gray-200 shadow-md">
            <div className="text-sm text-gray-700">
              Showing {indexOfFirstTicket + 1}-
              {Math.min(indexOfLastTicket, filteredTickets.length)} of{" "}
              {filteredTickets.length} tickets
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="flex items-center"
              >
                <ChevronLeft className="h-4 w-4 mr-1" /> Previous
              </Button>

              <div className="flex items-center space-x-1">
                {totalPages <= 5 ? (
                  // Show all page numbers if 5 or fewer pages
                  [...Array(totalPages)].map((_, i) => (
                    <Button
                      key={i + 1}
                      variant={currentPage === i + 1 ? "default" : "outline"}
                      size="sm"
                      onClick={() => setCurrentPage(i + 1)}
                      className="w-8 h-8 p-0"
                    >
                      {i + 1}
                    </Button>
                  ))
                ) : (
                  // Show limited page numbers with ellipsis for many pages
                  <>
                    <Button
                      variant={currentPage === 1 ? "default" : "outline"}
                      size="sm"
                      onClick={() => setCurrentPage(1)}
                      className="w-8 h-8 p-0"
                    >
                      1
                    </Button>

                    {currentPage > 3 && <span className="px-1">...</span>}

                    {/* Show current page and neighbors */}
                    {[...Array(3)]
                      .map((_, i) => {
                        const pageNum = Math.max(2, currentPage - 1) + i;
                        if (pageNum > 1 && pageNum < totalPages) {
                          return (
                            <Button
                              key={pageNum}
                              variant={
                                currentPage === pageNum ? "default" : "outline"
                              }
                              size="sm"
                              onClick={() => setCurrentPage(pageNum)}
                              className="w-8 h-8 p-0"
                            >
                              {pageNum}
                            </Button>
                          );
                        }
                        return null;
                      })
                      .filter(Boolean)}

                    {currentPage < totalPages - 2 && (
                      <span className="px-1">...</span>
                    )}

                    <Button
                      variant={
                        currentPage === totalPages ? "default" : "outline"
                      }
                      size="sm"
                      onClick={() => setCurrentPage(totalPages)}
                      className="w-8 h-8 p-0"
                    >
                      {totalPages}
                    </Button>
                  </>
                )}
              </div>

              {/* Direct page input */}
              <div className="flex items-center space-x-1 ml-2">
                <span className="text-xs text-gray-500">Go to:</span>
                <input
                  type="number"
                  min="1"
                  max={totalPages}
                  value={gotoPage}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === "") {
                      setGotoPage("");
                    } else {
                      const num = parseInt(val, 10);
                      if (!isNaN(num)) setGotoPage(num);
                    }
                  }}
                  onBlur={() => {
                    let page = parseInt(gotoPage, 10);
                    if (isNaN(page) || page < 1) page = 1;
                    if (page > totalPages) page = totalPages;
                    setGotoPage(page);
                    if (page !== currentPage) setCurrentPage(page);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      let page = parseInt(gotoPage, 10);
                      if (isNaN(page) || page < 1) page = 1;
                      if (page > totalPages) page = totalPages;
                      setGotoPage(page);
                      if (page !== currentPage) setCurrentPage(page);
                    }
                  }}
                  className="w-12 h-8 border border-gray-300 rounded p-1 text-center text-sm"
                />
                <span className="text-xs text-gray-500">of {totalPages}</span>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                }
                disabled={currentPage === totalPages || totalPages === 0}
                className="flex items-center"
              >
                Next <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>
        )}

        {/* Ticket Details Modal */}
        <TicketModal
          isOpen={modalOpen}
          onClose={handleCloseModal}
          ticket={selectedTicket}
        />
      </div>
    </AdminMainLayout>
  );
};

export default TicketList;

