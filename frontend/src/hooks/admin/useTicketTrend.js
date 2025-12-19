import { useState, useEffect, useCallback } from 'react';
import { getTicketTrends } from '../../api/admin/dashboard';

// Accepts timeFilter and department for dynamic trend fetching
const useTicketTrend = (timeFilter = { period: 'all' }, department = "") => {
  const [trend, setTrend] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchTrend = useCallback(async () => {
    try {
      setLoading(true);
      let startDate, endDate, period;

      if (timeFilter && timeFilter.startDate && timeFilter.endDate) {
        startDate = timeFilter.startDate;
        endDate = timeFilter.endDate;
      }
      if (timeFilter && timeFilter.period && timeFilter.period !== 'all') {
        period = timeFilter.period;
      }

      // Only send department if not "All" or "All Departments"
      const deptParam = (department && department !== "All" && department !== "All Departments")
        ? department
        : null;

      const response = await getTicketTrends(startDate, endDate, period, deptParam);

      if (response && response.success && response.data) {
        setTrend(response.data);
      } else {
        throw new Error('Unexpected API response format');
      }
      setLoading(false);
    } catch (err) {
      console.error("Trend data fetch error:", err);
      setError(err.message || 'Failed to load trend data');
      setLoading(false);
    }
  }, [timeFilter, department]);

  useEffect(() => {
    fetchTrend();
  }, [fetchTrend]);

  return { trend, loading, error, refetch: fetchTrend };
};

export default useTicketTrend;