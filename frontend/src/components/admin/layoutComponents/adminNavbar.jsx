/* eslint-disable no-unused-vars */
import React, { useState, useEffect, useRef } from "react";

import logo from "../../../assets/tech-mahindra-logo.png";
import ProfileButton from "../../common/ProfileButton.jsx";

import { useDepartment } from "../../../utils/admin/DepartmentContext";
import axios from "axios";
import { ChevronDownIcon } from "@heroicons/react/24/solid";
import { Listbox } from "@headlessui/react";
import { createPortal } from "react-dom";
import TourButton from "../TourButton.jsx";

const AdminNavbar = ({ isSidebarOpen, onSidebarToggle }) => {
  const [userDepartment, setUserDepartment] = useState("");
  const [departments, setDepartments] = useState([]);
  const [userRole, setUserRole] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Use context for selectedDepartment
  const { selectedDepartment, setSelectedDepartment } = useDepartment();

  // Fetch user profile and departments when component mounts
  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        setIsLoading(true);
        const response = await axios.get(
          "http://localhost:8000/api/auth/profile",
          { withCredentials: true }
        );
        if (response.data && response.data.success) {
          const dept =
            response.data.data?.department ||
            response.data.user?.department ||
            response.data.data?.user?.department ||
            response.data.department;

          const role =
            response.data.data?.role ||
            response.data.user?.role ||
            response.data.data?.user?.role ||
            response.data.role;

          if (dept) {
            setUserDepartment(dept);
            // If superadmin, set as initial selected department
            if (role === "superadmin" && !selectedDepartment) {
              setSelectedDepartment("All");
            }
          }

          if (role) {
            setUserRole(role);
          }
        }
      } catch (error) {
        setError(error.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserProfile();

    // If user is superadmin, fetch all departments
    const fetchDepartments = async () => {
      try {
        const userData = JSON.parse(localStorage.getItem("user") || "{}");
        if (userData.role === "superadmin") {
          const response = await axios.get(
            "http://localhost:8000/api/departments"
          );
          if (response.data && response.data.success) {
            setDepartments(response.data.departments || []);
            // Set initial department if not already set
            if (!selectedDepartment) {
              const storedDept = localStorage.getItem("selectedDepartment");
              if (storedDept) {
                setSelectedDepartment(storedDept);
              } else {
                setSelectedDepartment("All");
                localStorage.setItem("selectedDepartment", "All");
              }
            }
          }
        }
      } catch {
        // Optionally handle error
      }
    };

    fetchDepartments();
    // eslint-disable-next-line
  }, []);

  // Handle department change for superadmin
  const handleDepartmentChange = (dept) => {
    setSelectedDepartment(dept);
    localStorage.setItem("selectedDepartment", dept);
  };

  return (
    <nav
      className={`fixed top-0 h-16 w-full bg-white shadow z-40 flex items-center justify-between transition-all duration-300 ${
        isSidebarOpen ? "pl-64" : "pl-4"
      } pr-4`}
    >
      {/* Left: Logo and Sidebar Toggle */}
      <div className="flex items-center space-x-4">
        {!isSidebarOpen && (
          <button
            onClick={onSidebarToggle}
            className="text-2xl text-blue-600 mr-2"
            title="Open Sidebar"
          >
            ☰
          </button>
        )}
        <img src={logo} alt="Tech Mahindra" className="h-10" />
      </div>

      {/* Right: Profile, Department Selector, and Department Badge */}
      <div className="flex items-center space-x-2">
        {/* Department selector for superadmin */}
        {userRole === "superadmin" && (
          <div className="flex items-center">
            <label className="text-sm text-gray-700 font-medium mr-2">
              Department:
            </label>
            <div className="relative min-w-[180px] overflow-visible">
              <Listbox value={selectedDepartment || "All"} onChange={handleDepartmentChange}>
                {({ open }) => {
                  const buttonRef = useRef(null);
                  const [dropdownStyles, setDropdownStyles] = useState({});

                  useEffect(() => {
                    if (open && buttonRef.current) {
                      const rect = buttonRef.current.getBoundingClientRect();
                      setDropdownStyles({
                        position: "absolute",
                        top: rect.bottom + window.scrollY,
                        left: rect.left + window.scrollX,
                        width: rect.width,
                        zIndex: 13000,
                      });
                    }
                  }, [open]);

                  const options = (
                    <Listbox.Options
                      className="bg-white shadow-lg rounded-lg"
                      style={dropdownStyles}
                    >
                      <Listbox.Option
                        key="All"
                        value="All"
                        className={({ active }) =>
                          `cursor-pointer select-none py-2 pl-4 pr-10 ${
                            active ? "bg-blue-100 text-blue-700" : "text-gray-900"
                          }`
                        }
                      >
                        All
                      </Listbox.Option>
                      {departments.map((dept) => (
                        <Listbox.Option
                          key={dept}
                          value={dept}
                          className={({ active }) =>
                            `cursor-pointer select-none py-2 pl-4 pr-10 ${
                              active ? "bg-blue-100 text-blue-700" : "text-gray-900"
                            }`
                          }
                        >
                          {dept}
                        </Listbox.Option>
                      ))}
                    </Listbox.Options>
                  );

                  return (
                    <>
                      <Listbox.Button
                        ref={buttonRef}
                        className="w-full border border-gray-300 rounded-lg py-2 pl-4 pr-10 bg-white text-gray-800 font-semibold shadow focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-150 flex items-center"
                      >
                        {selectedDepartment || "All"}
                        <span className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                          <ChevronDownIcon className="h-5 w-5 text-gray-400" />
                        </span>
                      </Listbox.Button>
                      {open && createPortal(options, document.body)}
                    </>
                  );
                }}
              </Listbox>
            </div>
          </div>
        )}

        {/* Department Badge - only show for admin, not superadmin */}
        {userRole !== "superadmin" &&
          (isLoading ? (
            <div className="text-sm text-gray-400 font-medium">Loading...</div>
          ) : error ? (
            <div className="text-sm text-red-500 font-medium">Error</div>
          ) : (
            <div className="flex items-center px-3 py-2 border-r border-gray-200">
              <span className="text-sm text-gray-700 font-medium mr-2 uppercase tracking-wide">
                Department:
              </span>
              <span className="text-blue-700 font-bold text-base">
                {userDepartment || "Unknown"}
              </span>
            </div>
          ))}

        {/* We can use this info button for using */}
        {/* Tour Button */}
        {/* <div className="mr-2"> */}
          {/* <TourButton /> */}
        {/* </div> */}
        {/* Profile Button */}
        <ProfileButton />
        {/* Optional: Log Out button */}
        {/* <LogoutButton /> */}
      </div>
    </nav>
  );
};

export default AdminNavbar;