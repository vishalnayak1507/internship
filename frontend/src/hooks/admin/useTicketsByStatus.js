import { useState, useEffect, useCallback } from 'react';
import { getTicketsByStatus } from '../../api/admin/dashboard';

const useTicketsByStatus = (timeFilter = { period: "All" }, selectedDepartment) => {
  const [statusData, setStatusData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Define fetchStatus function
  const fetchStatus = useCallback(async (department = selectedDepartment) => {
    try {
      setLoading(true);

      // Handle "All" department case
      const deptParam = (department && department !== "All")
        ? department
        : null;

      console.log("Fetching status data with filter:", timeFilter, "department:", deptParam || "All (showing all departments)");
      const response = await getTicketsByStatus(timeFilter, deptParam);

      if (response && response.success && response.data) {
        setStatusData(response.data);
      } else {
        throw new Error("Unexpected API response format");
      }
    } catch (err) {
      console.error("Status data fetch error:", err);
      setError(err?.response?.data?.message || err.message || "Error fetching status data");
    } finally {
      setLoading(false);
    }
  }, [timeFilter, selectedDepartment]);

  useEffect(() => {
    fetchStatus(selectedDepartment);
  }, [timeFilter, selectedDepartment, fetchStatus]);

  return { statusData, loading, error, refetch: fetchStatus };
};

export default useTicketsByStatus;