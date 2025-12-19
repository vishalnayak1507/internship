import { useState, useEffect } from 'react';

const useDepartmentFilter = () => {
  const [department, setDepartment] = useState(() => {
    // Initialize with localStorage value if available, default to "All" for superadmin
    const storedDept = localStorage.getItem('selectedDepartment');
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    
    if (user.role === 'superadmin') {
      return storedDept || 'All';
    }
    return storedDept || '';
  });

  useEffect(() => {
    // Listen for department changes from the navbar
    const handleDepartmentChange = (event) => {
      setDepartment(event.detail);
      // Update localStorage when department changes
      localStorage.setItem('selectedDepartment', event.detail);
    };
    
    window.addEventListener('departmentChanged', handleDepartmentChange);
    
    return () => {
      window.removeEventListener('departmentChanged', handleDepartmentChange);
    };
  }, []);

  return department;
};

export default useDepartmentFilter;