/* eslint-disable no-unused-vars */
import React, { useState, useEffect } from "react";
import AdminMainLayout from "../../components/admin/layoutComponents/AdminMainLayout";
import "./AdminAnalyst.css";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import axios from "axios";
import { useDepartment } from "../../utils/admin/DepartmentContext";
import LoadingSpinner from "../../components/common/LoadingSpinner";
// ...// Card style function
const getAnalystCardStyle = () => {
  return "from-blue-50 via-white to-blue-50 border-blue-200";
};
import {
  isSLABreached,
  getTicketCardStyle,
} from "../../utils/admin/ticketHelpers";

const formatDate = (dateString) => {
  if (!dateString) return "N/A";
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "Invalid Date";
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch (error) {
    console.error("Error formatting date:", error);
    return dateString;
  }
};

const formatDateOnly = (dateString) => {
  if (!dateString) return "N/A";
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "Invalid Date";
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch (error) {
    console.error("Error formatting date:", error);
    return dateString;
  }
};

const formatResolutionTime = (seconds) => {
  if (!seconds || seconds <= 0) return "N/A";
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours < 24)
    return `${hours} hr${hours > 1 ? "s" : ""}${
      mins > 0 ? ` ${mins} min` : ""
    }`;
  const days = Math.floor(hours / 24);
  const remHours = hours % 24;
  return `${days} day${days > 1 ? "s" : ""}${
    remHours > 0 ? ` ${remHours} hr${remHours > 1 ? "s" : ""}` : ""
  }${mins > 0 ? ` ${mins} min` : ""}`;
};

const AdminAnalyst = () => {
  const [analysts, setAnalysts] = useState([]);
  const [displayedAnalysts, setDisplayedAnalysts] = useState([]);
  const [activeTabState, setActiveTabState] = useState("personal");
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  // Modified sort state to include field and direction
  const [sortConfig, setSortConfig] = useState({
    field: "resolved", // 'resolved' or 'slaBreached'
    direction: "desc", // 'asc' or 'desc'
  });
  const [selectedViewAnalyst, setSelectedViewAnalyst] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const { selectedDepartment } = useDepartment();

  // Ticket stats for today for each analyst
  const [ticketStatsMap, setTicketStatsMap] = useState({});

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  // Add this with your other state variables
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);

  const fetchAnalysts = async () => {
    setLoading(true);
    try {
      let params = {};
      if (selectedDepartment && selectedDepartment !== "All") {
        params.department = selectedDepartment;
      }
      const res = await axios.get("http://localhost:8000/api/auth/analysts", {
        withCredentials: true,
        params,
      });
      if (
        res.data &&
        res.data.success &&
        res.data.data &&
        Array.isArray(res.data.data.users)
      ) {
        setAnalysts(
          res.data.data.users.map((user) => ({
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            isActive: user.isActive,
            department: user.department,
            lastLogin: user.lastLogin,
            created: user.createdAt,
            employeeId: user.userId || "",
            canUpload: user.canUpload || false,
            avgResolutionTime: user.avgResolutionTime || 0,
          }))
        );
      } else {
        setAnalysts([]);
      }
    } catch {
      setAnalysts([]);
      console.error("Failed to fetch analysts");
    } finally {
      setLoading(false);
    }
  };

  // Helper: Always compare dates in local time (convert UTC from DB to local for comparison)
  const getLocalMidnight = (date) => {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    return d;
  };

  // Modify fetchTodayTicketStats to use your existing backend endpoints
  const fetchTodayTicketStats = async (analystId) => {
    try {
      // Get today's date with explicit year, month, day to avoid timezone issues
      const now = new Date();
      const startOfDay = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate()
      );
      startOfDay.setHours(0, 0, 0, 0); // 12:00 AM

      // Set end of day to 11:59:59.999 PM of the same day
      const endOfDay = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate()
      );
      endOfDay.setHours(23, 59, 59, 999); // 11:59:59.999 PM

      // Format dates for API
      const startDate = startOfDay.toISOString();
      const endDate = endOfDay.toISOString();

      // Fetch in-progress tickets count
      const inProgressResponse = await axios.get(
        `http://localhost:8000/api/analysttickets/${analystId}/inprogress?startDate=${startDate}&endDate=${endDate}`,
        { withCredentials: true }
      );

      // Fetch resolved tickets count
      const resolvedResponse = await axios.get(
        `http://localhost:8000/api/analysttickets/${analystId}/resolved?startDate=${startDate}&endDate=${endDate}`,
        { withCredentials: true }
      );

      // Return the counts without SLA breached tickets
      return {
        inProgress: inProgressResponse.data.success
          ? inProgressResponse.data.totalCount
          : 0,
        resolved: resolvedResponse.data.success
          ? resolvedResponse.data.totalCount
          : 0,
      };
    } catch (error) {
      console.error("Error fetching ticket stats:", error);
      return { inProgress: 0, resolved: 0 };
    }
  };

  // Add this function inside the AdminAnalyst component, after the fetchTodayTicketStats function:
  const fetchTotalResolvedTickets = async (analystId) => {
    try {
      // Get all-time date range (Jan 1, 2000 to today)
      const startDate = new Date(2000, 0, 1).toISOString();
      const endDate = new Date().toISOString();

      // Fetch resolved tickets count for all time
      const resolvedResponse = await axios.get(
        `http://localhost:8000/api/analysttickets/${analystId}/resolved?startDate=${startDate}&endDate=${endDate}`,
        { withCredentials: true }
      );

      // Return the total count of resolved tickets
      return resolvedResponse.data.success
        ? resolvedResponse.data.totalCount
        : 0;
    } catch (error) {
      console.error(
        `Error fetching total resolved tickets for analyst ${analystId}:`,
        error
      );
      return 0;
    }
  };

  // Add this function to fetch all-time SLA breached tickets
  const fetchTotalSLABreachedTickets = async (analystId) => {
    try {
      // Get all-time date range (Jan 1, 2000 to today)
      const startDate = new Date(2000, 0, 1).toISOString();
      const endDate = new Date().toISOString();

      // Fetch in-progress tickets with SLA breached count
      const inProgressResponse = await axios.get(
        `http://localhost:8000/api/analysttickets/${analystId}/inprogress?startDate=${startDate}&endDate=${endDate}`,
        { withCredentials: true }
      );

      // Fetch resolved tickets with SLA breached count
      const resolvedResponse = await axios.get(
        `http://localhost:8000/api/analysttickets/${analystId}/resolved?startDate=${startDate}&endDate=${endDate}`,
        { withCredentials: true }
      );

      // Sum up SLA breached counts from both responses
      const inProgressSLABreached = inProgressResponse.data.success
        ? inProgressResponse.data.slaBreachedCount
        : 0;
      const resolvedSLABreached = resolvedResponse.data.success
        ? resolvedResponse.data.slaBreachedCount
        : 0;

      return inProgressSLABreached + resolvedSLABreached;
    } catch (error) {
      console.error(
        `Error fetching total SLA breached tickets for analyst ${analystId}:`,
        error
      );
      return 0;
    }
  };

  // Fetch today's ticket stats for all displayed analysts
  useEffect(() => {
    const fetchStats = async () => {
      const statsObj = {};
      await Promise.all(
        displayedAnalysts.map(async (analyst) => {
          statsObj[analyst.id] = await fetchTodayTicketStats(analyst.id);
        })
      );
      setTicketStatsMap(statsObj);
    };
    if (displayedAnalysts.length > 0) fetchStats();
  }, [displayedAnalysts]);

  useEffect(() => {
    fetchAnalysts();
  }, [selectedDepartment]);

  useEffect(() => {
    let filtered = [...analysts];
    if (searchTerm) {
      filtered = filtered.filter(
        (analyst) =>
          analyst.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          analyst.employeeId.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Create a function to sort analysts based on ticket data or direct properties
    const sortAnalysts = async () => {
      // For name and employeeId sorting, we can do it directly
      if (sortConfig.field === "name") {
        filtered.sort((a, b) => {
          return sortConfig.direction === "asc"
            ? a.name.localeCompare(b.name)
            : b.name.localeCompare(a.name);
        });

        // Calculate pagination and update displayed analysts
        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        setDisplayedAnalysts(filtered.slice(startIndex, endIndex));
        return;
      }

      if (sortConfig.field === "employeeId") {
        filtered.sort((a, b) => {
          // Handle empty employee IDs by treating them as "highest" value
          if (!a.employeeId) return sortConfig.direction === "asc" ? 1 : -1;
          if (!b.employeeId) return sortConfig.direction === "asc" ? -1 : 1;
          return sortConfig.direction === "asc"
            ? a.employeeId.localeCompare(b.employeeId)
            : b.employeeId.localeCompare(a.employeeId);
        });

        // Calculate pagination and update displayed analysts
        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        setDisplayedAnalysts(filtered.slice(startIndex, endIndex));
        return;
      }

      // For ticket-based sorting, use the existing code
      const resolvedCountMap = {};
      const slaBreachedCountMap = {};

      await Promise.all(
        filtered.map(async (analyst) => {
          resolvedCountMap[analyst.id] = await fetchTotalResolvedTickets(
            analyst.id
          );
          slaBreachedCountMap[analyst.id] = await fetchTotalSLABreachedTickets(
            analyst.id
          );
        })
      );

      if (sortConfig.field === "resolved") {
        filtered.sort((a, b) => {
          const aCount = resolvedCountMap[a.id] || 0;
          const bCount = resolvedCountMap[b.id] || 0;
          return sortConfig.direction === "asc"
            ? aCount - bCount
            : bCount - aCount;
        });
      } else if (sortConfig.field === "slaBreached") {
        filtered.sort((a, b) => {
          const aCount = slaBreachedCountMap[a.id] || 0;
          const bCount = slaBreachedCountMap[b.id] || 0;
          return sortConfig.direction === "asc"
            ? aCount - bCount
            : bCount - aCount;
        });
      } else if (sortConfig.field === "avgResolutionTime") {
        filtered.sort((a, b) => {
          // If avgResolutionTime is missing, treat as "infinity" for asc, "0" for desc
          const aTime =
            typeof a.avgResolutionTime === "number"
              ? a.avgResolutionTime
              : sortConfig.direction === "asc"
              ? Number.POSITIVE_INFINITY
              : 0;
          const bTime =
            typeof b.avgResolutionTime === "number"
              ? b.avgResolutionTime
              : sortConfig.direction === "asc"
              ? Number.POSITIVE_INFINITY
              : 0;
          return sortConfig.direction === "asc"
            ? aTime - bTime
            : bTime - aTime;
        });

        // Calculate pagination and update displayed analysts
        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        setDisplayedAnalysts(filtered.slice(startIndex, endIndex));
        return;
      }

      // Calculate pagination
      const startIndex = (currentPage - 1) * itemsPerPage;
      const endIndex = startIndex + itemsPerPage;

      // Update displayed analysts with sorted and paginated results
      setDisplayedAnalysts(filtered.slice(startIndex, endIndex));
    };

    sortAnalysts();
  }, [analysts, searchTerm, currentPage, sortConfig]);

  const handleSearchChange = (e) => setSearchTerm(e.target.value);

  // Modified sort handler to toggle direction if same field is selected
  const handleSortChange = (field) => {
    setSortConfig((prevConfig) => {
      if (prevConfig.field === field) {
        // Toggle direction if clicking on the same field
        return {
          field,
          direction: prevConfig.direction === "asc" ? "desc" : "asc",
        };
      } else {
        // Default to descending for new field
        return { field, direction: "desc" };
      }
    });
    setCurrentPage(1); // Reset to first page when sorting changes
  };

  const handleViewAnalystDetails = (analyst, initialTab = "personal") => {
    setSelectedViewAnalyst(analyst);
    setActiveTabState(initialTab);
    setShowDetailsModal(true);
  };

  const getFilteredCount = () => {
    let filtered = [...analysts];
    if (searchTerm) {
      filtered = filtered.filter(
        (analyst) =>
          analyst.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          analyst.employeeId.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    return filtered.length;
  };

  // Calculate total pages
  const totalPages = Math.ceil(getFilteredCount() / itemsPerPage);

  // Handle page change
  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  // Generate page numbers array
  const getPageNumbers = () => {
    const pageNumbers = [];
    for (let i = 1; i <= totalPages; i++) {
      pageNumbers.push(i);
    }
    return pageNumbers;
  };

  const [gotoPage, setGotoPage] = useState(currentPage);

  // Sync gotoPage with currentPage when page changes
  useEffect(() => {
    setGotoPage(currentPage);
  }, [currentPage]);

  // Close filter dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        showFilterDropdown &&
        !event.target.closest(".filter-dropdown-container")
      ) {
        setShowFilterDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showFilterDropdown]);

  return (
    <AdminMainLayout>
      <div className="admin-analyst-container">
        <div className="analyst-header">
          <div className="total-box">
            <span className="text-white-600">Total Analysts:</span>
            <span className="ml-2 text-xl font-bold">{getFilteredCount()}</span>
          </div>
          <div className="search-filter-container">
            <div className="search-box">
              <input
                type="text"
                placeholder="Search by name, employee ID"
                value={searchTerm}
                onChange={handleSearchChange}
              />
            </div>

            {/* Filter dropdown button */}
            <div className="relative ml-2 filter-dropdown-container">
              <Button
                variant="outline"
                size="sm"
                className="flex items-center gap-1 px-3 py-2 font-medium"
                onClick={() => setShowFilterDropdown(!showFilterDropdown)}
              >
                <span>Filter & Sort</span>
                <span className="text-xs ml-1">
                  {showFilterDropdown ? "▲" : "▼"}
                </span>
              </Button>

              {/* Filter dropdown */}
              {showFilterDropdown && (
                <div className="absolute right-0 top-full mt-1 w-60 bg-white shadow-lg rounded-md border border-slate-200 z-50 py-2">
                  <div className="px-3 py-2 border-b border-slate-100">
                    <h4 className="text-sm font-semibold text-slate-700">
                      Sort by
                    </h4>
                  </div>

                  {/* Name sorting */}
                  <button
                    className={`group w-full text-left px-4 py-2 text-sm hover:bg-slate-50 flex items-center justify-between ${
                      sortConfig.field === "name"
                        ? "text-blue-600 bg-blue-50"
                        : "text-slate-700"
                    }`}
                    onClick={() => handleSortChange("name")}
                  >
                    <span>Name</span>
                    {sortConfig.field === "name" && (
                      <span className="text-lg font-bold">
                        {sortConfig.direction === "asc" ? "↑" : "↓"}
                      </span>
                    )}
                    {sortConfig.field !== "name" && (
                      <span className="text-gray-400 text-sm opacity-0 group-hover:opacity-100">
                        {sortConfig.direction === "asc" ? "↑" : "↓"}
                      </span>
                    )}
                  </button>

                  {/* Employee ID sorting */}
                  <button
                    className={`group w-full text-left px-4 py-2 text-sm hover:bg-slate-50 flex items-center justify-between ${
                      sortConfig.field === "employeeId"
                        ? "text-blue-600 bg-blue-50"
                        : "text-slate-700"
                    }`}
                    onClick={() => handleSortChange("employeeId")}
                  >
                    <span>Employee ID</span>
                    {sortConfig.field === "employeeId" && (
                      <span className="text-lg font-bold">
                        {sortConfig.direction === "asc" ? "↑" : "↓"}
                      </span>
                    )}
                    {sortConfig.field !== "employeeId" && (
                      <span className="text-gray-400 text-sm opacity-0 group-hover:opacity-100">
                        {sortConfig.direction === "asc" ? "↑" : "↓"}
                      </span>
                    )}
                  </button>

                  {/* Resolved tickets sorting */}
                  <button
                    className={`w-full text-left px-4 py-2 text-sm hover:bg-slate-50 flex items-center justify-between ${
                      sortConfig.field === "resolved"
                        ? "text-blue-600 bg-blue-50"
                        : "text-slate-700"
                    }`}
                    onClick={() => handleSortChange("resolved")}
                  >
                    <span>Resolved Tickets Count</span>
                    {sortConfig.field === "resolved" && (
                      <span className="text-lg font-bold">
                        {sortConfig.direction === "asc" ? "↑" : "↓"}
                      </span>
                    )}
                    {sortConfig.field !== "resolved" && (
                      <span className="text-gray-400 text-sm opacity-0 group-hover:opacity-100">
                        {sortConfig.direction === "asc" ? "↑" : "↓"}
                      </span>
                    )}
                  </button>

                  {/* SLA Breached sorting */}
                  <button
                    className={`w-full text-left px-4 py-2 text-sm hover:bg-slate-50 flex items-center justify-between ${
                      sortConfig.field === "slaBreached"
                        ? "text-blue-600 bg-blue-50"
                        : "text-slate-700"
                    }`}
                    onClick={() => handleSortChange("slaBreached")}
                  >
                    <span>SLA Breached Tickets Count</span>
                    {sortConfig.field === "slaBreached" && (
                      <span className="text-lg font-bold">
                        {sortConfig.direction === "asc" ? "↑" : "↓"}
                      </span>
                    )}
                    {sortConfig.field !== "slaBreached" && (
                      <span className="text-gray-400 text-sm opacity-0 group-hover:opacity-100">
                        {sortConfig.direction === "asc" ? "↑" : "↓"}
                      </span>
                    )}
                  </button>

                  {/* Average Resolution Time sorting */}
                  <button
                    className={`w-full text-left px-4 py-2 text-sm hover:bg-slate-50 flex items-center justify-between ${
                      sortConfig.field === "avgResolutionTime"
                        ? "text-blue-600 bg-blue-50"
                        : "text-slate-700"
                    }`}
                    onClick={() => handleSortChange("avgResolutionTime")}
                  >
                    <span>Average Resolution Time</span>
                    {sortConfig.field === "avgResolutionTime" && (
                      <span className="text-lg font-bold">
                        {sortConfig.direction === "asc" ? "↑" : "↓"}
                      </span>
                    )}
                    {sortConfig.field !== "avgResolutionTime" && (
                      <span className="text-gray-400 text-sm opacity-0 group-hover:opacity-100">
                        {sortConfig.direction === "asc" ? "↑" : "↓"}
                      </span>
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {loading ? (
          <div className="loading flex justify-center items-center py-10">
            <LoadingSpinner />
          </div>
        ) : (
          <>
            <div className="analysts-list grid grid-cols-1 md:grid-cols-2 gap-6">
              {displayedAnalysts.map((analyst) => {
                const stats = ticketStatsMap[analyst.id] || {
                  resolved: 0,
                  inProgress: 0,
                };
                // Only count in-progress and resolved tickets for "Assigned" value
                const assignedCount =
                  (stats.inProgress || 0) + (stats.resolved || 0);

                return (
                  <div
                    key={analyst.id}
                    className="analyst-card bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden h-[240px]"
                    onClick={() => handleViewAnalystDetails(analyst)}
                  >
                    <div className="analyst-info flex">
                      {/* Left Side - Analyst Image and Join Date */}
                      <div className="w-1/4 flex flex-col items-center justify-center p-3 border-r border-slate-200">
                        <div className="w-20 h-20 rounded-full bg-blue-100 border-2 border-blue-300 flex items-center justify-center mb-3">
                          <span className="text-3xl text-blue-500">
                            {analyst.name.charAt(0)}
                          </span>
                        </div>
                        <div className="text-center">
                          <div className="text-xs font-medium text-slate-500 mb-1">
                            Joined
                          </div>
                          <div className="text-sm font-semibold">
                            {formatDateOnly(analyst.created)}
                          </div>
                        </div>
                      </div>

                      {/* Right Side - Analyst Details */}
                      <div className="w-3/4 p-4">
                        {/* Top Row - Name and Upload Permission */}
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h3 className="font-semibold text-base text-blue-500">
                              {analyst.name}
                            </h3>
                          </div>
                          <div>
                            {analyst.canUpload && (
                              <span className="text-xs font-semibold bg-green-200 text-black px-2 py-1 rounded-full">
                                Can Upload
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Email */}
                        <div className="mb-1">
                          <span className="text-sm font-medium text-blue-900">
                            Email:
                          </span>
                          <span className="text-sm font-semibold text-black ml-1">
                            {analyst.email}
                          </span>
                        </div>

                        {/* Employee ID */}
                        <div className="mb-1">
                          <span className="text-sm font-medium text-blue-900">
                            Employee ID:
                          </span>
                          <span className="text-sm font-semibold text-black ml-1">
                            {analyst.employeeId || "N/A"}
                          </span>
                        </div>

                        {/* Department */}
                        <div className="mb-3">
                          <span className="text-sm font-medium text-blue-900">
                            Department:
                          </span>
                          <span className="text-sm font-semibold text-black ml-1">
                            {analyst.department || "Not assigned"}
                          </span>
                        </div>

                        {/* Ticket Stats */}
                        <div className="flex gap-2 mt-2">
                          <div className="text-sm font-medium text-blue-900">
                            Today's Ticket:
                          </div>
                          <div className="ticket-stat-box bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-semibold">
                            Assigned: {assignedCount}
                          </div>
                          <div className="ticket-stat-box bg-orange-100 text-orange-800 px-2 py-1 rounded text-xs font-semibold">
                            In Progress: {stats.inProgress || 0}
                          </div>
                          <div className="ticket-stat-box bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-xs font-semibold">
                            Resolved: {stats.resolved || 0}
                          </div>
                        </div>

                        {/* View Details Button */}
                        <div className="mt-3 text-right">
                          <Button
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleViewAnalystDetails(analyst);
                            }}
                          >
                            View Details
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {displayedAnalysts.length === 0 && (
              <div className="no-results">
                No analysts found matching your search.
              </div>
            )}

            {displayedAnalysts.length > 0 && (
              <div className="sticky bottom-0 left-0 right-0 flex justify-between items-center px-4 py-2 bg-white border-t border-gray-200 shadow-md z-20">
                <div className="text-sm text-gray-700">
                  {displayedAnalysts.length > 0
                    ? `Showing ${
                        (currentPage - 1) * itemsPerPage + 1
                      }-${Math.min(
                        currentPage * itemsPerPage,
                        getFilteredCount()
                      )} of ${getFilteredCount()} analysts`
                    : "No analysts to display"}
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="flex items-center"
                  >
                    &lt; Previous
                  </Button>

                  <div className="flex items-center space-x-1">
                    {[...Array(totalPages > 0 ? totalPages : 1)].map((_, i) => (
                      <Button
                        key={i + 1}
                        variant={currentPage === i + 1 ? "default" : "outline"}
                        size="sm"
                        onClick={() => handlePageChange(i + 1)}
                        className="w-8 h-8 p-0"
                      >
                        {i + 1}
                      </Button>
                    ))}
                  </div>

                  {/* Direct page input */}
                  <div className="flex items-center space-x-1 ml-2">
                    <span className="text-xs text-gray-500">Go to:</span>
                    <input
                      type="number"
                      min="1"
                      max={totalPages > 0 ? totalPages : 1}
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
                        if (page !== currentPage) handlePageChange(page);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          let page = parseInt(gotoPage, 10);
                          if (isNaN(page) || page < 1) page = 1;
                          if (page > totalPages) page = totalPages;
                          setGotoPage(page);
                          if (page !== currentPage) handlePageChange(page);
                        }
                      }}
                      className="w-12 h-8 border border-gray-300 rounded p-1 text-center text-sm"
                    />
                    <span className="text-xs text-gray-500">
                      of {totalPages > 0 ? totalPages : 1}
                    </span>
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages || totalPages === 0}
                    className="flex items-center"
                  >
                    Next &gt;
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Analyst Details Modal */}
      <AnalystDetailsModal
        open={showDetailsModal}
        onClose={() => setShowDetailsModal(false)}
        analyst={selectedViewAnalyst}
        initialActiveTab={activeTabState}
        onUpdateCompleted={fetchAnalysts}
      />
    </AdminMainLayout>
  );
};

export default AdminAnalyst;

const AnalystDetailsModal = ({
  open,
  onClose,
  analyst,
  initialActiveTab = "personal",
  onUpdateCompleted,
}) => {
  const [analystDetails, setAnalystDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [ticketStats, setTicketStats] = useState(null);
  const [ticketLoading, setTicketLoading] = useState(false);
  const [timeFilter, setTimeFilter] = useState("today");
  const [activeTab, setActiveTab] = useState(initialActiveTab);
  const [canUpload, setCanUpload] = useState(false);
  const [saving, setSaving] = useState(false);
  const [updateSuccess, setUpdateSuccess] = useState(false);
  const [tickets, setTickets] = useState([]);
  const [fromDate, setFromDate] = useState(null);
  const [toDate, setToDate] = useState(null);

  useEffect(() => {
    if (initialActiveTab) setActiveTab(initialActiveTab);
  }, [initialActiveTab]);

  useEffect(() => {
    if (analyst && open) {
      setLoading(true);
      setTimeout(() => {
        setAnalystDetails(analyst);
        setCanUpload(analyst.canUpload || false);
        setLoading(false);
      }, 200);
    }
  }, [analyst, open]);

  // Add these helper functions to the AnalystDetailsModal component
  const getWeekDates = () => {
    const now = new Date();
    const currentDay = now.getDay(); // 0 = Sunday, 1 = Monday, etc.

    // Calculate days to subtract to get to Monday (or Sunday if you prefer week start = Sunday)
    const daysToMonday = currentDay === 0 ? 6 : currentDay - 1; // Adjust if week starts on Sunday

    // Create date for start of the week (Monday)
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - daysToMonday);
    startOfWeek.setHours(0, 0, 0, 0);

    // Create date for end of the week (Sunday)
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);

    return {
      start: startOfWeek,
      end: endOfWeek,
    };
  };

  const getMonthDates = () => {
    const now = new Date();

    // First day of the current month
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    startOfMonth.setHours(0, 0, 0, 0);

    // Last day of the current month
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    endOfMonth.setHours(23, 59, 59, 999);

    return {
      start: startOfMonth,
      end: endOfMonth,
    };
  };

  const getYearDates = () => {
    const now = new Date();

    // January 1st of the current year
    const startOfYear = new Date(now.getFullYear(), 0, 1);
    startOfYear.setHours(0, 0, 0, 0);

    // December 31st of the current year
    const endOfYear = new Date(now.getFullYear(), 11, 31);
    endOfYear.setHours(23, 59, 59, 999);

    return {
      start: startOfYear,
      end: endOfYear,
    };
  };

  // Then modify the useEffect for fetching ticket data:
  useEffect(() => {
    if (!analyst || !open || activeTab !== "tickets") return;
    setTicketLoading(true);

    const fetchAnalystTickets = async () => {
      try {
        // Default to today's date
        const now = new Date();
        let startDate, endDate;

        // Create dates using explicit year, month, day to avoid timezone issues
        if (timeFilter === "today") {
          // Today: midnight to 11:59:59 PM
          const startOfDay = new Date(
            now.getFullYear(),
            now.getMonth(),
            now.getDate()
          );
          startOfDay.setHours(0, 0, 0, 0);

          const endOfDay = new Date(
            now.getFullYear(),
            now.getMonth(),
            now.getDate()
          );
          endOfDay.setHours(23, 59, 59, 999);

          startDate = startOfDay.toISOString();
          endDate = endOfDay.toISOString();
        } else if (timeFilter === "week") {
          const weekDates = getWeekDates();
          startDate = weekDates.start.toISOString();
          endDate = weekDates.end.toISOString();
        } else if (timeFilter === "month") {
          const monthDates = getMonthDates();
          startDate = monthDates.start.toISOString();
          endDate = monthDates.end.toISOString();
        } else if (timeFilter === "year") {
          const yearDates = getYearDates();
          startDate = yearDates.start.toISOString();
          endDate = yearDates.end.toISOString();
        } else if (timeFilter === "custom" && fromDate && toDate) {
          // Convert string dates to Date objects for proper handling
          const customStart = new Date(fromDate);
          customStart.setHours(0, 0, 0, 0);

          const customEnd = new Date(toDate);
          customEnd.setHours(23, 59, 59, 999);

          startDate = customStart.toISOString();
          endDate = customEnd.toISOString();
        }

        // Fetch in-progress tickets count
        const inProgressResponse = await axios.get(
          `http://localhost:8000/api/analysttickets/${analyst.id}/inprogress?startDate=${startDate}&endDate=${endDate}`,
          { withCredentials: true }
        );

        // Fetch resolved tickets count
        const resolvedResponse = await axios.get(
          `http://localhost:8000/api/analysttickets/${analyst.id}/resolved?startDate=${startDate}&endDate=${endDate}`,
          { withCredentials: true }
        );

        // Get tickets for additional data if needed
        const response = await fetch(
          `http://localhost:8000/api/analysttickets/${analyst.id}`,
          {
            method: "GET",
            credentials: "include",
            headers: {
              "Content-Type": "application/json",
            },
          }
        );

        const data = await response.json();

        if (data.success && data.tickets) {
          setTickets(data.tickets);
        }

        // Get counts from backend responses
        const inProgressCount = inProgressResponse.data.success
          ? inProgressResponse.data.totalCount
          : 0;
        const resolvedCount = resolvedResponse.data.success
          ? resolvedResponse.data.totalCount
          : 0;

        // Calculate SLA breached from API responses
        const inProgressSLABreachedCount = inProgressResponse.data.success
          ? inProgressResponse.data.slaBreachedCount
          : 0;
        const resolvedSLABreachedCount = resolvedResponse.data.success
          ? resolvedResponse.data.slaBreachedCount
          : 0;
        const totalSLABreachedCount =
          inProgressSLABreachedCount + resolvedSLABreachedCount;

        // Set ticket stats with total SLA breached count
        setTicketStats({
          inProgress: inProgressCount,
          resolved: resolvedCount,
          slaBreached: totalSLABreachedCount,
          assigned: inProgressCount + resolvedCount,
        });
      } catch (error) {
        console.error("Error fetching analyst tickets:", error);
        setTickets([]);
        setTicketStats({
          inProgress: 0,
          resolved: 0,
          slaBreached: 0,
          assigned: 0,
        });
      } finally {
        setTicketLoading(false);
      }
    };

    fetchAnalystTickets();
  }, [analyst, open, timeFilter, activeTab, fromDate, toDate]);

  const handleTimeFilterChange = (value) => {
    setTimeFilter(value);
    if (value !== "custom") {
      setFromDate(null);
      setToDate(null);
    }
  };

  const handleTabChange = (tab) => setActiveTab(tab);

  const handleSavePermissions = async () => {
    if (!analystDetails) return;

    setSaving(true);
    setUpdateSuccess(false);
    try {
      await axios.patch(
        `http://localhost:8000/api/users/${analystDetails.id}/permission`,
        { canUpload },
        { withCredentials: true }
      );
      analystDetails.canUpload = canUpload;
      setAnalystDetails({ ...analystDetails });
      setUpdateSuccess(true);
      if (typeof onUpdateCompleted === "function") onUpdateCompleted();
      setTimeout(() => setUpdateSuccess(false), 2000);
    } catch {
      alert("Failed to update permissions");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl w-[1000px] h-[650px] p-0 overflow-hidden bg-white text-slate-800 border-none">
        {/* Increased height of the header bar */}
        <div className="px-6 py-6 border-b border-slate-200 flex justify-between items-center bg-gradient-to-r from-blue-500 to-blue-600 text-white">
          <h2 className="text-2xl font-semibold flex items-center">
            <span className="mr-3">Analyst Profile</span>
          </h2>
        </div>

        {/* Tabs */}
        <div className="flex mt-2 px-6 gap-1 border-b border-slate-200">
          {["personal", "tickets", "permissions"].map((tab) => (
            <button
              key={tab}
              className={`py-3 px-5 text-sm font-medium transition-colors border-b-2 ${
                activeTab === tab
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-slate-600 hover:text-slate-800 hover:border-slate-300"
              }`}
              onClick={() => handleTabChange(tab)}
            >
              {tab === "personal" && "Personal Details"}
              {tab === "tickets" && "Ticket Statistics"}
              {tab === "permissions" && "Permissions"}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="py-10 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-t-blue-500 border-r-transparent border-b-blue-500 border-l-transparent"></div>
            <p className="mt-3 text-base text-slate-600">Loading details...</p>
          </div>
        ) : !analystDetails ? (
          <p className="text-center text-red-600 py-8 text-base">
            Could not load analyst details.
          </p>
        ) : (
          <div className="h-[500px] overflow-y-auto">
            {/* Personal Details */}
            {activeTab === "personal" && (
              <div className="p-6">
                <div className="mb-6 p-4 rounded-lg bg-gradient-to-br from-blue-50 to-white border border-blue-100">
                  <h3 className="font-semibold text-lg mb-4 text-blue-900">
                    Personal Information
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-8">
                    <div>
                      <div className="text-blue-500 font-medium text-sm mb-1">
                        Full Name
                      </div>
                      <div className="text-slate-900 text-base font-semibold">
                        {analystDetails.name}
                      </div>
                    </div>
                    <div>
                      <div className="text-blue-500 font-medium text-sm mb-1">
                        Email Address
                      </div>
                      <div className="text-slate-900 text-base font-semibold break-all">
                        {analystDetails.email}
                      </div>
                    </div>
                    <div>
                      <div className="text-blue-500 font-medium text-sm mb-1">
                        Employee ID
                      </div>
                      <div className="text-slate-900 text-base font-semibold">
                        {analystDetails.employeeId || (
                          <span className="text-slate-400 text-sm italic">
                            Not assigned
                          </span>
                        )}
                      </div>
                    </div>
                    <div>
                      <div className="text-blue-500 font-medium text-sm mb-1">
                        Department
                      </div>
                      <div className="text-slate-900 text-base font-semibold">
                        {analystDetails.department || (
                          <span className="text-slate-400 text-sm italic">
                            Not assigned
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mb-6 p-4 rounded-lg bg-gradient-to-br from-slate-50 to-white border border-slate-100">
                  <h3 className="font-semibold text-lg mb-4 text-blue-900">
                    Account Information
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-8">
                    <div>
                      <div className="text-blue-500 font-medium text-sm mb-1">
                        Role
                      </div>
                      <div className="text-slate-900 text-base font-semibold">
                        Analyst
                      </div>
                    </div>
                    <div>
                      <div className="text-blue-500 font-medium text-sm mb-1">
                        Upload Permission
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <span
                          className={`h-2 w-2 rounded-full ${
                            analystDetails.canUpload
                              ? "bg-green-500"
                              : "bg-red-500"
                          }`}
                        ></span>
                        <span
                          className={`font-semibold text-sm ${
                            analystDetails.canUpload
                              ? "text-green-700"
                              : "text-red-700"
                          }`}
                        >
                          {analystDetails.canUpload ? "Enabled" : "Disabled"}
                        </span>
                      </div>
                    </div>
                    <div>
                      <div className="text-blue-500 font-medium text-sm mb-1">
                        Account Created
                      </div>
                      <div className="text-slate-900 text-base font-semibold">
                        {formatDate(analystDetails.created)}
                      </div>
                    </div>
                    <div>
                      <div className="text-blue-500 font-medium text-sm mb-1">
                        Last Login
                      </div>

                      <div className="text-slate-900 text-base font-semibold">
                        {analystDetails.lastLogin ? (
                          formatDate(analystDetails.lastLogin)
                        ) : (
                          <span className="text-slate-400 italic">
                            Never logged in
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Ticket Statistics */}
            {activeTab === "tickets" && (
              <div className="px-6 py-4">
                {/* Time filter */}
                <div className="mb-4 p-3 bg-white rounded-lg border border-slate-200 flex flex-wrap items-center gap-3">
                  <span className="text-slate-800 text-sm font-medium">
                    Time period:
                  </span>
                  <button
                    className={`px-3 py-1 rounded text-xs font-semibold border ${
                      timeFilter === "today"
                        ? "bg-blue-600 text-white border-blue-600"
                        : "bg-white text-blue-700 border-blue-200 hover:bg-blue-50"
                    }`}
                    onClick={() => handleTimeFilterChange("today")}
                  >
                    Today
                  </button>
                  <button
                    className={`px-3 py-1 rounded text-xs font-semibold border ${
                      timeFilter === "week"
                        ? "bg-blue-600 text-white border-blue-600"
                        : "bg-white text-blue-700 border-blue-200 hover:bg-blue-50"
                    }`}
                    onClick={() => handleTimeFilterChange("week")}
                  >
                    This Week
                  </button>
                  <button
                    className={`px-3 py-1 rounded text-xs font-semibold border ${
                      timeFilter === "month"
                        ? "bg-blue-600 text-white border-blue-600"
                        : "bg-white text-blue-700 border-blue-200 hover:bg-blue-50"
                    }`}
                    onClick={() => handleTimeFilterChange("month")}
                  >
                    This Month
                  </button>
                  <button
                    className={`px-3 py-1 rounded text-xs font-semibold border ${
                      timeFilter === "year"
                        ? "bg-blue-600 text-white border-blue-600"
                        : "bg-white text-blue-700 border-blue-200 hover:bg-blue-50"
                    }`}
                    onClick={() => handleTimeFilterChange("year")}
                  >
                    This Year
                  </button>
                  <div className="flex items-center gap-1">
                    <span className="text-xs text-slate-500 ml-2">From</span>
                    <input
                      type="date"
                      className="border rounded px-2 py-1 text-xs"
                      value={fromDate || ""}
                      onChange={(e) => {
                        setFromDate(e.target.value);
                        handleTimeFilterChange("custom");
                        // If "toDate" is set and now less than new "fromDate", reset "toDate"
                        if (toDate && e.target.value && toDate < e.target.value) {
                          setToDate(e.target.value);
                        }
                      }}
                      max={toDate || undefined} // Prevent picking a "from" after "to"
                    />
                    <span className="text-xs text-slate-500">to</span>
                    <input
                      type="date"
                      className="border rounded px-2 py-1 text-xs"
                      value={toDate || ""}
                      onChange={(e) => {
                        // Only allow "to" >= "from"
                        if (!fromDate || e.target.value >= fromDate) {
                          setToDate(e.target.value);
                          handleTimeFilterChange("custom");
                        }
                      }}
                      min={fromDate || undefined} // Prevent picking a "to" before "from"
                    />
                  </div>
                </div>

                {ticketLoading ? (
                  <div className="text-center py-6 text-slate-600">
                    <div className="inline-block animate-spin rounded-full h-6 w-6 border-3 border-t-blue-500 border-blue-200"></div>
                    <div className="mt-3 text-sm">
                      Loading ticket statistics...
                    </div>
                  </div>
                ) : ticketStats ? (
                  <>
                    {/* Ticket Overview - Updated to remove Closed and Open tickets */}
                    <div className="mb-6 p-4 rounded-lg bg-gradient-to-br from-blue-50 to-white border border-blue-100">
                      <h3 className="font-semibold text-lg mb-4 text-blue-800">
                        Ticket Overview
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
                        <div className="p-2 rounded-md bg-gradient-to-br from-slate-100 to-slate-50 border border-slate-200 flex flex-col items-center">
                          <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center mb-1">
                            <span className="text-base">🎫</span>
                          </div>
                          <span className="text-base font-bold">
                            {ticketStats.assigned || 0}
                          </span>
                          <span className="font-medium text-sm mt-1">
                            Assigned
                          </span>
                        </div>
                        <div className="p-2 rounded-md bg-gradient-to-br from-amber-200 to-amber-300 border border-amber-200 flex flex-col items-center">
                          <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center mb-1">
                            <span className="text-base">⏳</span>
                          </div>
                          <span className="text-base font-bold">
                            {ticketStats.inProgress || 0}
                          </span>
                          <span className="font-medium text-sm mt-1">
                            In Progress
                          </span>
                        </div>
                        <div className="p-2 rounded-md bg-gradient-to-br from-green-200 to-green-300 border border-green-200 flex flex-col items-center">
                          <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center mb-1">
                            <span className="text-base">✅</span>
                          </div>
                          <span className="text-base font-bold">
                            {ticketStats.resolved || 0}
                          </span>
                          <span className="font-medium text-sm mt-1">
                            Resolved
                          </span>
                        </div>
                        <div className="p-2 rounded-md bg-gradient-to-br from-rose-200 to-rose-300 border border-rose-200 flex flex-col items-center">
                          <div className="w-8 h-8 rounded-full bg-rose-100 flex items-center justify-center mb-1">
                            <span className="text-base">⚠️</span>
                          </div>
                          <span className="text-base font-bold">
                            {ticketStats.slaBreached || 0}
                          </span>
                          <span className="font-medium text-sm mt-1">
                            SLA Breached
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Additional detailed statistics - Updated calculations */}
                    <div className="mb-6 p-4 rounded-lg bg-gradient-to-br from-blue-50 to-white border border-blue-100">
                      <h3 className="font-semibold text-lg mb-4 text-blue-800">
                        Performance Metrics
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-white p-4 rounded-lg border border-blue-100">
                          <h4 className="font-medium text-sm text-blue-600 mb-2">
                            Resolution Rate
                          </h4>
                          <div className="text-2xl font-bold text-slate-800">
                            {ticketStats.assigned > 0
                              ? Math.round(
                                  (ticketStats.resolved / ticketStats.assigned) *
                                    100
                                )
                              : 0}
                            %
                          </div>
                          <p className="text-xs text-slate-500 mt-1">
                            Tickets resolved vs. total assigned
                          </p>
                        </div>
                        <div className="bg-white p-4 rounded-lg border border-blue-100">
                          <h4 className="font-medium text-sm text-blue-600 mb-2">
                            SLA Compliance
                          </h4>
                          <div className="text-2xl font-bold text-slate-800">
                            {ticketStats.assigned > 0
                              ? Math.round(
                                  ((ticketStats.assigned - ticketStats.slaBreached) /
                                    ticketStats.assigned) *
                                    100
                                )
                              : 0}
                            %
                          </div>
                          <p className="text-xs text-slate-500 mt-1">
                            Tickets within SLA vs. total tickets
                          </p>
                        </div>
                        {/* Average Resolution Time */}
                        <div className="bg-white p-4 rounded-lg border border-blue-100">
                          <h4 className="font-medium text-sm text-blue-600 mb-2">
                            Average Resolution Time
                          </h4>
                          <div className="text-2xl font-bold text-slate-800">
                            {formatResolutionTime(analystDetails.avgResolutionTime)}
                          </div>
                          <p className="text-xs text-slate-500 mt-1">
                            Average time to resolve a ticket
                          </p>
                        </div>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-4 text-red-600 text-sm">
                    Could not load ticket statistics.
                  </div>
                )}
              </div>
            )}

            {activeTab === "permissions" && (
              <div className="p-6">
                <div className="mb-6 p-4 rounded-lg bg-gradient-to-br from-indigo-50 to-white border border-indigo-100">
                  <h3 className="font-semibold text-2xl mb-2 text-indigo-800">
                    Permission Management
                  </h3>
                  <p className="text-base text-slate-900 mb-4">
                    Control what this analyst can do in the system. Permissions
                    affect the analyst's ability to perform specific actions.
                  </p>

                  {updateSuccess && (
                    <div className="bg-green-50 text-green-800 p-3 mb-4 rounded-md flex items-center text-sm border border-green-200">
                      <span className="mr-2 text-base">✓</span>
                      Permissions updated successfully
                    </div>
                  )}

                  <div className="py-4 flex justify-between items-center border-b border-indigo-100">
                    <div>
                      <div className="font-semibold text-2xl mb-2 text-indigo-800">
                        Upload Permission
                        <span className="ml-6 mb-4">
                          <Switch
                            checked={canUpload}
                            onCheckedChange={setCanUpload}
                            className="data-[state=checked]:bg-green-600 data-[state=unchecked]:bg-red-500"
                          />
                        </span>
                      </div>
                      <span className="text-base text-slate-900 block ">
                        Allows the analyst to upload documents
                      </span>
                    </div>
                    <div className="flex items-center gap-3 ">
                      <div
                        className={`text-base font-semibold ${
                          canUpload ? "text-green-600" : "text-red-500"
                        }`}
                      >
                        {canUpload ? "Enabled" : "Disabled"}
                      </div>
                    </div>
                  </div>

                  <div className="mt-8 pt-4 border-t border-indigo-100">
                    <Button
                      onClick={handleSavePermissions}
                      disabled={saving}
                      className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2"
                    >
                      {saving ? (
                        <>
                          <span className="inline-block animate-spin mr-2">
                            ⟳
                          </span>
                          Saving...
                        </>
                      ) : (
                        "Save Changes"
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};