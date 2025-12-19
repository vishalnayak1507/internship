import React, { useState } from 'react';
import Navbar from '../maker/NavbarManualEntry';
import Sidebar from '../maker/SidebarManualEntry';

const MainLayout = ({ children, showModal, onMyTickets }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const toggleSidebar = () => {
    setIsSidebarOpen((prev) => !prev);
  };

  return (
    
    <div className="bg-gradient-to-br from-blue-200 via-blue-100 to-cyan-100">
      {/* Navbar */}
      <Navbar isSidebarOpen={isSidebarOpen} onSidebarToggle={toggleSidebar} />

      <div className="flex pt-16">
        {/* Sidebar */}
        {isSidebarOpen && (
          <Sidebar onClose={toggleSidebar} showModal={showModal}
            onMyTickets={onMyTickets} />
        )}

        {/* Main Content */}
        <div
          className={`flex-1 transition-all duration-300 p-4 ${
            isSidebarOpen ? 'ml-64' : 'ml-0'
          }`}
        >
          {children}
        </div>
      </div>
    </div>
  );
};

export default MainLayout;