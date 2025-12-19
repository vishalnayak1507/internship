import { useState, useEffect, useRef } from 'react';

/**
 * Hook to enable auto refreshing of data
 * @param {Function} refreshFunction - Function to call for refreshing data
 * @param {Object} options - Configuration options
 * @param {number} options.defaultInterval - Default interval in milliseconds (default: 30000 - 30 seconds)
 * @param {boolean} options.defaultEnabled - Whether auto-refresh is enabled by default (default: true)
 * @returns {Object} - Controls for the auto refresh functionality
 */
const useAutoRefresh = (refreshFunction, options = {}) => {
  const { 
    defaultInterval = 30000, // Default to 30 seconds
    defaultEnabled = true 
  } = options;
  
  const [isAutoRefreshEnabled, setIsAutoRefreshEnabled] = useState(defaultEnabled);
  const [refreshInterval, setRefreshInterval] = useState(defaultInterval);
  const [lastRefreshed, setLastRefreshed] = useState(new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);
  const timerRef = useRef(null);

  // Function to handle manual refresh
  const refreshNow = async () => {
    if (isRefreshing) return;
    
    setIsRefreshing(true);
    try {
      await refreshFunction();
      setLastRefreshed(new Date());
    } catch (error) {
      console.error('Error refreshing data:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Toggle auto refresh
  const toggleAutoRefresh = () => {
    setIsAutoRefreshEnabled(prev => !prev);
  };

  // Change refresh interval
  const changeRefreshInterval = (newInterval) => {
    setRefreshInterval(newInterval);
  };

  // Set up and clear interval based on enabled status
  useEffect(() => {
    if (isAutoRefreshEnabled) {
      timerRef.current = setInterval(refreshNow, refreshInterval);
      
      // Initial refresh when enabled
      refreshNow();
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    // Cleanup on unmount or when dependencies change
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isAutoRefreshEnabled, refreshInterval]);

  return {
    isAutoRefreshEnabled,
    toggleAutoRefresh,
    refreshInterval,
    changeRefreshInterval,
    lastRefreshed,
    isRefreshing,
    refreshNow
  };
};

export default useAutoRefresh;