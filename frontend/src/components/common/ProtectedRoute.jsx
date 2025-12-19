import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import axiosClient from '../../utils/AxiosClient';

const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(null);
  const [userRole, setUserRole] = useState(null);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await axiosClient.get('/validate');
        
        // Set authentication status
        setIsAuthenticated(response.data.success);
        
        // Get user role from response or localStorage
        if (response.data.user?.role) {
          setUserRole(response.data.user.role);
        } else {
          // Fallback to localStorage if not in response
          const userData = JSON.parse(localStorage.getItem('user') || '{}');
          setUserRole(userData.role || null);
        }
      } catch (error) {
        setIsAuthenticated(false);
        setUserRole(null);
      }
    };

    checkAuth();
  }, []);

  // Show loading while checking authentication
  if (isAuthenticated === null || userRole === null) {
    return <div>Checking authentication...</div>;
  }

  // If not authenticated, redirect to login
  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }
  
  // If roles are specified and user's role is not included, redirect based on role
  if (allowedRoles.length > 0 && !allowedRoles.includes(userRole)) {
    // Redirect based on role
    if (userRole === 'admin' || userRole === 'superadmin') {
      return <Navigate to="/" />;
    } else if (userRole === 'analyst') {
      return <Navigate to="/" />;
    } else if (userRole === 'maker') {
      return <Navigate to="/" />;
    }
    
    // Default fallback if role doesn't match any of the above
    return <Navigate to="/login" />;
  }

  // If authenticated and authorized (or no roles specified), render children
  return children;
};

export default ProtectedRoute;