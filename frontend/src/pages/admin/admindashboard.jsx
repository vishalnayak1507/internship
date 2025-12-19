import React, { useState, useEffect,useRef} from "react";
import AdminMainLayout from "../../components/admin/layoutComponents/AdminMainLayout";
import TicketSummaryCards from "../../components/admin/dashboard/TicketSummaryCards";
import TicketsBySourcePie from "../../components/admin/dashboard/TicketsBySourcePie";
import TicketsByStatusPie from "../../components/admin/dashboard/TicketsByStatusPie";
import TicketTrendChart from "../../components/admin/dashboard/TicketTrendChart";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import ErrorAlert from "../../components/common/ErrorAlert";
import TimeFilter from "../../components/common/TimeFilter";
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
import useDashboardData from "../../hooks/admin/useDashboardData";
import useTicketTrend from "../../hooks/admin/useTicketTrend";
import useTicketsBySource from "../../hooks/admin/useTicketsBySource";
import useTicketsByStatus from "../../hooks/admin/useTicketsByStatus";
import { useDepartment } from "../../utils/admin/DepartmentContext";

import { io } from "socket.io-client";
import AdminTicketExport from "../../components/admin/exportTickets/AdminTicketExport";
import { Filter } from "lucide-react";
// Define animation keyframes
const filterAnimationStyle = `
  @keyframes filterFloat {
    from { opacity: 0; transform: translateY(-15px); }
    to { opacity: 1; transform: translateY(0); }
  }

  @keyframes expandLeftward {
    from { opacity: 0.7; transform: scaleX(0.2); transform-origin: right center; }
    to { opacity: 1; transform: scaleX(1); transform-origin: right center; }
  }
  
  .filter-container {
    backface-visibility: hidden;
    -webkit-backface-visibility: hidden;
    perspective: 1000px;
    -webkit-perspective: 1000px;
    transform-origin: right center;
  }
     
  /* Prevent transitions when interacting with date inputs */
  .date-focused {
    transition: none !important;
    animation: none !important;
  }
  
  /* Add smooth transition for minimizing/expanding */
  .filter-container.expanded {
    animation: expandLeftward 0.25s ease-out;
    transform-origin: right center;
  }

  .filter-container.minimized {
    transition: all 0.25s ease-in-out;
  }

  /* Custom range container styles */
  .custom-range-container {
    position: absolute !important;
    left: 100% !important;
    top: 0 !important;
    margin-left: 5px !important;
  }
`;

const AdminDashboard = () => {
  const { selectedDepartment } = useDepartment();
  const [timeFilter, setTimeFilter] = useState({ period: "all" });
  const refreshTimerRef = useRef(null);
  const [lastRefreshed, setLastRefreshed] = useState(new Date());
  const [scrolled, setScrolled] = useState(false);

const { summary, loading, error, refetch: refreshDashboard } = useDashboardData(timeFilter, selectedDepartment);
const { trend, loading: trendLoading, error: trendError, refetch: refreshTrend } = useTicketTrend(timeFilter, selectedDepartment);
const { data: sourceData, loading: sourceLoading, error: sourceError, refetch: refreshSource } = useTicketsBySource(timeFilter, selectedDepartment);
const { statusData, loading: statusLoading, error: statusError, refetch: refreshStatus } = useTicketsByStatus(timeFilter, selectedDepartment);  const [departments, setDepartments] = useState([]);
  const [userRole, setUserRole] = useState("");
  const socketRef = useRef(null);
  const [filterMinimized, setFilterMinimized] = useState(false);
  const [dateInputFocused, setDateInputFocused] = useState(false);

  const [timeRange, setTimeRange] = useState("all");      // "today", "week", "month", "all", "custom"
const [startDate, setStartDate] = useState("");
const [endDate, setEndDate] = useState("");

let filterLeaveTimeout = useRef();
const timeoutRef = useRef(null);

useEffect(() => {
  socketRef.current = io("http://localhost:8000", {
    withCredentials: true,
  });

  socketRef.current.on("ticket:new", (ticket) => {
    console.log("Received new ticket via socket:", ticket);
    if (typeof refreshDashboard === "function") refreshDashboard();
    if (typeof refreshTrend === "function") refreshTrend();
    if (typeof refreshSource === "function") refreshSource();
    if (typeof refreshStatus === "function") refreshStatus();
    setLastRefreshed(new Date());
  });

  // Cleanup on unmount
  return () => {
    if (socketRef.current) {
      socketRef.current.disconnect();
    }
  };
}, [refreshDashboard, refreshTrend, refreshSource, refreshStatus]);

  useEffect(() => {
    const fetchProfileAndDepartments = async () => {
      try {
        const profileRes = await axios.get(
          "http://localhost:8000/api/auth/profile",
          { withCredentials: true }
        );
        if (profileRes.data && profileRes.data.success) {
          const role =
            profileRes.data.data?.role ||
            profileRes.data.user?.role ||
            profileRes.data.data?.user?.role ||
            profileRes.data.role;
          setUserRole(role);

          if (role === "superadmin") {
            const deptRes = await axios.get(
              "http://localhost:8000/api/departments"
            );
            if (deptRes.data && deptRes.data.success) {
              setDepartments(deptRes.data.departments || []);
            }
          } else if (role === "admin") {
            const dept =
              profileRes.data.data?.department ||
              profileRes.data.user?.department ||
              profileRes.data.data?.user?.department ||
              profileRes.data.department;
            setDepartments(dept ? [dept] : []);
          }
        }
      } catch (err) {
        console.error("Error fetching profile/departments:", err);
      }
    };

    fetchProfileAndDepartments();
  }, []);
useEffect(() => {
  return () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
  };
}, []);


  // Calculate total tickets from summary
  const totalTickets = summary
    ? summary.open +
      summary.inProgress +
      (summary.resolved || 0) +
      summary.closed
    : 0;

  // Previous filter state reference to avoid unnecessary updates
  const prevFilterRef = useRef({ period: "all" });
  
  const handleTimeFilterChange = (filter) => {
    // Check if the filter is actually different from the current one
    const isEqual = (a, b) => {
      if (a === b) return true;
      if (!a || !b) return false;
      
      // Compare objects
      const aKeys = Object.keys(a);
      const bKeys = Object.keys(b);
      
      if (aKeys.length !== bKeys.length) return false;
      
      return aKeys.every(key => a[key] === b[key]);
    };
    
    // Only update if filter actually changed
    if (!isEqual(filter, prevFilterRef.current)) {
      prevFilterRef.current = filter;
      setTimeFilter(filter);
    }
  };

  useEffect(() => {
  const handleScroll = () => {
    const offset = window.scrollY;
    // Just update scrolled state (for positioning)
    setScrolled(offset > 20);
    
    // Only minimize if not hovering - we'll track this with a ref
    if (offset > 20 && !isHovering.current) {
      // Just update the visual state, no need to affect data state
      setFilterMinimized(true);
    } else if (offset <= 20) {
      setFilterMinimized(false);
    }
  };

  window.addEventListener('scroll', handleScroll);
  return () => window.removeEventListener('scroll', handleScroll);
}, []); 
const isHovering = useRef(false);

  // No need for extra loading logic since React state will maintain values across renders
  // The existing state management handles date persistence

  return (
    <AdminMainLayout key={selectedDepartment}>
      {/* Add animation styles */}
      <style dangerouslySetInnerHTML={{ __html: filterAnimationStyle }} />
      <div className="dashboard-header"
        style={{
          background: "#f8f9fa",
          padding: "24px 16px",
          fontFamily: "'Segoe UI', Roboto, 'Helvetica Neue', sans-serif",
          overflow: "visible",
          width: "100%",
          boxSizing: "border-box",
          position: "relative",
        }}
      >
        <div
          style={{
            width: "100%",
            maxWidth: "1200px",
            margin: "0 auto",
            boxSizing: "border-box",
          }}
        >
          {/* Sticky filter container */}
          <div
            className="dashboard-filters"
            style={{
              position: "relative",
              marginBottom: "16px",
              display: "flex",
              justifyContent: "flex-end",
               zIndex: 99,
            }}
          >
            {/* Detached floating filter that hovers over navbar */}
            <div 
              className={`filter-container ${dateInputFocused ? "date-focused" : ""} ${filterMinimized ? "minimized" : "expanded"}`}
              style={{
                position: scrolled ? "fixed" : "static",
                top: scrolled ? "10px" : "auto", // Position it over the navbar
                left: scrolled ? "380px" : "auto", // Positioned near the Tech Mahindra logo (more rightward)
                transform: scrolled ? "none" : "none", // No transform needed
                zIndex: 99, // Higher than navbar
                background: scrolled ? "white" : "transparent",
                padding: scrolled ? "8px 16px" : "0",
                borderRadius: scrolled ? "8px" : "0",
                boxShadow: scrolled ? "0 3px 10px rgba(0,0,0,0.15)" : "none",
                transition: "all 0.25s ease",
                border: scrolled ? "1px solid rgba(25, 118, 210, 0.15)" : "none",
                animation: scrolled ? "filterFloat 0.3s ease-out" : "none", // Apply animation when floated
                minWidth: filterMinimized ? 48 : 320,
                maxWidth: "90vw",
                width: filterMinimized ? 48 : "auto",
                minHeight: 48,
                overflow: "visible",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: filterMinimized ? "pointer" : "default",
                pointerEvents: "auto" // Ensure this is always clickable
              }}
              onClick={() => {
                if (filterMinimized) {
                  // Simply expand the filter - all state is maintained
                  setFilterMinimized(false);
                  
                  // If we're in custom mode and have both dates, ensure the filter is applied
                  if (timeRange === 'custom' && startDate && endDate) {
                    // Re-apply filter just in case
                    handleTimeFilterChange({ startDate, endDate });
                  }
                }
              }}
  onMouseEnter={() => {
    // Expand the filter but don't affect the stored state values
    setFilterMinimized(false);
    isHovering.current = true;
    // Clear any active minimization timeouts
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }}
  onMouseLeave={(e) => {
    isHovering.current = false;
    // Only minimize if mouse is truly outside the filter area
    const related = e.relatedTarget;
    if (!related || !related.closest('.filter-area')) {
      // Only minimize if:
      // 1. We've scrolled down the page AND
      // 2. We're not in custom mode with incomplete dates
      // 3. We're not actively interacting with date inputs
      const isCustomWithIncompleteSelection = timeRange === 'custom' && (!startDate || !endDate);
      
      if (scrolled && !isCustomWithIncompleteSelection && !dateInputFocused) {
        // Use a longer delay to prevent accidental minimization
        timeoutRef.current = setTimeout(() => {
          // Just minimize visually - state stays intact
          setFilterMinimized(true);
        }, 500);
      }
    }
  }}
            >
                  {filterMinimized ? (
      <span
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: 32,
          height: 32,
          borderRadius: "50%",
           background: "#e3f2fd", 
          boxShadow: "0 2px 8px rgba(25,118,210,0.10)",
          cursor: "pointer",
           position: "relative", // Add this
    zIndex: 99,
        }}
         onClick={(e) => {
   e.stopPropagation();
   // Simply expand the filter - all state values remain intact
   setFilterMinimized(false);
  }}
  
      >
       {/* <Filter size={18} color="#fff" /> */}
     <svg width="22" height="22" viewBox="0 0 24 24" fill="#1976d2" xmlns="http://www.w3.org/2000/svg">
      <path d="M3 4a1 1 0 0 1 1-1h16a1 1 0 0 1 .8 1.6l-6.6 8.8V19a1 1 0 0 1-1.447.894l-3-1.5A1 1 0 0 1 9 17v-4.6L2.2 5.6A1 1 0 0 1 3 4Z" />
    </svg>
      </span>
    ) : (
      <TimeFilter 
        onChange={handleTimeFilterChange}
        onDateInputFocusChange={setDateInputFocused}
        timeRange={timeRange}
        setTimeRange={setTimeRange}
        startDate={startDate}
        setStartDate={setStartDate}
        endDate={endDate}
        setEndDate={setEndDate}
        className="filter-area"
        key="time-filter" // Adding a stable key helps React's reconciliation
      />
    )}
              {/* Ticket Export for Admin/Superadmin */}
              {/* <AdminTicketExport departments={departments} userRole={userRole} /> */}
            </div>
          </div>
          
          {/* No padding spacer needed with detached floating filter */}

          <div
            style={{
              marginBottom: 36,
              background: "#fff",
              padding: "24px 20px",
              borderRadius: 20,
              boxShadow: "0 4px 20px rgba(0,0,0,0.06)",
              boxSizing: "border-box",
              width: "100%",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "28px",
                rowGap: "12px",
                columnGap: "8px",
                borderBottom: "1px solid #eee",
                paddingBottom: "16px",
                flexWrap: "wrap",
              }}
            >
              <h2
                style={{
                  margin: 0,
                  color: "#263238",
                  fontWeight: 600,
                  fontSize: "1.8rem",
                }}
              >
                Dashboard Overview
              </h2>
              <div style={{ display: "flex", gap: "8px" }}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    background: "linear-gradient(to right, #f5f9ff, #e8f1fd)",
                    padding: "10px 18px",
                    borderRadius: "12px",
                    border: "1px solid rgba(25, 118, 210, 0.12)",
                    boxShadow: "0 2px 12px rgba(0,0,0,0.03)",
                    transition: "all 0.2s ease",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.boxShadow =
                      "0 4px 16px rgba(25, 118, 210, 0.12)";
                    e.currentTarget.style.transform = "translateY(-2px)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.boxShadow =
                      "0 2px 12px rgba(0,0,0,0.03)";
                    e.currentTarget.style.transform = "translateY(0)";
                  }}
                >
                  <span
                    style={{
                      fontWeight: 600,
                      color: "#455a64",
                      fontSize: "0.95rem",
                      marginRight: "10px",
                      letterSpacing: "0.3px",
                    }}
                  >
                    Total Tickets:
                  </span>
                  <div
                    style={{
                      fontWeight: 700,
                      color: "#1976d2",
                      fontSize: "1.2rem",
                      background: "#fff",
                      borderRadius: "8px",
                      padding: "2px 12px",
                      boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
                      minWidth: "32px",
                      textAlign: "center",
                      letterSpacing: "0.5px",
                    }}
                  >
                    {loading ? "..." : totalTickets}
                  </div>
                </div>
              </div>
            </div>

            {loading ? (
              <LoadingSpinner />
            ) : error ? (
              <ErrorAlert message={error} />
            ) : (
              <div className="ticket-summary-cards">
                <TicketSummaryCards
                  inProgress={summary?.inProgress || 0}
                  resolved={summary?.resolved || 0}
                  closed={summary?.closed || 0}
                  slaBreached={summary?.slaBreached || 0}
                onCardClick={(status) => {
                  // Map dashboard status to ticket page filter
                  let statusFilter = "";
                  switch (status) {
                    case "In Progress":
                      statusFilter = "In Progress";
                      break;
                    case "Resolved":
                      statusFilter = "Resolved";
                      break;
                    case "Closed":
                      statusFilter = "Closed";
                      break;
                    case "SLA Breached":
                      statusFilter = "SLA Breached";
                      break;
                    default:
                      statusFilter = status;
                  }
                  // Save filter to localStorage for adminTicket page to pick up
                  const filters = JSON.parse(localStorage.getItem("adminTicketFilters") || "{}") || {};
                  filters.statusFilter = statusFilter;
                  // Special handling for SLA Breached: set activeFilters.slaBreached = true
                  if (statusFilter === "SLA Breached") {
                    filters.activeFilters = filters.activeFilters || {};
                    filters.activeFilters.slaBreached = true;
                  } else if (filters.activeFilters && filters.activeFilters.slaBreached) {
                    // Remove slaBreached filter if not needed
                    delete filters.activeFilters.slaBreached;
                  }
                  localStorage.setItem("adminTicketFilters", JSON.stringify(filters));
                  // Add hash to trigger SLA Breached button if needed
                  if (statusFilter === "SLA Breached") {
                    window.location.href = "/adminticket#autoslaclick";
                  } else {
                    window.location.href = "/adminticket";
                  }
                }}
              />
              </div>
            )}
          </div>

          <div
            style={{
              marginBottom: 36,
              width: "100%",
              boxSizing: "border-box",
            }}
          >
            {trendLoading ? (
              <LoadingSpinner />
            ) : trendError ? (
              <ErrorAlert message={trendError} />
            ) : (
              <div className="ticket-trend-chart">
                <TicketTrendChart data={trend} timeFilter={timeFilter} />
              </div>
            )}
          </div>

          <div
            style={{
              marginBottom: "36px",
              width: "100%",
              boxSizing: "border-box",
            }}
          >
            <div
              style={{
                background: "#fff",
                borderRadius: 20,
                padding: "24px 20px",
                boxShadow: "0 4px 20px rgba(0,0,0,0.06)",
                boxSizing: "border-box",
              }}
            >
              <h3
                style={{
                  margin: "0 0 24px 0",
                  color: "#263238",
                  fontWeight: 600,
                  fontSize: "1.2rem",
                  borderBottom: "1px solid #eee",
                  paddingBottom: "12px",
                }}
              >
                Ticket Analysis
              </h3>
              <div
                style={{
                  display: "flex",
                  flexDirection: "row", // Force horizontal layout
                  flexWrap: "wrap",
                  gap: "24px",
                  justifyContent: "space-evenly",
                  alignItems: "flex-start",
                  boxSizing: "border-box",
                }}
              >
                {/* Reduce the size of each chart component */}
                <div
                  style={{
                    width: "calc(50% - 12px)",
                    minWidth: "300px",
                    maxWidth: "450px",
                    flex: "1 1 0",
                  }}
                >
                  <div className="tickets-by-source">
                    <TicketsBySourcePie
                      data={sourceData}
                      loading={sourceLoading}
                      error={sourceError}
                    />
                  </div>
                </div>

                <div
                  style={{
                    width: "calc(50% - 12px)",
                    minWidth: "300px",
                    maxWidth: "450px",
                    flex: "1 1 0",
                  }}
                >
                  {statusLoading ? (
                    <LoadingSpinner />
                  ) : statusError ? (
                    <ErrorAlert message={statusError} />
                  ) : (
                    <div className="tickets-by-status">
                      <TicketsByStatusPie data={statusData} />
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminMainLayout>
  );
};

export default AdminDashboard;