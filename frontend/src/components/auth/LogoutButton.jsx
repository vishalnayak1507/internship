import React, { useState, useEffect, forwardRef, useImperativeHandle } from "react";
import { useNavigate } from "react-router-dom";
import { FaSignOutAlt, FaExclamationTriangle } from "react-icons/fa";
import axiosClient from "@/utils/AxiosClient";

/**
 * LogoutButton component that handles user logout with confirmation modal for pending tickets
 * @param {Object} props - Component props
 * @param {string} props.userRole - The role of the current user
 * @param {React.Ref} ref - Forwarded ref to expose handleLogout method
 */
const LogoutButton = forwardRef(({ userRole }, ref) => {
  const navigate = useNavigate();
  const [showModal, setShowModal] = useState(false);
  const [message, setMessage] = useState("");
  const [ticketCount, setTicketCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingAction, setLoadingAction] = useState(null); // Track which button is loading

  // Add ESC key listener to close modal
  useEffect(() => {
    const handleEsc = (event) => {
      if (event.keyCode === 27 && showModal) {
        setShowModal(false);
      }
    };
    window.addEventListener("keydown", handleEsc);

    // Clean up the event listener when component unmounts
    return () => {
      window.removeEventListener("keydown", handleEsc);
    };
  }, [showModal]);

  // Prevent page scrolling when modal is open
  useEffect(() => {
    if (showModal) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }

    return () => {
      document.body.style.overflow = "unset";
    };
  }, [showModal]);

  /**
   * Handles user logout process with decision handling for pending tickets
   * @param {string|null} decision - Optional decision for pending tickets ("solve" or "reassign")
   */
  const handleLogout = async (decision = null) => {
    try {
      setIsLoading(true);
      if (decision) {
        // Set which button is loading - either "solve" or "reassign"
        setLoadingAction(decision);
      }

      // Always include headers and empty body by default
      const options = {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(decision ? { decision } : {}),
      };

      // Call backend to logout
      const response = await fetch(
        "http://localhost:8000/api/auth/logout",
        options
      );

      const data = await response.json();

      // If decision required, show the decision dialog (only for analyst role)
      if (!data.success && data.pendingDecision) {
        console.log("Decision needed, showing modal");
        setMessage(data.message);
        setTicketCount(data.ticketCount);
        setShowModal(true);
        setIsLoading(false);
        setLoadingAction(null); // Reset loading action
        return;
      }

      // Logout successful
      console.log("Logout successful, clearing local storage and redirecting");
      localStorage.clear();

      // Force reload the page to ensure all state is cleared
      window.location.href = "/logout"; // Use window.location instead of navigate
    } catch (error) {
      console.error("Logout error:", error);
      alert("Logout failed: " + error.message);
      setIsLoading(false);
      setLoadingAction(null); // Reset loading action
    }
  };

  // Expose handleLogout method to parent components through ref
  useImperativeHandle(ref, () => ({
    handleLogout
  }))

  /**
   * Modal component for logout confirmation with pending tickets
   * @returns {JSX.Element} Modal confirmation dialog
   */
  const Modal = () => (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 animate-fade-in">
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 p-0 relative overflow-hidden border border-gray-200 animate-slide-up"
        onClick={(e) => e.stopPropagation()}
        style={{ boxShadow: "0 8px 32px rgba(0,0,0,0.18)" }}
      >
        {/* Close button */}
        <button
          onClick={() => setShowModal(false)}
          className="absolute top-3 right-3 text-gray-400 hover:text-gray-700 transition-colors text-xl font-bold"
          aria-label="Close"
          style={{ background: "none", border: "none", cursor: "pointer" }}
        >
          &times;
        </button>

        {/* Modal header */}
        <div className="flex items-center gap-3 px-7 py-5 border-b bg-gradient-to-r from-yellow-50 to-yellow-100">
          <span className="flex items-center justify-center w-10 h-10 rounded-full bg-yellow-100 border border-yellow-300">
            <FaExclamationTriangle className="text-yellow-500 text-2xl" />
          </span>
          <h3 className="text-xl font-semibold text-gray-900 tracking-tight">
            Logout Confirmation
          </h3>
        </div>

        {/* Modal body */}
        <div className="px-7 py-6">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-5 mb-5 flex flex-col items-start">
            <p className="text-gray-800 text-base">{message}</p>
            <p className="mt-2 font-semibold text-yellow-700 text-lg">
              You have <span className="font-bold">{ticketCount}</span> ticket
              {ticketCount !== 1 ? "s" : ""} in progress.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-4 mt-2">
            <button
              onClick={() => handleLogout("solve")}
              disabled={isLoading}
              className="flex-1 py-3 px-4 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 shadow"
            >
              {loadingAction === "solve" ? "Processing..." : "Yes, I'll solve them later"}
            </button>
            <button
              onClick={() => handleLogout("reassign")}
              disabled={isLoading}
              className="flex-1 py-3 px-4 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition-colors disabled:opacity-50 shadow"
            >
              {loadingAction === "reassign" ? "Processing..." : "Reassign tickets"}
            </button>
          </div>
        </div>

        {/* Modal footer */}
        <div className="px-7 py-3 border-t bg-gray-50 text-sm text-gray-500 rounded-b-2xl text-center">
          <span>
            Click outside this dialog, press{" "}
            <span className="font-semibold">ESC</span>, or use the{" "}
            <span className="font-semibold">×</span> to cancel.
          </span>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <button
        onClick={(e) => {
          e.stopPropagation(); // Stop event from bubbling
          console.log("Logout button clicked!");
          handleLogout();
        }}
        disabled={isLoading}
        className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold shadow hover:bg-blue-700 transition-colors disabled:opacity-50"
      >
        <FaSignOutAlt />
        {isLoading && !loadingAction ? "Processing..." : "Logout"}
      </button>

      {/* Render the modal if showModal is true */}
      {showModal && (
        <div
          onClick={(e) => {
            e.stopPropagation(); // Stop event from bubbling
            setShowModal(false);
          }}
        >
          <Modal />
        </div>
      )}
    </>
  );
});

LogoutButton.defaultProps = {
  userRole: "",
};

export default LogoutButton;