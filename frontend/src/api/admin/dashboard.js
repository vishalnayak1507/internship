// frontend/src/api/dashboard.js
import axios from 'axios';

const API_URL = 'http://localhost:8000/api/dashboard';

// Helper function to get department from localStorage (for superadmin)
const getDepartmentFilter = () => {
  // Check if user is superadmin
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  if (user.role === 'superadmin') {
    const dep = localStorage.getItem('selectedDepartment');
    // If selected department is "All" or empty, don't return a filter value
    if (!dep || dep === "All" || dep === "") {
      return null; // Return null instead of "all" to not include department in query
    }
    return dep;
  }
  // For non-superadmin, use their department
  return user.department || '';
};

export const getDashboardOverview = async (timeFilter = { period: 'All' }) => {
  // Build URL with time filter parameters
  let url = `${API_URL}/overview`;
  const params = new URLSearchParams();
  
  // Add department filter only if not "All"
  const departmentFilter = getDepartmentFilter();
  if (departmentFilter) {
    params.append('department', departmentFilter);
  }
  
  // Add time period filter
  if (timeFilter.period && timeFilter.period !== 'All') {
    params.append('period', timeFilter.period);
  } else if (timeFilter.startDate && timeFilter.endDate) {
    params.append('startDate', timeFilter.startDate);
    params.append('endDate', timeFilter.endDate);
  }
  
  // Add params to URL if any
  const queryString = params.toString();
  if (queryString) {
    url += `?${queryString}`;
  }
  
  console.log("Fetching dashboard overview with URL:", url);
  
  try {
    const response = await axios.get(url, { withCredentials: true });
    if (response.data.success) {
      return response.data.data;
    }
    return null;
  } catch (error) {
    console.error('Error fetching dashboard overview:', error);
    throw error;
  }
};

// Accepts startDate, endDate, and period (for timeFilter)
export const getTicketTrends = async (startDate, endDate, period, department) => {
  let url = `${API_URL}/trend`;
  const params = new URLSearchParams();

  // Only send period if not 'all' and not using custom range
  if (period && period !== 'all') {
    params.append('period', period);
  }
  // Only send startDate/endDate if both are present (custom range)
  if (startDate && endDate) {
    const startStr = startDate instanceof Date ? startDate.toISOString().split('T')[0] : startDate;
    const endStr = endDate instanceof Date ? endDate.toISOString().split('T')[0] : endDate;
    params.append('startDate', startStr);
    params.append('endDate', endStr);
  }

  // Department: only send if not "All" or "All Departments" and not empty/null
  if (department && department !== 'All' && department !== 'All Departments') {
    params.append('department', department);
  }

  if (params.toString()) {
    url += `?${params.toString()}`;
  }

  console.log("Fetching ticket trends with URL:", url);

  const response = await axios.get(url, { withCredentials: true });
  return response.data;
};

export const getTicketsByStatus = async (timeFilter = { period: 'All' }) => {
  // Build URL with time filter parameters
  let url = `${API_URL}/status-summary`;
  const params = new URLSearchParams();
  
  if (timeFilter.period && timeFilter.period !== 'All') {
    params.append('period', timeFilter.period);
  } else if (timeFilter.startDate && timeFilter.endDate) {
    params.append('startDate', timeFilter.startDate);
    params.append('endDate', timeFilter.endDate);
  }
  
  // Add department filter if not "All"
  const department = getDepartmentFilter();
  if (department) {
    params.append('department', department);
  }
  
  if (params.toString()) {
    url += `?${params.toString()}`;
  }
  
  console.log("Fetching tickets by status with URL:", url);
  
  const response = await axios.get(url, { withCredentials: true });
  return response.data;
};

export const getTicketsBySource = async (timeFilter = { period: 'All' }) => {
  // Build URL with time filter parameters
  let url = `${API_URL}/by-source`;
  const params = new URLSearchParams();
  
  if (timeFilter.period && timeFilter.period !== 'All') {
    params.append('period', timeFilter.period);
  } else if (timeFilter.startDate && timeFilter.endDate) {
    params.append('startDate', timeFilter.startDate);
    params.append('endDate', timeFilter.endDate);
  }
  
  // Add department filter if not "All"
  const department = getDepartmentFilter();
  if (department) {
    params.append('department', department);
  }
  
  if (params.toString()) {
    url += `?${params.toString()}`;
  }
  
  console.log("Fetching tickets by source with URL:", url);
  
  const response = await axios.get(url, { withCredentials: true });
  return response.data;
};

// Added new helper function to directly fetch with explicit department parameter
export const fetchDashboardDataByDepartment = async (endpoint, timeFilter = { period: 'all' }, department = null) => {
  let url = `${API_URL}/${endpoint}`;
  const params = new URLSearchParams();
  
  // Only add department if explicitly provided and not "All"/"all"
  if (department && department !== "All") {
    params.append('department', department);
  }
  
  // Add time period filter
  if (timeFilter.period && timeFilter.period !== 'All') {
    params.append('period', timeFilter.period);
  } else if (timeFilter.startDate && timeFilter.endDate) {
    params.append('startDate', timeFilter.startDate);
    params.append('endDate', timeFilter.endDate);
  }
  
  if (params.toString()) {
    url += `?${params.toString()}`;
  }
  
  console.log(`Fetching ${endpoint} with URL:`, url);
  
  try {
    const response = await axios.get(url, { withCredentials: true });
    return response.data;
  } catch (error) {
    console.error(`Error fetching ${endpoint}:`, error);
    throw error;
  }
};