import React, { useState, useEffect } from 'react';
import AnalystNavbar from '../common/Navbar.jsx';
import { Sidebar as AnalystSidebar } from '../common/Sidebar.jsx';
import CreateTicketManualEntry from "../maker/CreateTicketManualEntry.jsx";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export const AnalystMainLayout = ({ children, onTicketCreated }) => {
  // Initialize sidebar as closed by default (false instead of true)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showCreateTicketModal, setShowCreateTicketModal] = useState(false);
  const [showTicketsModal, setShowTicketsModal] = useState(false);
  
  // Load sidebar state from localStorage on initial render
  useEffect(() => {
    const savedSidebarState = localStorage.getItem('sidebarOpen');
    // Only open the sidebar if explicitly saved as "true"
    if (savedSidebarState === 'true') {
      setIsSidebarOpen(true);
    }
  }, []);
  
  // Save sidebar state to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('sidebarOpen', isSidebarOpen);
  }, [isSidebarOpen]);

  const toggleSidebar = () => {
    setIsSidebarOpen((prev) => !prev);
  };

  return (
    <div className="bg-white">
      {/* Navbar */}
      <AnalystNavbar isSidebarOpen={isSidebarOpen} onSidebarToggle={toggleSidebar} />

      <div className="flex pt-16">
        {/* Sidebar */}
        {isSidebarOpen && (
          <AnalystSidebar 
            onClose={toggleSidebar}  
            onOpenCreateTicketModal={() => setShowCreateTicketModal(true)}
            onViewTickets={() => setShowTicketsModal(true)} 
          />
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
      <CreateTicketManualEntry
        isOpen={showCreateTicketModal}
        onRequestClose={() => setShowCreateTicketModal(false)}
        showTicketsModal={showTicketsModal}
        closeTicketsModal={() => setShowTicketsModal(false)}
        openTicketsModal={() => setShowTicketsModal(true)}
        onTicketCreated={onTicketCreated}
        // ...other props as needed
      />
      {/* <ToastContainer position="top-center" style={{ zIndex: 99999 }} />  */}
    </div>
  );
};

export default AnalystMainLayout;