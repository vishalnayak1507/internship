import React from "react";

const statusOptions = [
  { label: "All", value: "all" },
  { label: "Open", value: "Open" },
  { label: "InProgress", value: "InProgress" },
  { label: "Closed", value: "Closed" },
  { label: "Resolved", value: "Resolved" },
];

const slaOptions = [
  { label: "All", value: "all" },
  { label: "Breached", value: "true" },
  { label: "Not Breached", value: "false" },
];

const ExportTicketFilters = ({ 
  selectedStatuses, 
  setSelectedStatuses,
  selectedSla, 
  setSelectedSla,
  startDate, 
  setStartDate,
  endDate, 
  setEndDate,
  hasActiveFilters,
  handleClearFilters,
  // New props for department filtering
  userRole,
  departments = [],
  selectedDepartments = [],
  setSelectedDepartments
}) => {

  // Status multi-select logic
  const handleStatusChange = (value) => {
    if (value === "all") {
      setSelectedStatuses(["all"]);
    } else {
      let updated;
      if (selectedStatuses.includes(value)) {
        updated = selectedStatuses.filter((v) => v !== value);
        if (updated.length === 0) updated = ["all"];
      } else {
        updated = selectedStatuses.filter((v) => v !== "all");
        updated.push(value);
      }
      setSelectedStatuses(updated);
    }
  };

  // SLA selection logic
  const handleSlaChange = (value) => {
    setSelectedSla(value);
  };

  // Department multi-select logic
  const handleDepartmentChange = (value) => {
    if (value === "all") {
      setSelectedDepartments(["all"]);
    } else {
      let updated;
      if (selectedDepartments.includes(value)) {
        updated = selectedDepartments.filter((v) => v !== value);
        if (updated.length === 0) updated = ["all"];
      } else {
        updated = selectedDepartments.filter((v) => v !== "all");
        updated.push(value);
      }
      setSelectedDepartments(updated);
    }
  };

  // Sort departments alphabetically
  const sortedDepartments = [...departments].sort((a, b) => 
    a.toLowerCase().localeCompare(b.toLowerCase())
  );

  return (
    <div style={{
      width: "100%",
      background: "#f4f8fb",
      borderRadius: 12,
      padding: "24px 24px 18px 24px",
      marginBottom: 32,
      boxShadow: "0 2px 8px rgba(25,118,210,0.05)"
    }}>
      <div style={{ 
        display: "flex", 
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: "16px"
      }}>
        <h3 style={{ margin: 0, color: "#37474f", fontSize: "1.1rem" }}>Filter Options</h3>
        {hasActiveFilters && (
          <button 
            onClick={handleClearFilters}
            style={{
              background: "transparent",
              border: "none",
              color: "#1976d2",
              fontSize: "0.85rem",
              cursor: "pointer",
              textDecoration: "underline"
            }}
          >
            Clear all filters
          </button>
        )}
      </div>

      {/* Department Filter - Only visible for superadmin */}
      {userRole === "superadmin" && (
        <>
          <label style={{ fontWeight: 600, marginBottom: 6, display: "block" }}>Department:</label>
          <div style={{ 
            display: "flex", 
            flexWrap: "wrap", 
            gap: "10px", 
            marginBottom: 18,
            maxHeight: "200px",
            overflowY: departments.length > 10 ? "auto" : "visible",
            padding: departments.length > 10 ? "2px" : "0"
          }}>
            <button
              key="all-departments"
              type="button"
              style={{
                padding: "6px 18px",
                borderRadius: 8,
                border: selectedDepartments.includes("all")
                  ? "2px solid #1976d2"
                  : "1px solid #b0bec5",
                background: selectedDepartments.includes("all")
                  ? "#1976d2"
                  : "#fff",
                color: selectedDepartments.includes("all")
                  ? "#fff"
                  : "#263238",
                fontWeight: 500,
                cursor: "pointer",
                transition: "all 0.18s"
              }}
              onClick={() => handleDepartmentChange("all")}
            >
              All Departments
            </button>
            {sortedDepartments.map((dept) => (
              <button
                key={dept}
                type="button"
                style={{
                  padding: "6px 18px",
                  borderRadius: 8,
                  border: selectedDepartments.includes(dept)
                    ? "2px solid #1976d2"
                    : "1px solid #b0bec5",
                  background: selectedDepartments.includes(dept)
                    ? "#1976d2"
                    : "#fff",
                  color: selectedDepartments.includes(dept)
                    ? "#fff"
                    : "#263238",
                  fontWeight: 500,
                  cursor: "pointer",
                  transition: "all 0.18s"
                }}
                onClick={() => handleDepartmentChange(dept)}
              >
                {dept}
              </button>
            ))}
          </div>
        </>
      )}
      
      {/* Status Filter Section */}
      <label style={{ fontWeight: 600, marginBottom: 6, display: "block" }}>Status:</label>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "10px", marginBottom: 18 }}>
        {statusOptions.map((opt) => (
          <button
            key={opt.value}
            type="button"
            style={{
              padding: "6px 18px",
              borderRadius: 8,
              border: selectedStatuses.includes(opt.value)
                ? "2px solid #1976d2"
                : "1px solid #b0bec5",
              background: selectedStatuses.includes(opt.value)
                ? "#1976d2"
                : "#fff",
              color: selectedStatuses.includes(opt.value)
                ? "#fff"
                : "#263238",
              fontWeight: 500,
              cursor: "pointer",
              transition: "all 0.18s"
            }}
            onClick={() => handleStatusChange(opt.value)}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* SLA Breached Filter Section */}
      <label style={{ fontWeight: 600, marginBottom: 6, display: "block" }}>SLA Breached:</label>
      <div style={{ marginBottom: 18 }}>
        <select
          value={selectedSla}
          onChange={(e) => handleSlaChange(e.target.value)}
          style={{
            width: "100%",
            maxWidth: "200px",
            border: "1px solid #b0bec5",
            borderRadius: 6,
            padding: "8px 10px",
            fontSize: "0.95rem",
            backgroundColor: "#fff"
          }}
        >
          {slaOptions.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>
      
      {/* Date Range Filter Section */}
      <label style={{ fontWeight: 600, marginBottom: 6, display: "block" }}>Date Range:</label>
      <div style={{ 
        display: "flex", 
        gap: 8,
        flexWrap: "wrap",
      }}>
        <div style={{ flex: 1, minWidth: "140px" }}>
          <label style={{ fontSize: "0.8rem", color: "#607d8b", display: "block", marginBottom: "4px" }}>
            Start Date
          </label>
          <div className="custom-datepicker-container">
            <input
              type="date"
              value={startDate}
              onChange={e => setStartDate(e.target.value)}
              style={{
                width: "100%",
                border: "1px solid #b0bec5",
                borderRadius: 6,
                padding: "8px 10px",
                boxSizing: "border-box",
                color: "#37474f",
                background: "white",
                fontSize: "0.95rem",
                boxShadow: "0 1px 3px rgba(0,0,0,0.05) inset"
              }}
            />
            <div className="calendar-icon">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <rect x="3" y="6" width="18" height="15" rx="2" stroke="#607d8b" strokeWidth="2"/>
                <path d="M3 10H21" stroke="#607d8b" strokeWidth="2"/>
                <path d="M8 3V7" stroke="#607d8b" strokeWidth="2" strokeLinecap="round"/>
                <path d="M16 3V7" stroke="#607d8b" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </div>
          </div>
        </div>
        <div style={{ flex: 1, minWidth: "140px" }}>
          <label style={{ fontSize: "0.8rem", color: "#607d8b", display: "block", marginBottom: "4px" }}>
            End Date
          </label>
          <div className="custom-datepicker-container">
            <input
              type="date"
              value={endDate}
              onChange={e => setEndDate(e.target.value)}
              style={{
                width: "100%",
                border: "1px solid #b0bec5",
                borderRadius: 6,
                padding: "8px 10px",
                boxSizing: "border-box",
                color: "#37474f",
                background: "white",
                fontSize: "0.95rem",
                boxShadow: "0 1px 3px rgba(0,0,0,0.05) inset"
              }}
            />
            <div className="calendar-icon">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <rect x="3" y="6" width="18" height="15" rx="2" stroke="#607d8b" strokeWidth="2"/>
                <path d="M3 10H21" stroke="#607d8b" strokeWidth="2"/>
                <path d="M8 3V7" stroke="#607d8b" strokeWidth="2" strokeLinecap="round"/>
                <path d="M16 3V7" stroke="#607d8b" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </div>
          </div>
        </div>
      </div>
      
      {/* Active Filters Summary */}
      {hasActiveFilters && (
        <div style={{ 
          marginTop: "18px", 
          padding: "10px 14px", 
          background: "rgba(25, 118, 210, 0.08)",
          borderRadius: "8px",
          fontSize: "0.9rem"
        }}>
          <div style={{ fontWeight: 500, marginBottom: "6px", color: "#455a64" }}>
            Active filters:
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
            {/* Department badges - only for superadmin */}
            {userRole === "superadmin" && !selectedDepartments.includes("all") && selectedDepartments.map(dept => (
              <span key={dept} style={{
                background: "#e1f5fe",
                color: "#0277bd",
                padding: "3px 8px",
                borderRadius: "4px",
                fontSize: "0.8rem",
                fontWeight: 500
              }}>
                Dept: {dept}
              </span>
            ))}
            
            {/* Status badges */}
            {!selectedStatuses.includes("all") && selectedStatuses.map(status => (
              <span key={status} style={{
                background: "#e3f2fd",
                color: "#1565c0",
                padding: "3px 8px",
                borderRadius: "4px",
                fontSize: "0.8rem",
                fontWeight: 500
              }}>
                Status: {status}
              </span>
            ))}
            
            {/* SLA badge */}
            {selectedSla !== "all" && (
              <span style={{
                background: "#e8eaf6",
                color: "#3949ab",
                padding: "3px 8px",
                borderRadius: "4px",
                fontSize: "0.8rem",
                fontWeight: 500
              }}>
                SLA: {selectedSla === "true" ? "Breached" : "Not Breached"}
              </span>
            )}
            
            {/* Date badges */}
            {startDate && (
              <span style={{
                background: "#e8f5e9",
                color: "#2e7d32",
                padding: "3px 8px",
                borderRadius: "4px",
                fontSize: "0.8rem",
                fontWeight: 500
              }}>
                From: {new Date(startDate).toLocaleDateString()}
              </span>
            )}
            {endDate && (
              <span style={{
                background: "#e8f5e9",
                color: "#2e7d32",
                padding: "3px 8px",
                borderRadius: "4px",
                fontSize: "0.8rem",
                fontWeight: 500
              }}>
                To: {new Date(endDate).toLocaleDateString()}
              </span>
            )}
          </div>
        </div>
      )}

      {/* CSS for date picker */}
      <style>{`
        .custom-datepicker-container {
          position: relative;
        }
        
        .calendar-icon {
          position: absolute;
          right: 10px;
          top: 50%;
          transform: translateY(-50%);
          pointer-events: none;
        }
        
        input[type="date"]::-webkit-calendar-picker-indicator {
          opacity: 0;
          width: 100%;
          height: 100%;
          position: absolute;
          top: 0;
          left: 0;
          cursor: pointer;
        }
        
        input[type="date"]:focus {
          border-color: #1976d2;
          box-shadow: 0 0 0 1px rgba(25, 118, 210, 0.2);
          outline: none;
        }
      `}</style>
    </div>
  );
};

export default ExportTicketFilters;