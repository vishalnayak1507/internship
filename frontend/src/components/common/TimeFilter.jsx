import React, { useState, useEffect,useRef,useCallback } from "react";
import { FaCalendarAlt, FaFilter, FaArrowRight } from "react-icons/fa";

const TimeFilter = ({ onChange, className = "",onDateInputFocusChange , timeRange,
  setTimeRange,
  startDate,
  setStartDate,
  endDate,
  setEndDate,}) => {
  // const [timeRange, setTimeRange] = useState("all");
  // const [startDate, setStartDate] = useState("");
  // const [endDate, setEndDate] = useState("");
  const [dateInputFocused, setDateInputFocused] = useState(false);

  const blurTimeoutRef = useRef();
  // ADD at the top with other imports:
// Add this at the top of your TimeFilter component, right after your state definitions



// 1. REPLACE both handleFocus and handleBlur with consistent implementations:

const handleFocus = useCallback((e) => {
  e.stopPropagation(); // Prevent event bubbling
  
  // Always clear any pending blur timeouts
  if (blurTimeoutRef.current) {
    clearTimeout(blurTimeoutRef.current);
    blurTimeoutRef.current = null;
  }
  
  // Style the input
  e.target.style.borderColor = "#1976d2";
  e.target.style.boxShadow = "0 0 0 3px rgba(25, 118, 210, 0.1)";
  
  // Set focus state
  setDateInputFocused(true);
  onDateInputFocusChange && onDateInputFocusChange(true);
}, [onDateInputFocusChange]);

const handleBlur = useCallback((e) => {
  // Style the input
  e.target.style.borderColor = "rgba(207, 216, 220, 0.6)";
  e.target.style.boxShadow = "0 1px 3px rgba(0,0,0,0.04)";
  
  // Don't set blur timeout here - we'll let parent components control this
  // to avoid conflicting behaviors with the filter minimization
}, []);

  // Apply date filter when dates change and custom is selected
  useEffect(() => {
    if (timeRange === "custom" && startDate && endDate) {
      // Allow if endDate is after or equal to startDate (inclusive)
      if (new Date(endDate) >= new Date(startDate)) {
        // Apply the filter but keep the filter expanded until user mouse leaves
        onChange({ startDate, endDate });
        
        // Keep the filter focused when both dates are selected
        setDateInputFocused(true);
        onDateInputFocusChange && onDateInputFocusChange(true);
      }
    }
  }, [startDate, endDate, timeRange, onChange, onDateInputFocusChange]);

  const handleFilterChange = (value) => {
    setTimeRange(value);
    if (value === "custom") {
      setDateInputFocused(true);
      onDateInputFocusChange && onDateInputFocusChange(true);
      if (blurTimeoutRef.current) {
        clearTimeout(blurTimeoutRef.current);
        blurTimeoutRef.current = null;
      }
      if (startDate && endDate && new Date(endDate) >= new Date(startDate)) {
        onChange({ startDate, endDate });
      }
      return;
    }
    let dateRange = {};
    const now = new Date();
    const localYear = now.getFullYear();
    const localMonth = String(now.getMonth() + 1).padStart(2, '0');
    const localDay = String(now.getDate()).padStart(2, '0');
    const todayLocal = `${localYear}-${localMonth}-${localDay}`;
    switch (value) {
      case "today": {
        console.log('[TimeFilter] Calculating TODAY:', todayLocal, '| now:', now.toString());
        dateRange = {
          startDate: todayLocal,
          endDate: todayLocal,
        };
        break;
      }
      case "week": {
        const dayOfWeek = now.getDay();
        const diffToMonday = (dayOfWeek === 0 ? -6 : 1) - dayOfWeek;
        const weekStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() + diffToMonday);
        const weekStartYear = weekStart.getFullYear();
        const weekStartMonth = String(weekStart.getMonth() + 1).padStart(2, '0');
        const weekStartDay = String(weekStart.getDate()).padStart(2, '0');
        const weekStartLocal = `${weekStartYear}-${weekStartMonth}-${weekStartDay}`;
        console.log('[TimeFilter] Calculating WEEK:', weekStartLocal, 'to', todayLocal, '| now:', now.toString());
        dateRange = {
          startDate: weekStartLocal,
          endDate: todayLocal,
        };
        break;
      }
      case "month": {
        const monthStartLocal = `${localYear}-${localMonth}-01`;
        console.log('[TimeFilter] Calculating MONTH:', monthStartLocal, 'to', todayLocal, '| now:', now.toString());
        dateRange = {
          startDate: monthStartLocal,
          endDate: todayLocal,
        };
        break;
      }
      default: {
        dateRange = { period: "all" };
      }
    }
    console.log('[TimeFilter] handleFilterChange value:', value, '| dateRange:', dateRange);
    onChange(dateRange);
  };

  // Format date to display in a nice format
  const formatDate = (dateStr) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    // Format as dd/mm/yyyy
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  // Format date as 1st July, 2025
  const formatDateText = (dateStr) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    const day = date.getDate();
    const month = date.toLocaleString("default", { month: "long" });
    const year = date.getFullYear();
    // Get ordinal suffix
    const getOrdinal = (n) => {
      if (n > 3 && n < 21) return "th";
      switch (n % 10) {
        case 1:
          return "st";
        case 2:
          return "nd";
        case 3:
          return "rd";
        default:
          return "th";
      }
    };
    return `${day}${getOrdinal(day)} ${month}, ${year}`;
  };

  // For displaying month in text (e.g. July 2025)
  const formatMonthYear = (dateStr) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-GB", { month: "long", year: "numeric" });
  };
//   useEffect(() => {
//   // When timeRange is custom, ensure it stays focused
//   if (timeRange === "custom") {
//     setDateInputFocused(true);
//     onDateInputFocusChange && onDateInputFocusChange(true);
    
//     // Clear any pending blur timeouts
//     if (blurTimeoutRef.current) {
//       clearTimeout(blurTimeoutRef.current);
//     }
//   }
// }, [timeRange, onDateInputFocusChange]);

  // Keep the filter focused while in custom mode and until both dates are selected
  useEffect(() => {
    if (timeRange === "custom") {
      // Keep the filter expanded/focused in custom mode
      setDateInputFocused(true);
      onDateInputFocusChange && onDateInputFocusChange(true);
      
      // Clear any pending blur timeouts
      if (blurTimeoutRef.current) {
        clearTimeout(blurTimeoutRef.current);
        blurTimeoutRef.current = null;
      }
    }
    // Only allow minimization if not in custom mode or if both dates are selected
    else if (timeRange !== "custom") {
      // For non-custom modes, don't force focus
      setDateInputFocused(false);
      onDateInputFocusChange && onDateInputFocusChange(false);
    }
  }, [timeRange, onDateInputFocusChange]);

  // Cleanup effect to clear timeouts when component unmounts
  useEffect(() => {
    return () => {
      // Clear any pending blur timeouts to prevent memory leaks
      if (blurTimeoutRef.current) {
        clearTimeout(blurTimeoutRef.current);
        blurTimeoutRef.current = null;
      }
    };
  }, []);

  return (
    <div className={`filter-area ${className}`} style={{ maxWidth: "100%", width: "fit-content" }}>
      <div
        style={{
          display: "flex",
          //flexWrap: "wrap",
          alignItems: "center",
          gap: "12px",
          padding: "14px 18px",
          borderRadius: "14px",
          background: "#fff",
          boxShadow: "0 4px 15px rgba(0,0,0,0.05)",
          border: "1px solid rgba(230,230,230,0.7)",
          transition: "all 0.2s ease",
           width: "fit-content",           // <-- Add this line
          maxWidth: "100%",               // <-- Add this line
          flexWrap: "nowrap",   
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            background:
              "linear-gradient(to right, rgba(25,118,210,0.05), transparent)",
            padding: "4px 10px 4px 8px",
            borderRadius: "8px",
          }}
        >
          <FaFilter
            style={{
              color: "#1976d2",
              marginRight: "8px",
              fontSize: "13px",
            }}
          />
          <span
            style={{
              color: "#37474f",
              fontWeight: 600,
              fontSize: "0.85rem",
              whiteSpace: "nowrap",
              letterSpacing: "0.3px",
            }}
          >
            Time Range
          </span>
        </div>

        <div
          style={{
            display: "flex",
            backgroundColor: "#f5f9ff",
            borderRadius: "10px",
            overflow: "visible", // Allow dropdowns to escape
            boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
            position: "relative",
            zIndex: 40,
          }}
        >
          {[
            { id: "today", label: "Today" },
            { id: "week", label: "This Week" },
            { id: "month", label: "This Month" },
            { id: "all", label: "All Time" },
            { id: "custom", label: "Custom Range" },
          ].map((option) => (
            <button
              key={option.id}
              onClick={() => handleFilterChange(option.id)}
              style={{
                padding: "7px 14px",
                fontSize: "0.82rem",
                backgroundColor:
                  timeRange === option.id
                    ? "linear-gradient(135deg, #1976d2, #1565c0)"
                    : "transparent",
                background:
                  timeRange === option.id
                    ? "linear-gradient(135deg, #1976d2, #1565c0)"
                    : "transparent",
                color: timeRange === option.id ? "#fff" : "#455a64",
                border: "none",
                fontWeight: timeRange === option.id ? 600 : 500,
                cursor: "pointer",
                transition: "all 0.2s ease",
                borderRight:
                  option.id !== "custom"
                    ? "1px solid rgba(207, 216, 220, 0.5)"
                    : "none",
                position: "relative",
                letterSpacing: "0.2px",
              }}
              onMouseEnter={(e) => {
                if (timeRange !== option.id) {
                  e.currentTarget.style.backgroundColor = "#e3f2fd";
                }
              }}
              onMouseLeave={(e) => {
                if (timeRange !== option.id) {
                  e.currentTarget.style.backgroundColor = "transparent";
                }
              }}
            >
              {option.label}
              {timeRange === option.id && (
                <div
                  style={{
                    position: "absolute",
                    bottom: "0px",
                    left: "50%",
                    transform: "translateX(-50%)",
                    width: "20px",
                    height: "2px",
                    backgroundColor: "#fff",
                    borderRadius: "2px",
                  }}
                ></div>
              )}
            </button>
          ))}
        </div>

        {timeRange === "custom" && (
          <div     className="filter-area" 
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              marginLeft: "6px",
              background:
                "linear-gradient(to right, rgba(25,118,210,0.04), rgba(25,118,210,0.01))",
              padding: "8px 14px",
              borderRadius: "12px",
              boxShadow: "0 2px 6px rgba(0,0,0,0.03)",
              border: "1px solid rgba(25,118,210,0.08)",
            }}
          >
            <div
              style={{
                position: "relative",
                display: "flex",
                flexDirection: "column",
                gap: "4px",
                width: "160px",
              }}
            >
              <label
                style={{
                  fontSize: "0.7rem",
                  color: "#455a64",
                  fontWeight: 600,
                  letterSpacing: "0.5px",
                  marginLeft: "2px",
                }}
              >
                FROM
              </label>
              <div style={{ position: "relative" }}>
                <FaCalendarAlt
                  style={{
                    position: "absolute",
                    left: "8px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    color: "#1976d2",
                    fontSize: "13px",
                  }}
                />
                <input
                  type="date"
                  value={startDate}
                  max={new Date().toISOString().split('T')[0]} /* Disable future dates */
                  onChange={(e) => {
                    const newStartDate = e.target.value;
                    // Always keep the filter focused when changing start date
                    setDateInputFocused(true);
                    onDateInputFocusChange && onDateInputFocusChange(true);
                    
                    // Clear any existing timeout
                    if (blurTimeoutRef.current) {
                      clearTimeout(blurTimeoutRef.current);
                      blurTimeoutRef.current = null;
                    }
                    
                    // Reset endDate if it's before the new start date
                    if (endDate && new Date(endDate) < new Date(newStartDate)) {
                      setEndDate('');
                    }
                    setStartDate(newStartDate);
                  }}
                  
                  style={{
                    width: "100%",
                    paddingLeft: "28px",
                    paddingRight: "8px",
                    padding: "8px 8px 8px 30px",
                    border: "1px solid rgba(207, 216, 220, 0.6)",
                    borderRadius: "8px",
                    fontSize: "0.82rem",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
                    color: "#37474f",
                    fontWeight: 500,
                    background: "#fff",
                    transition: "all 0.2s ease",
                  }}
                 onFocus={handleFocus}
onBlur={handleBlur}
onClick={(e) => {
  e.stopPropagation(); // Prevent event bubbling
  if (blurTimeoutRef.current) clearTimeout(blurTimeoutRef.current);
  setDateInputFocused(true);
  onDateInputFocusChange && onDateInputFocusChange(true);
}} />

                
                {startDate && (
                  <div
                    style={{
                      position: "absolute",
                      top: "-10px",
                      right: "8px",
                      background: "#fff",
                      padding: "0 4px",
                      fontSize: "0.65rem",
                      color: "#1976d2",
                      fontWeight: 500,
                    }}
                  >
                    {formatDateText(startDate)}
                  </div>
                )}
              </div>
            </div>

            <FaArrowRight
              style={{
                color: "#90a4ae",
                fontSize: "12px",
                margin: "0 -5px",
                marginTop: "12px",
              }}
            />

            <div
              style={{
                position: "relative",
                display: "flex",
                flexDirection: "column",
                gap: "4px",
                width: "160px",
              }}
            >
              <label
                style={{
                  fontSize: "0.7rem",
                  color: "#455a64",
                  fontWeight: 600,
                  letterSpacing: "0.5px",
                  marginLeft: "2px",
                }}
              >
                TO
              </label>
              <div style={{ position: "relative" }}>
                <FaCalendarAlt
                  style={{
                    position: "absolute",
                    left: "8px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    color: "#1976d2",
                    fontSize: "13px",
                  }}
                />
                <input
                  type="date"
                  value={endDate}
                  min={startDate || undefined}
                  max={new Date().toISOString().split('T')[0]} /* Disable future dates */
                  onChange={(e) => {
                    const newEndDate = e.target.value;
                    setEndDate(newEndDate);
                    
                    // Always keep the filter focused when changing end date
                    setDateInputFocused(true);
                    onDateInputFocusChange && onDateInputFocusChange(true);
                    
                    // Only set a blur timeout if both dates are valid AND end date is after or equal to start date
                    // This ensures filter stays open until dates are valid and filter is applied
                    if (startDate && newEndDate && new Date(newEndDate) >= new Date(startDate)) {
                      // Clear any existing timeout
                      if (blurTimeoutRef.current) {
                        clearTimeout(blurTimeoutRef.current);
                      }
                      
                      // Add a delay before allowing the filter to minimize - only after filter is applied
                      blurTimeoutRef.current = setTimeout(() => {
                        // Apply the filter first (this will trigger the onChange in the useEffect)
                        onChange({ startDate, endDate: newEndDate });
                        
                        // Then allow minimization after a delay
                        setTimeout(() => {
                          setDateInputFocused(false);
                          onDateInputFocusChange && onDateInputFocusChange(false);
                        }, 1000); // 1-second delay after filter is applied
                      }, 1000); // 1-second delay before applying filter
                    }
                  }}
                  style={{
                    width: "100%",
                    paddingLeft: "28px",
                    paddingRight: "8px",
                    padding: "8px 8px 8px 30px",
                    border: "1px solid rgba(207, 216, 220, 0.6)",
                    borderRadius: "8px",
                    fontSize: "0.82rem",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
                    color: "#37474f",
                    fontWeight: 500,
                    background: "#fff",
                    transition: "all 0.2s ease",
                  }}
                  onFocus={(e) => {
                     if (blurTimeoutRef.current) clearTimeout(blurTimeoutRef.current);
                    e.target.style.borderColor = "#1976d2";
                    e.target.style.boxShadow =
                      "0 0 0 3px rgba(25, 118, 210, 0.1)";
                      setDateInputFocused(true);
                       onDateInputFocusChange && onDateInputFocusChange(true); // <-- ADD THIS LINE
                  }}
                  onBlur={(e) => {
                    // Just style the input - don't set focus timeouts here
                    e.target.style.borderColor = "rgba(207, 216, 220, 0.6)";
                    e.target.style.boxShadow = "0 1px 3px rgba(0,0,0,0.04)";
                  }}
                  onClick={(e) => {
  // Prevent the click from bubbling up
  e.stopPropagation();
  // Keep filter focused
  if (blurTimeoutRef.current) clearTimeout(blurTimeoutRef.current);
  setDateInputFocused(true);
  onDateInputFocusChange && onDateInputFocusChange(true);
}}
                />
                {endDate && (
                  <div
                    style={{
                      position: "absolute",
                      top: "-10px",
                      right: "8px",
                      background: "#fff",
                      padding: "0 4px",
                      fontSize: "0.65rem",
                      color: "#1976d2",
                      fontWeight: 500,
                    }}
                  >
                    {formatDateText(endDate)}
                  </div>
                )}
              </div>
            </div>

            {/* Removed 'Select both dates' warning as requested */}
          </div>
        )}
      </div>
      {/* Removed month/year display for 'This Month' as requested */}
    </div>
  );
};

export default TimeFilter;