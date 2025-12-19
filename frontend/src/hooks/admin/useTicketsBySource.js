import { useState, useEffect } from 'react';
import { getTicketsBySource } from '../../api/admin/dashboard';

const useTicketsBySource = (timeFilter = { period: "All" }, selectedDepartment) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchSourceData = async (department) => {
    try {
      setLoading(true);
      
      // Handle "All" department case
      const deptParam = (department && department !== "All") 
        ? department 
        : null;
        
      console.log("Fetching source data with filter:", timeFilter, "department:", deptParam || "All (showing all departments)");
      const response = await getTicketsBySource(timeFilter, deptParam);

      if (response && response.success && response.data) {
        const total = response.data.reduce((sum, item) => sum + item.value, 0);
        const processedData = response.data.map((item) => ({
          ...item,
          percentage: total > 0 ? ((item.value / total) * 100).toFixed(2) : "0.00",
        }));
        setData(processedData);
      } else {
        throw new Error("Unexpected API response format");
      }
    } catch (err) {
      console.error("Source data fetch error:", err);
      setError(err?.response?.data?.message || err.message || "Error fetching data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSourceData(selectedDepartment);
  }, [timeFilter, selectedDepartment]);

return { data, loading, error, refetch: fetchSourceData };
};

export default useTicketsBySource;