import React, { useState,useEffect } from "react";
import AdminNavbar from "./adminNavbar";
import AdminSidebar from "./adminSidebar";
import CreateTicketManualEntry from "../../maker/CreateTicketManualEntry";
import ViewTicketManualEntry from "../../maker/ViewTicketManualEntry";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { TourProvider } from "../../../utils/admin/TourContext";
import TourComponent from "../TourComponent";



const AdminMainLayout = ({ children }) => {
  // Add this near the top of your AdminMainLayout component
  console.log(
    "[AdminMainLayout] Rendering with department:",
    localStorage.getItem("selectedDepartment")
  );


  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const toggleSidebar = () => {
    setIsSidebarOpen((prev) => !prev);
  };

  const [showCreateTicketModal, setShowCreateTicketModal] = useState(false);
  const [showTicketsModal, setShowTicketsModal] = useState(false);

   useEffect(() => {
    if (showCreateTicketModal) {
      // Lock scroll and compensate for scrollbar
      const scrollBarWidth = window.innerWidth - document.documentElement.clientWidth;
      document.body.style.overflow = "hidden";
      document.body.style.paddingRight = `${scrollBarWidth}px`;
    } else {
      // Restore scroll
      document.body.style.overflow = "";
      document.body.style.paddingRight = "";
    }
    // Clean up on unmount
    return () => {
      document.body.style.overflow = "";
      document.body.style.paddingRight = "";
    };
  }, [showCreateTicketModal]);


  return (
    // <DepartmentProvider>
    <TourProvider>
      <div>
        {/* Navbar */}
        <AdminNavbar
          isSidebarOpen={isSidebarOpen}
          onSidebarToggle={toggleSidebar}
        />
        
        {/* Tour Component */}
        <TourComponent />

        <div className="flex pt-16">
          {/* Sidebar */}
          {isSidebarOpen && (
            <AdminSidebar
              onClose={toggleSidebar}
              onOpenCreateTicketModal={() => setShowCreateTicketModal(true)}
              onViewTickets={() => setShowTicketsModal(true)}
            />
          )}

          {/* Main Content */}
          <div
            className={`flex-1 transition-all duration-300 p-4 ${
              isSidebarOpen ? "ml-64" : "ml-0"
            }`}
          >
            {children}
          </div>
        </div>
      </div>
      {/* Modals go here */}

      <CreateTicketManualEntry
        isOpen={showCreateTicketModal}
        onRequestClose={() => setShowCreateTicketModal(false)}
        showTicketsModal={showTicketsModal}
        closeTicketsModal={() => setShowTicketsModal(false)}
        openTicketsModal={() => setShowTicketsModal(true)}
        // ...other props as needed
      />

      {/* <ViewTicketManualEntry
      isOpen={showTicketsModal}
      onRequestClose={() => setShowTicketsModal(false)}
      // ...other props as needed
    /> */}
      <ToastContainer position="top-center" style={{ zIndex: 99999 }} />
    </TourProvider>
  );
};

export default AdminMainLayout;
