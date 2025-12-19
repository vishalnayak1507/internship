import { useState, useEffect } from 'react';
import axios from 'axios';

const useDashboardData = (timeFilter = { period: 'all' }, department = "") => {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchSummary = async () => {
    try {
      setLoading(true);

      let url = 'http://localhost:8000/api/dashboard/overview';
      const params = new URLSearchParams();

      if (timeFilter.period && timeFilter.period !== 'all') {
        params.append('period', timeFilter.period);
      } else if (timeFilter.startDate && timeFilter.endDate) {
        params.append('startDate', timeFilter.startDate);
        params.append('endDate', timeFilter.endDate);
      }

      // Only append department if it's not empty AND not "All"
      if (department && department !== "All") {
        params.append('department', department);
      }

      if (params.toString()) {
        url += `?${params.toString()}`;
      }

      console.log(`Fetching dashboard data with URL: ${url}`);
      const response = await axios.get(url, { withCredentials: true });

      if (response.data && response.data.success) {
        setSummary(response.data.data);
      } else {
        throw new Error(response.data?.message || 'Failed to fetch summary data');
      }
    } catch (err) {
      console.error("Dashboard data fetch error:", err);
      setError(err.message || 'Failed to fetch summary data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSummary();
    // eslint-disable-next-line
  }, [timeFilter, department]);

  return { summary, loading, error, refetch: fetchSummary };
};

export default useDashboardData;