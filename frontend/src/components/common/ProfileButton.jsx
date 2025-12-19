import React, { useState, useEffect, useRef } from "react";
import ReactDOM from "react-dom";
import LogoutButton from "../auth/LogoutButton";
import { FaUserCircle } from "react-icons/fa";

const ProfileButton = () => {
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [profile, setProfile] = useState(null);
  const profileRef = useRef();
  const logoutBtnRef = useRef();

  // Fetch profile data from backend
  const fetchProfile = async () => {
    try {
      const res = await fetch("http://localhost:8000/api/auth/profile", {
        credentials: "include",
      });
      if (res.ok) {
        const data = await res.json();
        setProfile(data.data);
      } else {
        setProfile(null);
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
      setProfile(null);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  // Close profile popup when clicking outside
  useEffect(() => {
    if (!isProfileOpen) return;
    function handleClickOutside(event) {
      if (
        profileRef.current &&
        !profileRef.current.contains(event.target) &&
        !document.getElementById("profile-popup")?.contains(event.target) &&
        !document.getElementById("logout-modal")?.contains(event.target) &&
        !(logoutBtnRef.current && logoutBtnRef.current.contains(event.target))
      ) {
        setIsProfileOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isProfileOpen]);

  const toggleProfilePopup = () => {
    setIsProfileOpen((prev) => !prev);
  };

  return (
    <div className="relative" ref={profileRef}>
      <div
        onClick={toggleProfilePopup}
        className="w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center font-semibold cursor-pointer hover:bg-blue-700 transition-transform duration-200 transform hover:scale-105"
        title="Profile"
      >
        {profile ? profile.name[0].toUpperCase() : <FaUserCircle />}
      </div>

      {isProfileOpen &&
        ReactDOM.createPortal(
          <div
            className="fixed top-20 right-6 w-72 bg-white shadow-2xl rounded-xl overflow-hidden z-[99999] border border-gray-200"
            style={{ minWidth: 270 }}
          >
            {/* Header */}
            <div className="bg-blue-500 px-4 py-3">
              <h2 className="text-sm font-semibold text-white flex items-center gap-2">
                <FaUserCircle />
                Profile Details
              </h2>
            </div>
            {/* Content */}
            <div className="p-4">
              {profile ? (
                <div className="space-y-4">
                  <div className="space-y-2 text-sm">
                    <div className="p-2 rounded bg-gray-50">
                      <p className="text-xs text-blue-600 mb-0.5">Name</p>
                      <p className="font-medium text-gray-800">{profile.name}</p>
                    </div>
                    
                    <div className="p-2 rounded bg-gray-50">
                      <p className="text-xs text-blue-600 mb-0.5">Employee Id</p>
                      <p className="font-medium text-gray-800">
                        {profile.userid}
                      </p>
                    </div>
                    <div className="p-2 rounded bg-gray-50">
                      <p className="text-xs text-blue-600 mb-0.5">Email</p>
                      <p className="font-medium text-gray-800">{profile.email}</p>
                    </div>
                    <div className="p-2 rounded bg-gray-50">
                      <p className="text-xs text-blue-600 mb-0.5">Role</p>
                      <p className="font-medium text-gray-800 capitalize">
                        {profile.role}
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-4">
                  <p className="text-red-500 text-sm font-medium">
                    Failed to load profile
                  </p>
                  <button
                    onClick={fetchProfile}
                    className="mt-2 bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-xs"
                  >
                    Retry
                  </button>
                </div>
              )}
              {/* Logout Button */}
              <div className="mt-4 pt-3 border-t" ref={logoutBtnRef}>
                <LogoutButton userRole={profile?.role} />
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
};

export default ProfileButton;