import axios from "axios";
import React, { useState, useEffect } from "react";
import ReactModal from "react-modal";
import { Formik, Form } from "formik";
import { useNavigate } from "react-router-dom"; // Add this if not already imported
import * as Yup from "yup";
import FieldArea from "./FieldArea";
import FieldSelect from "./FieldSelect";
import { countryCodes } from "../../lib/countryCodes";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { ToastContainer } from "react-toastify";
import TicketForm from "../analyst/TicketForm";

const validationSchema = Yup.object().shape({
  customerId: Yup.string(),
  customerName: Yup.string()
    .max(50, "Customer Name cannot exceed 50 characters")
    .required("Customer name is required"),
  customerCountryCode: Yup.string()
    .required("Country code is required")
    .matches(/^\+\d{1,4}$/, "Invalid country code format"),
  customerPhoneNumber: Yup.string()
    .required("Phone number is required")
    .test(
      "len",
      "Phone number must be exactly 10 digits",
      (val) => val && val.replace(/\D/g, "").length === 10
    ),
  customerEmail: Yup.string()
    // .required("Customer Email is required Query Mode is Email")
    .max(100, "Customer Email cannot exceed 100 characters")
    .email("Invalid email format")
    .matches(
      /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/,
      'Email must include a valid domain (e.g "example.com")'
    )
    .required("Customer Email is required"),
  mode: Yup.string().required("Query mode is required"),
  otherModeText: Yup.string()
    .max(30, "Mode cannot exceed 30 characters")
    .when("mode", {
      is: "Others",
      then: (schema) => schema.required("Please specify"),
      otherwise: (schema) => schema.notRequired(),
    }),
  categoryName: Yup.string().required("Category is required"),
  moduleName: Yup.string().required("Module is required"),
  description: Yup.string()
    .max(300, "Description cannot exceed 300 characters")
    .required("Description is required"),
  department: Yup.string().required("Department is required"),
});

export default function CreateTicketManualEntry({
  isOpen,
  onRequestClose,
  showTicketsModal,
  closeTicketsModal,
  openTicketsModal,
  defaultDepartment,
  onTicketCreated
}) {
  const [countryCode, setCountryCode] = useState("+91");
  const [tickets, setTickets] = useState([]);
  const [loadingTickets, setLoadingTickets] = useState(false);
  const [user, setUser] = useState({});
  const [filterDate, setFilterDate] = useState("");
  const [filterMonth, setFilterMonth] = useState("");
  const [filterYear, setFilterYear] = useState("");
  const [filterThisWeek, setFilterThisWeek] = useState("");
  const [highlightedTicket, setHighlightedTicket] = useState(null);
  const [loading, setLoading] = useState(false);
  const [ticketmasters, setTicketmasters] = useState([]);
  const [categoryOptions, setCategoryOptions] = useState([]);
  const [moduleOptions, setModuleOptions] = useState([]);
  const [userRole, setUserRole] = useState("");
  const [departments, setDepartments] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [showCustomerIdDropdown, setShowCustomerIdDropdown] = useState(false);
  const [showCustomerNameDropdown, setShowCustomerNameDropdown] =useState(false);
  const [isDropdownSelection, setIsDropdownSelection] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const maker_route = async () => {
      try {
        const response = await axios.get(
          "http://localhost:8000/api/auth/verify",
          { withCredentials: true }
        );
        setUser((prev) => ({
          ...prev,
          name: response.data.user.name,
        }));
      } catch (error) {
        navigate("/login");
      }
    };
    maker_route();
  }, []);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await axios.get(
          "http://localhost:8000/api/auth/verify",
          { withCredentials: true }
        );
        setUser(response.data.user);
        setUserRole(response.data.user.role);
      } catch (error) {
        navigate("/login");
      }
    };
    fetchUser();
  }, [navigate]);

  useEffect(() => {
    axios
      .get("http://localhost:8000/api/auth/ticketmasters", {
        withCredentials: true,
      })
      .then((res) => {
        setTicketmasters(res.data.ticketmasters || []);
      })
      .catch(() => {
        setTicketmasters([]);
      });
  }, []);

  useEffect(() => {
    if (userRole === "superadmin") {
      // Extract unique departments
      const uniqueDepartments = [
        ...new Set(ticketmasters.map((item) => item.department)),
      ];
      setDepartments(uniqueDepartments);
    } else {
      setDepartments([user.department]);
    }
  }, [userRole, ticketmasters, user.department]);

  useEffect(() => {
    if (isOpen) {
      // Disable body scroll
      document.body.style.overflow = "hidden";
    } else {
      // Re-enable body scroll
      document.body.style.overflow = "unset";
    }

    // Cleanup function to ensure scroll is re-enabled when component unmounts
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  const initialValues = {
    customerId: "",
    customerName: "",
    customerCountryCode: "+91",
    customerPhoneNumber: "",
    customerEmail: "",
    mode: "",
    categoryName: "",
    moduleName: "",
    description: "",
    department: userRole === "superadmin" ? "" : user.department || "",
    otherModeText: "",
  };
  
  // Handle ticket creation
  const handleSubmit = async (values, { resetForm }) => {
    try {
      if (loading) return; // Prevent double submission
      setLoading(true);
      const trimmedValues = Object.keys(values).reduce((acc, key) => {
        acc[key] =
          typeof values[key] === "string" ? values[key].trim() : values[key];
        return acc;
      }, {});

      const customerIdentity = trimmedValues.customerId
        ? `${trimmedValues.customerId} - ${trimmedValues.customerName}`
        : `CUST${Date.now().toString().slice(-6)} - ${trimmedValues.customerName}`; // Generate customerId if not provided

      // Check if customer exists in the database
      const customerCheckPayload = {
        customerIdentity,
        customerCountryCode: trimmedValues.customerCountryCode,
        customerPhoneNumber: trimmedValues.customerPhoneNumber.replace(/\D/g, ""),
        customerEmail: trimmedValues.customerEmail,
      };

      const customerResponse = await axios.post(
        "http://localhost:8000/api/customer/create-and-modify",
        customerCheckPayload,
        { withCredentials: true }
      );

      const customerData = customerResponse.data.customer;

      const payload = {
        ...trimmedValues,
        customerIdentity: customerData.customerIdentity,
        customerCountryCode: customerData.customerCountryCode,
        customerPhoneNumber: customerData.customerPhoneNumber,
        customerEmail: customerData.customerEmail,
        otherModeText:
          trimmedValues.mode === "Others"
            ? trimmedValues.otherModeText
            : undefined,
      };

      const res = await axios.post(
        "http://localhost:8000/api/auth/my-tickets-admin",
        payload,
        { withCredentials: true }
      );

      const newTicketId = res.data.ticket?._id; // or ticketNumber if that's what you use
      setHighlightedTicket(newTicketId);
      toast.success(
        <div>
          Ticket Created Successfully! <br />
          Ticket Number :{" "}
          <strong>
            {res.data.ticket?.ticketNumber || res.data.ticket?._id}
          </strong>
        </div>,
        {
          position: "top-right",
          autoClose: 3000,
          closeOnClick: true,
          pauseOnHover: true,
        }
      );
      if (onTicketCreated) {
        onTicketCreated(res.data.ticket?.ticketNumber || res.data.ticket?._id);
      }
      resetForm();
    } catch (err) {
      toast.error("Error creating ticket. Try again.", {
        position: "top-right",
        autoClose: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchTickets = async () => {
    setLoadingTickets(true);
    try {
      const res = await axios.get(
        "http://localhost:8000/api/auth/my-tickets-admin",
        { withCredentials: true }
      );
      setTickets(res.data.tickets);
    } catch (err) {
      setTickets([]);
    } finally {
      setLoadingTickets(false);
    }
  };
  // Open tickets modal and fetch tickets

  useEffect(() => {
    if (showTicketsModal) {
      fetchTickets();
    }
  }, [showTicketsModal]);

  return (
    <>
      {/* Create Ticket Modal */}

      <ReactModal
        isOpen={isOpen}
        onRequestClose={onRequestClose}
        ariaHideApp={false}
        style={{
          overlay: {
            backgroundColor: "rgba(30, 41, 59, 0.55)",
            backdropFilter: "blur(8px)",
            WebkitBackdropFilter: "blur(8px)",
            zIndex: 9999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            position: "fixed",
          },
          content: {
            position: "relative",
            inset: "auto",
            border: "none",
            background: "transparent",
            borderRadius: "24px",
            padding: "0",
            // maxWidth: '600px', // similar to your manual entry card
            width: "900px",
            height: "680px",
            //minHeight: 'unset',
            //maxHeight: '90vh',
            //overflow: 'auto',
            boxShadow:
              "0 25px 50px -12px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.1)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            //maxWidth: 'none',
            overflow: "visible",
          },
        }}
      >
        <div
          className="relative bg-white rounded-2xl shadow-xl w-full h-full flex flex-col p-12"
          style={{
            maxHeight: "680px",
            overflowY: "auto",
          }}
        >
          <button
            onClick={onRequestClose}
            className="absolute top-6 right-6 text-3xl text-red-400 hover:text-gray-700 focus:outline-none"
            aria-label="Close"
            type="button"
          >
            ×
          </button>
          <h2 className="text-2xl font-bold mb-6 text-blue-700">
            Create New Ticket
          </h2>
          <TicketForm
            initialValues={initialValues}
            validationSchema={validationSchema}
            onSubmit={handleSubmit}
            ticketmasters={ticketmasters}
            userRole={userRole}
            user={user}
            departments={departments}
            setDepartments={setDepartments}
            loading={loading}
            countryCode={countryCode}
            setCountryCode={setCountryCode}
          />
        </div>
      </ReactModal>

      <ReactModal
        isOpen={showTicketsModal}
        onRequestClose={closeTicketsModal}
        ariaHideApp={false}
        style={{
          overlay: {
            backgroundColor: "rgba(0, 0, 0, 0.8)",
            backdropFilter: "blur(8px)",
            zIndex: 1000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          },
          content: {
            position: "relative",
            inset: "auto",
            border: "none",
            background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            borderRadius: "24px",
            padding: "0",
            maxWidth: "95vw",
            maxHeight: "90vh",
            width: "1200px",
            overflow: "hidden",
            boxShadow:
              "0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.1)",
            transform: "scale(0.95)",
            animation: "modalOpen 0.3s ease-out forwards",
          },
          body: {
            overflow: "hidden",
          },
        }}
      >
        <style jsx>{`
          @keyframes modalOpen {
            to {
              transform: scale(1);
            }
          }
          @keyframes shimmer {
            0% {
              background-position: -200px 0;
            }
            100% {
              background-position: calc(200px + 100%) 0;
            }
          }
          .shimmer {
            background: linear-gradient(
              90deg,
              transparent,
              rgba(255, 255, 255, 0.2),
              transparent
            );
            background-size: 200px 100%;
            animation: shimmer 2s infinite;
          }
          .shimmer-button {
            background: linear-gradient(90deg, #dbeafe, #bfdbfe, #dbeafe);
            background-size: 200% 100%;
            animation: shimmer 2s infinite;
          }
          .shimmer-active {
            background: linear-gradient(90deg, #60a5fa, #3b82f6, #60a5fa);
            background-size: 200% 100%;
            animation: shimmer 2s infinite;
          }
        `}</style>

        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-white bg-opacity-10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute -bottom-32 -left-32 w-64 h-64 bg-cyan-300 bg-opacity-20 rounded-full blur-2xl animate-pulse delay-1000"></div>
        </div>

        {/* Header Section - Lighter Blue Gradient */}
        <div className="relative bg-gradient-to-r from-blue-100 via-blue-70 to-indigo-100 p-8">
          <div className="flex items-center justify-between text-blue-800">
            <div className="flex items-center space-x-4">
              <div className="bg-blue-500 bg-opacity-15 p-3 rounded-2xl backdrop-blur-sm">
                <svg
                  className="w-8 h-8 text-blue-600"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div>
                <h2 className="text-3xl font-bold tracking-tight text-blue-800">
                  My Tickets
                </h2>
                <div className="flex items-center mt-1">
                  <span
                    className="bg-blue-500 bg-opacity-15 px-3 py-1 rounded-full text-sm font-semibold backdrop-blur-sm text-blue-700"
                    id="ticketCount"
                  >
                    {(() => {
                      const filteredTickets = tickets.filter((ticket) => {
                        const created = new Date(ticket.createdAt);
                        const ticketDate = created.toISOString().slice(0, 10);
                        const ticketMonth = String(
                          created.getMonth() + 1
                        ).padStart(2, "0");
                        const ticketYear = String(created.getFullYear());

                        // Current Week Filtering Logic
                        const today = new Date();
                        const startOfWeek = new Date(
                          today.setDate(today.getDate() - today.getDay())
                        ); // Start of the week (Sunday)
                        const endOfWeek = new Date(
                          startOfWeek.getTime() + 6 * 24 * 60 * 60 * 1000
                        ); // End of the week (Saturday)

                        return (
                          (!filterDate || ticketDate === filterDate) &&
                          (!filterMonth || ticketMonth === filterMonth) &&
                          (!filterYear || ticketYear === filterYear) &&
                          (!filterThisWeek ||
                            (created >= startOfWeek && created <= endOfWeek)) // Filter only if "This Week" is active
                        );
                      });

                      const count = filteredTickets.length;
                      const hasFilters =
                        filterDate ||
                        filterMonth ||
                        filterYear ||
                        filterThisWeek;

                      if (hasFilters) {
                        if (filterYear && !filterMonth) {
                          return `${count} tickets for ${filterYear}`;
                        } else if (filterThisWeek) {
                          return `${count} tickets for this week`;
                        } else if (filterMonth && filterYear) {
                          const monthName = new Date(
                            0,
                            parseInt(filterMonth) - 1
                          ).toLocaleString("default", { month: "long" });
                          return `${count} tickets for ${monthName} ${filterYear}`;
                        } else {
                          return `${count} filtered tickets`;
                        }
                      } else {
                        return `${count} Total`;
                      }
                    })()}
                  </span>
                </div>
              </div>
            </div>
            <button
              onClick={closeTicketsModal}
              className="group bg-blue-500 bg-opacity-10 hover:bg-opacity-20 p-3 rounded-2xl transition-all duration-300 backdrop-blur-sm border border-blue-500 border-opacity-20"
              aria-label="Close"
            >
              <svg
                className="w-6 h-6 text-blue-600 group-hover:rotate-90 transition-transform duration-300"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>

        {/* Content Container */}
        <div className="relative bg-gradient-to-br from-slate-50 to-white max-h-[calc(90vh-120px)] overflow-y-auto">
          {loadingTickets ? (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="relative mb-6">
                <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-500 rounded-full animate-spin"></div>
                <div className="absolute inset-0 w-16 h-16 border-4 border-transparent border-b-blue-400 rounded-full animate-spin animation-delay-150"></div>
              </div>
              <div className="text-xl font-semibold text-slate-700 mb-2">
                Loading Your Tickets...
              </div>
              <div className="text-slate-500">
                Please wait while we fetch your data
              </div>
            </div>
          ) : tickets.length === 0 ? (
            <div className="text-center py-20">
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 w-24 h-24 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                <svg
                  className="w-10 h-10 text-blue-500"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-slate-800 mb-3">
                No Tickets Found
              </h3>
              <p className="text-slate-600 max-w-md mx-auto">
                You don't have any support tickets yet. When you create one, it
                will appear here.
              </p>
            </div>
          ) : (
            <div className="p-6">
              {/* Enhanced Filters */}
              <div className="bg-white rounded-2xl border border-slate-200 p-4 mb-6 shadow-lg shadow-slate-200/50">
                <div className="flex items-center mb-3">
                  <svg
                    className="w-4 h-4 text-blue-500 mr-2"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M3 3a1 1 0 011-1h12a1 1 0 011 1v3a1 1 0 01-.293.707L12 11.414V15a1 1 0 01-.293.707l-2 2A1 1 0 018 17v-5.586L3.293 6.707A1 1 0 013 6V3z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <h3 className="text-md font-semibold text-slate-800">
                    Filter & Search
                  </h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                  <div className="relative">
                    <input
                      type="date"
                      value={filterDate}
                      onChange={(e) => setFilterDate(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl text-sm font-semibold bg-blue-100 text-blue-800 border-2 border-blue-200 shadow-sm transition-all duration-300
           focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-200"
                      placeholder="Filter by Date"
                    />
                  </div>
                  <div className="relative">
                    <button
                      onClick={() => setFilterThisWeek((prev) => !prev)}
                      className={`w-full px-3 py-2 rounded-xl text-sm font-semibold bg-blue-100 text-blue-800 border-2 border-blue-200 shadow-sm transition-all duration-300
           focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-200`}
                    >
                      {filterThisWeek
                        ? "Show Total Tickets"
                        : "Filter This Week"}
                    </button>
                  </div>
                  <select
                    value={filterMonth}
                    onChange={(e) => setFilterMonth(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl text-sm font-semibold bg-blue-100 text-blue-800 border-2 border-blue-200 shadow-sm transition-all duration-300
           focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-200"
                  >
                    <option value="">All Months</option>
                    {[...Array(12)].map((_, i) => (
                      <option
                        key={i + 1}
                        value={String(i + 1).padStart(2, "0")}
                      >
                        {new Date(0, i).toLocaleString("default", {
                          month: "long",
                        })}
                      </option>
                    ))}
                  </select>
                  <select
                    value={filterYear}
                    onChange={(e) => setFilterYear(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl text-sm font-semibold bg-blue-100 text-blue-800 border-2 border-blue-200 shadow-sm transition-all duration-300
           focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-200"
                  >
                    <option value="">All Years</option>
                    {[
                      ...new Set(
                        tickets.map((t) => new Date(t.createdAt).getFullYear())
                      ),
                    ]
                      .sort((a, b) => b - a)
                      .map((year) => (
                        <option key={year} value={year}>
                          {year}
                        </option>
                      ))}
                  </select>
                  <button className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-4 py-2 rounded-xl font-semibold hover:from-blue-600 hover:to-blue-700 transition-all duration-300 shadow-md hover:shadow-lg transform hover:scale-105 text-sm">
                    Apply Filters
                  </button>
                </div>
              </div>

              {/* Tickets List - Horizontal Layout */}
              <div className="space-y-3">
                {tickets
                  .slice()
                  .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
                  .filter((ticket) => {
                    const created = new Date(ticket.createdAt);
                    const ticketDate = created.toISOString().slice(0, 10);
                    const ticketMonth = String(created.getMonth() + 1).padStart(
                      2,
                      "0"
                    );
                    const ticketYear = String(created.getFullYear());

                    // Week filtering logic
                    let weekMatch = true;
                    if (filterThisWeek) {
                      const today = new Date();
                      const startOfWeek = new Date(
                        today.setDate(today.getDate() - today.getDay())
                      ); // Start of the week (Sunday)
                      const endOfWeek = new Date(
                        startOfWeek.getTime() + 6 * 24 * 60 * 60 * 1000
                      ); // End of the week (Saturday)
                      weekMatch =
                        created >= startOfWeek && created <= endOfWeek;
                    }

                    return (
                      (!filterDate || ticketDate === filterDate) &&
                      (!filterMonth || ticketMonth === filterMonth) &&
                      (!filterYear || ticketYear === filterYear) &&
                      weekMatch
                    );
                  })
                  .map((ticket, idx) => (
                    <div
                      key={ticket._id || idx}
                      className={
                        "group relative bg-gradient-to-r from-white to-blue-50 border-2 border-blue-100 rounded-2xl shadow-md hover:shadow-lg transition-all duration-300 overflow-hidden hover:scale-[1.01] hover:border-blue-200 py-3 flex h-auto" +
                        (highlightedTicket === ticket._id
                          ? " ring-4 ring-blue-400 border-blue-400"
                          : "")
                      }
                    >
                      {/* Hover shimmer effect */}
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-blue-50 to-transparent opacity-0 group-hover:opacity-30 transform translate-x-[-100%] group-hover:translate-x-[100%] transition-all duration-1000"></div>

                      <div className="relative px-6 flex-1">
                        {/* Horizontal Layout */}
                        <div className="flex items-stretch justify-between gap-6">
                          {/* Left: Ticket Number and Date */}
                          <div className="flex items-center space-x-4 min-w-0 flex-shrink-0">
                            <div className="bg-gradient-to-br from-blue-400 to-blue-500 text-white p-2 rounded-xl shadow-sm">
                              <svg
                                className="w-4 h-4"
                                fill="currentColor"
                                viewBox="0 0 20 20"
                              >
                                <path
                                  fillRule="evenodd"
                                  d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z"
                                  clipRule="evenodd"
                                />
                              </svg>
                            </div>
                            <div>
                              <span className="text-lg font-bold bg-gradient-to-r from-blue-600 to-blue-700 bg-clip-text text-transparent">
                                {ticket.ticketNumber}
                              </span>
                              <div className="text-xs text-slate-500 font-medium">
                                <span className="font-semibold">Date: </span>
                                {ticket.createdAt
                                  ? new Date(
                                      ticket.createdAt
                                    ).toLocaleDateString()
                                  : "-"}
                                {ticket.createdAt && (
                                  <span className="ml-2">
                                    {new Date(
                                      ticket.createdAt
                                    ).toLocaleTimeString([], {
                                      hour: "2-digit",
                                      minute: "2-digit",
                                    })}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Center: Customer Info */}
                          <div className="flex-1 bg-gradient-to-br from-blue-50 to-blue-100 p-3 rounded-xl border border-blue-150 min-w-0 flex flex-col">
                            <div className="flex items-center mb-1">
                              <svg
                                className="w-3 h-3 text-blue-500 mr-1"
                                fill="currentColor"
                                viewBox="0 0 20 20"
                              >
                                <path
                                  fillRule="evenodd"
                                  d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                                  clipRule="evenodd"
                                />
                              </svg>
                              <span className="text-xs font-semibold text-blue-700">
                                Customer Information
                              </span>
                            </div>
                            <div className="flex-1 flex flex-col justify-evenly">
                              <p className="text-sm text-blue-800">
                                <span className="font-semibold">Name: </span>
                                <span className="break-words">
                                  {ticket.customerName}
                                </span>
                              </p>
                              <p className="text-sm text-blue-800">
                                <span className="font-semibold">Phone: </span>
                                <span className="break-words">
                                  {ticket.customerPhoneNumber || "-"}
                                </span>
                              </p>
                              {ticket.customerEmail && (
                                <p className="text-sm text-blue-800">
                                  <span className="font-semibold">Email: </span>
                                  <span className="break-words">
                                    {ticket.customerEmail}
                                  </span>
                                </p>
                              )}
                              <p className="text-sm text-blue-800">
                                <span className="font-semibold">Source: </span>
                                <span className="break-words">
                                  {ticket.sourceType === "Others" &&
                                  ticket.otherModeText
                                    ? `Others (${ticket.otherModeText})`
                                    : ticket.sourceType}
                                </span>
                              </p>
                            </div>
                          </div>

                          {/* Right: Ticket Details */}
                          <div className="flex-1 bg-gradient-to-br from-blue-50 to-blue-100 p-3 rounded-xl border border-blue-150 min-w-0 flex flex-col">
                            <div className="flex items-center mb-1">
                              <svg
                                className="w-3 h-3 text-blue-500 mr-1"
                                fill="currentColor"
                                viewBox="0 0 20 20"
                              >
                                <path
                                  fillRule="evenodd"
                                  d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z"
                                  clipRule="evenodd"
                                />
                              </svg>
                              <span className="font-semibold text-blue-700 text-xs">
                                Ticket Details
                              </span>
                            </div>
                            <div className="space-y-1 flex-1">
                              {ticket.department && (
                                <div>
                                  <span className="font-semibold text-blue-800 text-sm">
                                    Department:{" "}
                                  </span>
                                  <span className="text-blue-800 text-sm break-words">
                                    {ticket.department}
                                  </span>
                                </div>
                              )}
                              <div>
                                <span className="font-semibold text-blue-800 text-sm">
                                  Category:{" "}
                                </span>
                                <span className="text-blue-800 text-sm break-words">
                                  {ticket.categoryName || "-"}
                                </span>
                              </div>
                              <div>
                                <span className="font-semibold text-blue-800 text-sm">
                                  Module:{" "}
                                </span>
                                <span className="text-blue-800 text-sm break-words">
                                  {ticket.moduleName || "-"}
                                </span>
                              </div>
                              <div>
                                <span className="font-semibold text-blue-800 text-sm">
                                  Description:{" "}
                                </span>
                                <span className="text-blue-800 text-sm leading-relaxed break-words">
                                  {ticket.description || "-"}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>
      </ReactModal>
    </>
  );
}
