import React, { useState } from 'react';
import { FaSync, FaPause, FaPlay, FaClock } from 'react-icons/fa';

const AutoRefreshControl = ({ 
  isAutoRefreshEnabled,
  toggleAutoRefresh, 
  refreshInterval,
  changeRefreshInterval,
  lastRefreshed,
  isRefreshing,
  refreshNow
}) => {
  const [showIntervalOptions, setShowIntervalOptions] = useState(false);
  
  const formatTime = (date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };
  
  const timeAgo = () => {
    const seconds = Math.floor((new Date() - lastRefreshed) / 1000);
    if (seconds < 5) return 'just now';
    if (seconds < 60) return `${seconds} sec ago`;
    
    const minutes = Math.floor(seconds / 60);
    if (minutes === 1) return '1 min ago';
    if (minutes < 60) return `${minutes} mins ago`;
    
    const hours = Math.floor(minutes / 60);
    if (hours === 1) return '1 hour ago';
    return `${hours} hours ago`;
  };

  const intervalOptions = [
    { value: 10000, label: '10 sec' },
    { value: 30000, label: '30 sec' },
    { value: 60000, label: '1 min' },
    { value: 300000, label: '5 min' }
  ];

  return (
    <div className="flex items-center space-x-3 bg-white px-3 py-2 rounded-lg shadow-sm border border-gray-200">
      <button
        onClick={refreshNow}
        disabled={isRefreshing}
        className={`p-1.5 rounded-md ${isRefreshing ? 'animate-spin text-blue-600' : 'hover:bg-blue-100 text-gray-600 hover:text-blue-700'}`}
        title="Refresh now"
      >
        <FaSync className="w-4 h-4" />
      </button>
      
      <div className="h-5 border-l border-gray-300"></div>
      
      <button
        onClick={toggleAutoRefresh}
        className={`p-1.5 rounded-md ${isAutoRefreshEnabled ? 'bg-blue-50 text-blue-600' : 'hover:bg-blue-100 text-gray-600'}`}
        title={isAutoRefreshEnabled ? 'Pause auto-refresh' : 'Enable auto-refresh'}
      >
        {isAutoRefreshEnabled ? 
          <FaPause className="w-4 h-4" /> : 
          <FaPlay className="w-4 h-4" />
        }
      </button>
      
      <div className="relative">
        <button
          onClick={() => setShowIntervalOptions(!showIntervalOptions)}
          className="flex items-center space-x-1 text-xs text-gray-600 hover:text-blue-700 p-1.5 rounded-md hover:bg-blue-100"
          title="Change refresh interval"
        >
          <FaClock className="w-3 h-3" />
          <span>{(refreshInterval / 1000).toFixed(0)}s</span>
        </button>
        
        {showIntervalOptions && (
          <div className="absolute top-full right-0 mt-1 bg-white shadow-lg rounded-md border border-gray-200 z-50">
            {intervalOptions.map(option => (
              <button
                key={option.value}
                onClick={() => {
                  changeRefreshInterval(option.value);
                  setShowIntervalOptions(false);
                }}
                className={`block w-full text-left px-4 py-2 text-sm hover:bg-blue-50 ${refreshInterval === option.value ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-700'}`}
              >
                {option.label}
              </button>
            ))}
          </div>
        )}
      </div>
      
      <div className="h-5 border-l border-gray-300"></div>
      
      <div className="text-xs text-gray-500">
        <span title={lastRefreshed.toLocaleString()}>
          Updated: {timeAgo()}
        </span>
      </div>
    </div>
  );
};

export default AutoRefreshControl;