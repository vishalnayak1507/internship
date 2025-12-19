import React, { useState, useEffect } from "react";

// Simple modal component for demonstration
const Modal = ({ open, onClose, children }) => {
  if (!open) return null;
  
  return (
    <div style={{
      position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh",
      background: "rgba(0,0,0,0.25)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center"
    }}>
      <div style={{
        background: "#fff", borderRadius: 12, padding: 32, minWidth: 320, maxWidth: 400, boxShadow: "0 8px 32px rgba(25,118,210,0.10)"
      }}>
        {children}
        <div style={{ marginTop: 24, textAlign: "right" }}>
          <button onClick={onClose} style={{
            background: "#e0e0e0", border: "none", borderRadius: 6, padding: "6px 18px", cursor: "pointer"
          }}>Close</button>
        </div>
      </div>
    </div>
  );
};

const EXCEL_ROW_LIMIT = 10000; // Change this value as needed

const AdminTicketExport = ({
  departments = [],
  userRole = "",
  filters = {},
  selectedDepartment = "",
}) => {
  const [isExporting, setIsExporting] = useState(false);
  const [exportFormat, setExportFormat] = useState("xlsx");
  const [showLimitModal, setShowLimitModal] = useState(false);
  const [ticketCount, setTicketCount] = useState(0);
  


  // Fetch ticket count for export (calls backend with countOnly=true)
  const fetchTicketCount = async () => {
    const params = new URLSearchParams();
    if (filters.status && filters.status.length > 0) {
      const normalizedStatuses = filters.status.map(status => {
        if (status.toLowerCase() === "inprogress" || status.toLowerCase() === "in progress") {
          return "InProgress";
        }
        return status;
      });
      params.append("status", normalizedStatuses.join(","));
    }
    if (filters.slaBreached && filters.slaBreached !== "all" && filters.slaBreached !== null) {
      params.append("slaBreached", filters.slaBreached);
    }
    if (filters.startDate) params.append("startDate", filters.startDate);
    if (filters.endDate) params.append("endDate", filters.endDate);
    if (userRole === "superadmin" && filters.departments && filters.departments.length > 0) {
      params.append("departments", filters.departments.join(","));
    } else if (userRole === "superadmin" && selectedDepartment && selectedDepartment !== "all") {
      params.append("department", selectedDepartment);
    }
    params.append("countOnly", "true");
    try {
      const res = await fetch(`http://localhost:8000/api/admin/tickets/export?${params.toString()}`);
      const data = await res.json();
      return data.count || 0;
    } catch (error) {
      console.error("Error fetching ticket count:", error);
      return 0;
    }
  };

  const handleExport = async () => {
    setIsExporting(true);

    try {
      // 1. Get ticket count for current filters
      const count = await fetchTicketCount();
      setTicketCount(count);

      if (exportFormat === "xlsx" && count > EXCEL_ROW_LIMIT) {
        // Force a small delay to ensure state updates before continuing
        await new Promise(resolve => setTimeout(resolve, 100));
        setShowLimitModal(true);
        setIsExporting(false);
        return;
      }

      // 2. Proceed with export as usual
      triggerExport(exportFormat);
    } catch (error) {
      console.error("Error in export process:", error);
      setIsExporting(false);
    }
  };

  const triggerExport = (format) => {
    const params = new URLSearchParams();
    params.append("format", format);

    if (filters.status && filters.status.length > 0) {
      const normalizedStatuses = filters.status.map(status => {
        if (status.toLowerCase() === "inprogress" || status.toLowerCase() === "in progress") {
          return "InProgress";
        }
        return status;
      });
      params.append("status", normalizedStatuses.join(","));
    }
    if (filters.slaBreached && filters.slaBreached !== "all" && filters.slaBreached !== null) {
      params.append("slaBreached", filters.slaBreached);
    }
    if (filters.startDate) params.append("startDate", filters.startDate);
    if (filters.endDate) params.append("endDate", filters.endDate);
    if (userRole === "superadmin" && filters.departments && filters.departments.length > 0) {
      params.append("departments", filters.departments.join(","));
    } else if (userRole === "superadmin" && selectedDepartment && selectedDepartment !== "all") {
      params.append("department", selectedDepartment);
    }

    const url = `http://localhost:8000/api/admin/tickets/export?${params.toString()}`;
    window.location.href = url;

    setTimeout(() => {
      setIsExporting(false);
    }, 2000);
  };

  const handleExcelMultiSheet = () => {
    triggerExport("xlsx");
    setShowLimitModal(false);
  };

  const handleCSVExport = () => {
    triggerExport("csv");
    setShowLimitModal(false);
  };



  return (
    <div
      style={{
        width: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-start",
        height: "100%",
      }}
    >
      <div className="export-options-container" style={{
        backgroundColor: "#f8f9fa",
        borderRadius: "12px",
        padding: "24px",
        boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
        width: "100%",
        marginBottom: "28px"
      }}>
        <h3 style={{
          margin: "0 0 16px 0",
          fontSize: "1.1rem",
          color: "#455a64",
          fontWeight: 600,
        }}>Export Options</h3>
        
        <div style={{ marginBottom: "20px" }}>
          <label style={{ 
            display: "block", 
            marginBottom: "8px", 
            fontSize: "0.9rem", 
            color: "#455a64", 
            fontWeight: 500 
          }}>
            Select Format
          </label>
          <div style={{ 
            display: "flex", 
            gap: "12px",
          }}>
            <div 
              onClick={() => setExportFormat("xlsx")}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "12px 16px",
                borderRadius: "8px",
                border: "1px solid #e0e0e0",
                background: exportFormat === "xlsx" ? "#e3f2fd" : "#ffffff",
                boxShadow: exportFormat === "xlsx" ? "0 2px 4px rgba(33,150,243,0.1)" : "none",
                cursor: "pointer",
                transition: "all 0.2s",
                flex: 1,
              }}
            >
              <div style={{
                width: "28px",
                height: "28px",
                borderRadius: "6px",
                background: exportFormat === "xlsx" ? "#1976d2" : "#f5f5f5",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: exportFormat === "xlsx" ? "white" : "#757575"
              }}>
                <span style={{ fontSize: "14px", fontWeight: "bold" }}>X</span>
              </div>
              <div>
                <div style={{ fontWeight: 500, color: exportFormat === "xlsx" ? "#1976d2" : "#455a64" }}>Excel (.xlsx)</div>
                <div style={{ fontSize: "0.8rem", color: "#78909c", marginTop: "2px" }}>Formatted spreadsheet</div>
              </div>
            </div>
            
            <div 
              onClick={() => setExportFormat("csv")}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "12px 16px",
                borderRadius: "8px",
                border: "1px solid #e0e0e0",
                background: exportFormat === "csv" ? "#e3f2fd" : "#ffffff",
                boxShadow: exportFormat === "csv" ? "0 2px 4px rgba(33,150,243,0.1)" : "none",
                cursor: "pointer",
                transition: "all 0.2s",
                flex: 1,
              }}
            >
              <div style={{
                width: "28px",
                height: "28px",
                borderRadius: "6px",
                background: exportFormat === "csv" ? "#1976d2" : "#f5f5f5",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: exportFormat === "csv" ? "white" : "#757575"
              }}>
                <span style={{ fontSize: "14px", fontWeight: "bold" }}>C</span>
              </div>
              <div>
                <div style={{ fontWeight: 500, color: exportFormat === "csv" ? "#1976d2" : "#455a64" }}>CSV (.csv)</div>
                <div style={{ fontSize: "0.8rem", color: "#78909c", marginTop: "2px" }}>Plain text data</div>
              </div>
            </div>
          </div>
        </div>
      
        <div style={{ marginTop: "24px" }}>
          <button
            onClick={handleExport}
            disabled={isExporting}
            style={{
              background: isExporting 
                ? "#90caf9" 
                : "linear-gradient(90deg, #1976d2 0%, #2196f3 100%)",
              color: "#fff",
              fontWeight: 600,
              fontSize: "1rem",
              padding: "14px 36px",
              borderRadius: 8,
              border: "none",
              cursor: isExporting ? "default" : "pointer",
              boxShadow: "0 4px 12px rgba(25,118,210,0.18)",
              transition: "all 0.3s",
              display: "flex",
              alignItems: "center",
              gap: "10px",
              width: "100%",
              justifyContent: "center",
            }}
            onMouseEnter={(e) => {
              if (!isExporting) {
                e.currentTarget.style.boxShadow = "0 6px 16px rgba(25,118,210,0.25)";
                e.currentTarget.style.transform = "translateY(-2px)";
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.boxShadow = "0 4px 12px rgba(25,118,210,0.18)";
              e.currentTarget.style.transform = "translateY(0)";
            }}
          >
            <svg 
              width="20" 
              height="20" 
              viewBox="0 0 24 24" 
              fill="none" 
              xmlns="http://www.w3.org/2000/svg"
              style={{
                animation: isExporting ? "spin 1.5s linear infinite" : "none",
                transition: "transform 0.3s"
              }}
            >
              {isExporting ? (
                <path 
                  d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12" 
                  stroke="white" 
                  strokeWidth="2.5" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                />
              ) : (
                <>
                  <path 
                    d="M12 16L12 4" 
                    stroke="white" 
                    strokeWidth="2.5" 
                    strokeLinecap="round"
                  />
                  <path 
                    d="M8 12L12 16L16 12" 
                    stroke="white" 
                    strokeWidth="2.5" 
                    strokeLinecap="round" 
                    strokeLinejoin="round"
                  />
                  <path 
                    d="M20 16V18C20 19.1046 19.1046 20 18 20H6C4.89543 20 4 19.1046 4 18V16" 
                    stroke="white" 
                    strokeWidth="2.5" 
                    strokeLinecap="round" 
                    strokeLinejoin="round"
                  />
                </>
              )}
            </svg>
            {isExporting ? "Exporting..." : `Export to ${exportFormat === "xlsx" ? "Excel" : "CSV"}`}
          </button>
          
          <p style={{ 
            marginTop: 16, 
            fontSize: "0.85rem", 
            color: "#607d8b",
            textAlign: "center",
            lineHeight: "1.5"
          }}>
            {exportFormat === "xlsx" ? 
              "Download a formatted Excel spreadsheet with color-coded statuses and optimized layout." : 
              "Download a simple CSV file that can be opened with any spreadsheet program or text editor."}
          </p>
        </div>
      </div>
      
      {/* Modal for large export */}
      <Modal open={showLimitModal} onClose={() => setShowLimitModal(false)}>
        <h3 style={{ margin: 0, fontWeight: 700, fontSize: "1.2rem", color: "#1976d2" }}>
          Large Export Detected
        </h3>
        <p style={{ margin: "16px 0 0 0", color: "#263238", fontSize: "1rem" }}>
          You are exporting <b>{ticketCount.toLocaleString()}</b> tickets.<br />
          Excel has a limit of {EXCEL_ROW_LIMIT.toLocaleString()} rows per sheet.<br />
          <br />
          <b>Options:</b>
          <ul style={{ margin: "8px 0 0 18px", fontSize: "0.98rem" }}>
            <li>
              <b>Export as Excel:</b> Your data will be split into multiple sheets (max {EXCEL_ROW_LIMIT.toLocaleString()} rows per sheet).
            </li>
            <li>
              <b>Export as CSV:</b> All data in a single CSV file (recommended for very large exports).
            </li>
          </ul>
        </p>
        <div style={{ display: "flex", gap: "12px", marginTop: 16 }}>
          <button
            onClick={handleExcelMultiSheet}
            style={{
              background: "#1976d2",
              color: "#fff",
              border: "none",
              borderRadius: 6,
              padding: "8px 18px",
              fontWeight: 600,
              cursor: "pointer"
            }}
          >
            Excel (multiple sheets)
          </button>
          <button
            onClick={handleCSVExport}
            style={{
              background: "#2196f3",
              color: "#fff",
              border: "none",
              borderRadius: 6,
              padding: "8px 18px",
              fontWeight: 600,
              cursor: "pointer"
            }}
          >
            CSV (single file)
          </button>
        </div>
      </Modal>

      <style dangerouslySetInnerHTML={{
        __html: `
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          @keyframes pulse {
            0% { opacity: 0.7; }
            50% { opacity: 1; }
            100% { opacity: 0.7; }
          }
        `
      }} />
    </div>
  );
};

export default AdminTicketExport;