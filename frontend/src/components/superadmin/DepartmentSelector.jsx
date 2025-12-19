import React, { useState, useEffect } from "react";
import axios from "axios";
import Select from "react-select";
import { useDepartment } from "../../utils/admin/DepartmentContext";

const DepartmentSelector = ({ onSelect }) => {
  const [departments, setDepartments] = useState([]);
  const { selectedDepartment, setSelectedDepartment } = useDepartment();
  const [isLoading, setIsLoading] = useState(true);
  const [userRole, setUserRole] = useState("");

  // Fetch user profile on mount
  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    setUserRole(user.role || "");
  }, []);

  // Fetch departments
  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        setIsLoading(true);
        const response = await axios.get(
          `${import.meta.env.VITE_API_BASE_URL || ""}/api/departments`
        );
        if (response.data.success && response.data.departments.length > 0) {
          // Remove "All Departments" and "All" from backend response
          let depts = response.data.departments.filter(
            (dept) => dept !== "All Departments" && dept !== "All"
          );
          setDepartments(depts);

          // Set default department if needed
          if (!selectedDepartment) {
            const defaultDept = userRole === "superadmin" ? "All" : depts[0];
            setSelectedDepartment(defaultDept);
            localStorage.setItem("selectedDepartment", defaultDept);
            if (onSelect) onSelect(defaultDept);
          }
        }
      } catch (error) {
        console.error("Error fetching departments:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDepartments();
  }, [userRole]);

  const handleChange = (e) => {
    e.preventDefault();
    const newDepartment = e.target.value;
    setSelectedDepartment(newDepartment);
    localStorage.setItem("selectedDepartment", newDepartment);
    window.dispatchEvent(
      new CustomEvent("departmentChanged", {
        detail: newDepartment,
      })
    );
    if (onSelect) onSelect(newDepartment);
  };

  if (isLoading) {
    return (
      <div className="h-9 w-full bg-gray-100 animate-pulse rounded-md"></div>
    );
  }

  // Prepare options for react-select
  const options = [
    ...(userRole === "superadmin" ? [{ value: "All", label: "All" }] : []),
    ...departments.map((dept) => ({ value: dept, label: dept })),
  ];

  return (
    <div className="mb-4 flex items-center bg-white p-2 rounded-lg shadow-sm border">
      <label className="font-medium text-gray-700 mr-3">Department:</label>
      <div style={{ minWidth: 200, flex: 1 }}>
        <Select
          value={options.find((opt) => opt.value === selectedDepartment) || null}
          onChange={(selected) => {
            const newDepartment = selected ? selected.value : "";
            setSelectedDepartment(newDepartment);
            localStorage.setItem("selectedDepartment", newDepartment);
            window.dispatchEvent(
              new CustomEvent("departmentChanged", {
                detail: newDepartment,
              })
            );
            if (onSelect) onSelect(newDepartment);
          }}
          options={options}
          isSearchable={false}
          menuPlacement="auto"
          menuPortalTarget={typeof window !== 'undefined' ? document.body : null}
          styles={{
            menuPortal: base => ({ ...base, zIndex: 9999 }),
          }}
          instanceId="department-selector"
        />
      </div>
    </div>
  );
};

export default DepartmentSelector;