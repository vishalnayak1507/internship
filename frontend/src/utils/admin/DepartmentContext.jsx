import React, { createContext, useState, useContext, useEffect } from 'react';

const DepartmentContext = createContext();

export const DepartmentProvider = ({ children }) => {
  const [selectedDepartment, setSelectedDepartment] = useState(() => {
    const storedDept = localStorage.getItem('selectedDepartment');
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    
    if (user.role === 'superadmin') {
      return storedDept || 'All';
    }
    return storedDept || user.department || '';
  });

  // Listen for department changes
  useEffect(() => {
    const handleDepartmentChange = (event) => {
      console.log("Context received departmentChanged event:", event.detail);
      setSelectedDepartment(event.detail);
    };
    
    window.addEventListener('departmentChanged', handleDepartmentChange);
    
    return () => {
      window.removeEventListener('departmentChanged', handleDepartmentChange);
    };
  }, []);

  // Keep localStorage in sync with state
  useEffect(() => {
    if (selectedDepartment) {
      console.log("DepartmentContext: updating localStorage to", selectedDepartment);
      localStorage.setItem('selectedDepartment', selectedDepartment);
    }
  }, [selectedDepartment]);

  const contextValue = {
    selectedDepartment,
    setSelectedDepartment: (dept) => {
      console.log("DepartmentContext: setSelectedDepartment called with", dept);
      setSelectedDepartment(dept);
    }
  };

  return (
    <DepartmentContext.Provider value={contextValue}>
      {children}
    </DepartmentContext.Provider>
  );
};

export const useDepartment = () => {
  const context = useContext(DepartmentContext);
  if (!context) {
    throw new Error('useDepartment must be used within a DepartmentProvider');
  }
  return context;
};