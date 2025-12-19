import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import logo from '../../assets/tech-mahindra-logo.png';
import ProfileButton from '../common/ProfileButton.jsx';
import LogoutButton from '../auth/LogoutButton.jsx';
 
// const getInitials = (name) => {
//   if (!name) return '';
//   const names = name.trim().split(' ');
//   if (names.length === 1) return names[0][0].toUpperCase();
//   return (names[0][0] + names[names.length - 1][0]).toUpperCase();
// };
 
const Navbar = ({ isSidebarOpen, onSidebarToggle }) => {
 
  return (
    <nav className={`fixed top-0 h-16 w-full bg-white shadow z-40 flex items-center justify-between transition-all duration-300 ${isSidebarOpen ? 'pl-64' : 'pl-4'} pr-4`}>
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
 
      {/* Right: Profile */}
      <div className="flex items-center space-x-4 relative">
 
        {/* Profile Circle */}
        <ProfileButton />
       
      </div>
    </nav>
  );
};
 
export default Navbar;
 
