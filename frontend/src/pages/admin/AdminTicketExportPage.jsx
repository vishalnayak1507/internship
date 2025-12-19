import React, { useEffect, useState } from "react";
import AdminMainLayout from "../../components/admin/layoutComponents/AdminMainLayout";
import AdminTicketExport from "../../components/admin/exportTickets/AdminTicketExport";
import ExportTicketFilters from "../../components/admin/exportTickets/ExportTicketFilters";
import axios from "axios";

const AdminTicketExportPage = () => {
  const [departments, setDepartments] = useState([]);
  const [userRole, setUserRole] = useState("");
  const [loading, setLoading] = useState(true);

  // Filter state
  const [selectedStatuses, setSelectedStatuses] = useState(["all"]);
  const [selectedSla, setSelectedSla] = useState("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [selectedDepartments, setSelectedDepartments] = useState(["all"]);

  useEffect(() => {
    const fetchProfileAndDepartments = async () => {
      try {
        setLoading(true);
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
        console.error("Error fetching profile data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchProfileAndDepartments();
  }, []);

  const handleClearFilters = () => {
    setSelectedStatuses(["all"]);
    setSelectedSla("all");
    setStartDate("");
    setEndDate("");
    setSelectedDepartments(["all"]);
  };

  // Set example date range for last week
  const setLastWeek = () => {
    const today = new Date();
    const lastWeek = new Date(today);
    lastWeek.setDate(today.getDate() - 7);
    setStartDate(lastWeek.toISOString().split('T')[0]);
    setEndDate(today.toISOString().split('T')[0]);
  };

  // Set example date range for last month
  const setLastMonth = () => {
    const today = new Date();
    const lastMonth = new Date(today);
    lastMonth.setMonth(today.getMonth() - 1);
    setStartDate(lastMonth.toISOString().split('T')[0]);
    setEndDate(today.toISOString().split('T')[0]);
  };

  // Compose filters for export
  const exportFilters = {
    status: selectedStatuses.includes("all") ? [] : selectedStatuses,
    slaBreached: selectedSla === "all" ? null : selectedSla,
    startDate,
    endDate,
    departments: selectedDepartments.includes("all") ? [] : selectedDepartments,
  };

  // Check if any filters are active
  const hasActiveFilters = 
    !selectedStatuses.includes("all") || 
    selectedSla !== "all" ||
    !selectedDepartments.includes("all") ||
    startDate || 
    endDate;

  return (
    <AdminMainLayout>
      <div style={{
        width: "100%",
        margin: "20px 0",
        background: "#fff",
        borderRadius: 16,
        boxShadow: "0 8px 32px rgba(25,118,210,0.10)",
        padding: 32,
        display: "flex",
        flexDirection: "column"
      }}>
        {/* Header with gradient background */}
        <div 
          className="export-header"
          style={{
          background: "linear-gradient(135deg, #1976d2, #2196f3)",
          borderRadius: "12px",
          padding: "16px 20px",
          marginBottom: "24px",
          width: "100%",
          boxSizing: "border-box",
          boxShadow: "0 4px 12px rgba(33, 150, 243, 0.2)",
        }}>
          <h2 style={{
            fontWeight: 700,
            fontSize: "1.8rem",
            margin: 0,
            color: "white",
            letterSpacing: ".5px"
          }}>
            Export Tickets
          </h2>
          <p style={{
            color: "rgba(255,255,255,0.85)",
            margin: "8px 0 0 0",
            fontSize: "0.95rem"
          }}>
            Filter and download ticket data
          </p>
        </div>

        {loading ? (
          <div style={{ padding: "40px 0", textAlign: "center" }}>
            <div style={{ 
              border: "4px solid rgba(25, 118, 210, 0.1)",
              borderTop: "4px solid #1976d2",
              borderRadius: "50%",
              width: "30px",
              height: "30px",
              animation: "spin 2s linear infinite",
              margin: "0 auto 16px auto"
            }} />
            <p style={{ color: "#607d8b" }}>Loading filters...</p>
          </div>
        ) : (
          <>
            <div style={{ display: "flex", flexDirection: "row", gap: "30px", flexWrap: "wrap" }}>
              <div style={{ flex: "1 1 500px" }}>
                {/* Date Range Quick Selectors */}
                {(startDate === "" && endDate === "") && (
                  <div 
                    className="date-range-quick-select"
                    style={{
                    display: "flex",
                    gap: "10px",
                    marginBottom: "20px",
                  }}>
                    <span style={{ fontSize: "0.9rem", color: "#455a64", alignSelf: "center" }}>
                      Quick select:
                    </span>
                    <button
                      onClick={setLastWeek}
                      style={{
                        padding: "6px 12px",
                        borderRadius: "4px",
                        border: "1px solid #e0e0e0",
                        background: "#f5f5f5",
                        color: "#455a64",
                        fontSize: "0.85rem",
                        cursor: "pointer",
                      }}
                    >
                      Last 7 days
                    </button>
                    <button
                      onClick={setLastMonth}
                      style={{
                        padding: "6px 12px",
                        borderRadius: "4px",
                        border: "1px solid #e0e0e0",
                        background: "#f5f5f5",
                        color: "#455a64",
                        fontSize: "0.85rem",
                        cursor: "pointer",
                      }}
                    >
                      Last 30 days
                    </button>
                    <button
                      onClick={() => {
                        const today = new Date();
                        setStartDate(today.toISOString().split('T')[0]);
                        setEndDate(today.toISOString().split('T')[0]);
                      }}
                      style={{
                        padding: "6px 12px",
                        borderRadius: "4px",
                        border: "1px solid #e0e0e0",
                        background: "#f5f5f5",
                        color: "#455a64",
                        fontSize: "0.85rem",
                        cursor: "pointer",
                      }}
                    >
                      Today
                    </button>
                  </div>
                )}
                
                {/* Filter Component */}
                <div className="export-filters">
                  <ExportTicketFilters
                    selectedStatuses={selectedStatuses}
                    setSelectedStatuses={setSelectedStatuses}
                    selectedSla={selectedSla}
                    setSelectedSla={setSelectedSla}
                    startDate={startDate}
                    setStartDate={setStartDate}
                    endDate={endDate}
                    setEndDate={setEndDate}
                    hasActiveFilters={hasActiveFilters}
                    handleClearFilters={handleClearFilters}
                    userRole={userRole}
                    departments={departments}
                    selectedDepartments={selectedDepartments}
                    setSelectedDepartments={setSelectedDepartments}
                  />
                </div>
              </div>
              
              {/* Export Component */}
              <div style={{ flex: "1 1 400px", display: "flex", justifyContent: "center", alignItems: "flex-start" }}>
                <div className="export-button">
                  <AdminTicketExport
                    departments={departments}
                    userRole={userRole}
                    filters={exportFilters}
                    selectedDepartment={selectedDepartments.length === 1 && selectedDepartments[0] !== "all" ? selectedDepartments[0] : ""}
                  />
                </div>
              </div>
            </div>
          </>
        )}
        
        {/* Add CSS for spinner */}
        <style dangerouslySetInnerHTML={{
          __html: `
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `
        }} />
      </div>
    </AdminMainLayout>
  );
};

export default AdminTicketExportPage;