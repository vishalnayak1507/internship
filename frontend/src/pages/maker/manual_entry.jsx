"use client";
import axios from "axios";
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { Formik, Form } from "formik";
import * as Yup from "yup";
import Header from "../../components/common/Header";
// import Card from "../../components/Card";
import FieldArea from "../../components/maker/FieldArea";
import FieldSelect from "../../components/maker/FieldSelect";
import ReactModal from "react-modal";
import { countryCodes } from "@/lib/countryCodes";
import MainLayout from "../../components/common/MainLayout";
import TicketForm from "../../components/analyst/TicketForm";

// Custom styles for dropdown options
const customSelectStyles = `
  select option {
    background-color: #EBF5FF !important; /* very light blue background */
    color: #000 !important; /* black text - ensure no gray */
    border-bottom: 1px solid #dbeafe;
    padding: 8px;
  }
  
  select option:checked {
    background-color: #EBF5FF !important; /* no highlighting for selected item */
    color: #000 !important; /* black text for selected item */
    font-weight: normal !important; /* no bold for selected */
  }
  
  select option:hover {
    background-color: #3B82F6 !important; /* blue on hover */
    color: white !important;
  }
  
  select:focus {
    border-color: #3B82F6 !important;
    box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.25) !important;
  }
  
  /* Ensure select elements themselves have black text */
  select {
    color: #000 !important;
  }
`;

const validationSchema = Yup.object().shape({
  customerId: Yup.string()
    .max(15, "Customer ID cannot exceed 15 characters"),
  customerName: Yup.string()
    .max(50, "Customer Name cannot exceed 50 characters")
    .required("Customer name is required"),
  customerPhoneNumber: Yup.string()
    .required("Phone number is required")
    .test(
      "len",
      "Phone number must be exactly 10 digits",
      (val) => val && val.replace(/\D/g, "").length === 10
    ),
  customerEmail: Yup.string()
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
  // department: Yup.string().required("Department is required"),
});

export default function CreateTicket() {
  //if any new hook then use
  const navigate = useNavigate();
  const [user, setUser] = useState({ id: "", name: "", role: "Maker" });
  const [showModal, setShowModal] = useState(false);
  const [tickets, setTickets] = useState([]);
  const [loadingTickets, setLoadingTickets] = useState(false);
  const [countryCode, setCountryCode] = useState("+91"); // Default to India
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
  const [showCustomerNameDropdown, setShowCustomerNameDropdown] = useState(false);

  //same
  useEffect(() => {
    const maker_route = async () => {
      try {
        const response = await axios.get(
          "http://localhost:8000/api/auth/manualentry",
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
  //mine
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await axios.get(
          "http://localhost:8000/api/auth/manualentry",
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
    // Ensure all required departments are available, plus any from ticketmasters
    // const requiredDepartments = ["YONO", "SCFU", "CMP", "GLS"];
    // TODO: Fetch departments from backend instead of hardcoding
    // Example:
    // useEffect(() => {
    //   axios.get("http://localhost:8000/api/departments").then(res => {
    //     if (res.data && res.data.success) {
    //       setDepartments(res.data.departments);
    //     }
    //   });
    // }, []);
    const fromTicketMasters = new Set(ticketmasters.map((item) => item.department));
    
    // Combine required departments with any unique ones from ticketmasters
    const allDepartments = [
      ...requiredDepartments,
      ...Array.from(fromTicketMasters).filter(dept => !requiredDepartments.includes(dept))
    ];
    
    setDepartments(allDepartments);
  }, [ticketmasters]);

  const initialValues = {
    customerID: "",
    customerName: "",
    customerPhoneNumber: "",
    customerEmail: "",
    mode: "",
    categoryName: "",
    moduleName: "",
    description: "",
    department: "",
    otherModeText: "",
  };

  //same
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
        "http://localhost:8000/api/auth/manualentry",
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
          <button
            className="underline text-blue-700 ml-2"
            onClick={async () => {
              await fetchMyTickets();
              setShowModal(true);
              setHighlightedTicket(newTicketId);
              setTimeout(() => setHighlightedTicket(null), 5000); // Remove highlight after 5 seconds
            }}
          >
            View Ticket
          </button>
        </div>,
        {
          position: "top-right",
          autoClose: 3000,
          closeOnClick: true,
          pauseOnHover: true,
        }
      );
      resetForm();
    } catch (err) {
      toast.error("Error creating ticket. Try again.", {
        position: "top-right",
        autoClose: 3000,
      });
    } finally {
      setLoading(false); // <-- Always set loading to false here
    }
  };
  //yours
  const fetchMyTickets = async () => {
    setLoadingTickets(true);
    try {
      const res = await axios.get("http://localhost:8000/api/auth/my-tickets", {
        withCredentials: true,
      });
      setTickets(res.data.tickets);
    } catch (err) {
      setTickets([]);
    } finally {
      setLoadingTickets(false);
    }
  };
  //yours
  const openModal = async () => {
    await fetchMyTickets();
    setShowModal(true);
  };
  //yours
  const closeModal = () => {
    setShowModal(false);
    setHighlightedTicket(null); // Remove highlight when modal closes
  };

  return (
    //mine
    <MainLayout showModal={showModal} onMyTickets={openModal}>
      <div className="flex flex-col">
        <div className="flex flex-1 min-h-0">
          <div className="flex-1 flex flex-col min-h-screen">
            <ToastContainer />

            <div className="flex-1 flex items-start justify-center  mt-[-45px] mb-2">
              <Card
                className="flex-[1_1_0%] max-w-5xl p-14 m-14 shadow-xl rounded-2xl"
                style={{ minHeight: 0 }}
              >
                <div className="text-[25px] font-semibold text-blue-800 mb-2">
                  Create New Ticket
                </div>
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
              </Card>
            </div>              {/* Add custom style for select dropdowns */}
              <style>{customSelectStyles}</style>

              <ReactModal
              isOpen={showModal}
              onRequestClose={closeModal}
              ariaHideApp={false}
              style={{
                overlay: {
                  backgroundColor: "rgba(0, 0, 0, 0.5)",
                  backdropFilter: "blur(4px)",
                  zIndex: 1000,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                },
                content: {
                  position: "relative",
                  inset: "auto",
                  border: "none",
                  background: "#ffffff",
                  borderRadius: "12px",
                  padding: "0",
                  maxWidth: "95vw",
                  maxHeight: "90vh",
                  width: "1200px",
                  overflow: "hidden",
                  boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 0 10px -5px rgba(0, 0, 0, 0.04)",
                  transform: "scale(0.95)",
                  animation: "modalOpen 0.3s ease-out forwards",
                },
              }}
            >
              <style jsx>{`
                @keyframes modalOpen {
                  0% {
                    opacity: 0;
                    transform: scale(0.98);
                  }
                  100% {
                    opacity: 1;
                    transform: scale(1);
                  }
                }
                
                .animation-delay-150 {
                  animation-delay: 0.15s;
                }
              `}</style>

              {/* Clean white background */}
              <div className="absolute inset-0 bg-gray-50"></div>

              {/* Header Section - Simple border bottom */}
              <div className="relative bg-white border-b border-gray-200 p-6">
                <div className="flex items-center justify-between text-gray-800">
                  <div className="flex items-center space-x-4">
                    <div className="bg-blue-500 p-3 rounded-full">
                      <svg
                        className="w-7 h-7 text-white"
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
                      <h2 className="text-3xl font-bold tracking-tight text-blue-600">
                        My Tickets
                      </h2>
                      <div className="flex items-center mt-1.5">
                        <span
                          className="bg-blue-500 px-4 py-1.5 rounded-full text-sm font-semibold text-white"
                          id="ticketCount"
                        >
                          {(() => {
                            const filteredTickets = tickets.filter((ticket) => {
                              const created = new Date(ticket.createdAt);
                              const ticketDate = created
                                .toISOString()
                                .slice(0, 10);
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
                                  (created >= startOfWeek &&
                                    created <= endOfWeek)) // Filter only if "This Week" is active
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
                    onClick={closeModal}
                    className="group bg-gradient-to-r from-blue-500 to-indigo-500 p-2.5 rounded-full transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105"
                    aria-label="Close"
                  >
                    <svg
                      className="w-5 h-5 text-white group-hover:rotate-90 transition-transform duration-300"
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
              <div className="relative bg-white max-h-[calc(90vh-120px)] overflow-y-auto">
                {loadingTickets ? (
                  <div className="flex flex-col items-center justify-center py-20">
                    <div className="mb-8">
                      <div className="w-16 h-16 border-4 border-gray-200 border-t-blue-500 rounded-full animate-spin"></div>
                    </div>
                    <div className="text-xl font-semibold text-blue-600 mb-3">
                      Loading Your Tickets...
                    </div>
                    <div className="text-blue-500 bg-blue-50 px-4 py-2 rounded-md">
                      Please wait while we fetch your data
                    </div>
                  </div>
                ) : tickets.length === 0 ? (
                  <div className="text-center py-20">
                    <div className="bg-blue-100 w-24 h-24 rounded-lg flex items-center justify-center mx-auto mb-8">
                      <svg
                        className="w-12 h-12 text-blue-500"
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
                    <h3 className="text-2xl font-bold text-blue-600 mb-4">
                      No Tickets Found
                    </h3>
                    <p className="text-gray-600 max-w-md mx-auto bg-gray-100 px-6 py-3 rounded-md inline-block">
                      You don't have any support tickets yet. When you create
                      one, it will appear here.
                    </p>
                  </div>
                ) : (
                  <div className="p-6">                    {/* Simplified Filter Bar */}
                    <div className="bg-blue-50 rounded-md border border-gray-200 p-5 mb-6">
                      <div className="relative">
                        <div className="flex items-center mb-4">
                          <div className="bg-blue-500 p-2 rounded-md mr-3">
                            <svg
                              className="w-5 h-5 text-white"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path
                                fillRule="evenodd"
                                d="M3 3a1 1 0 011-1h12a1 1 0 011 1v3a1 1 0 01-.293.707L12 11.414V15a1 1 0 01-.293.707l-2 2A1 1 0 018 17v-5.586L3.293 6.707A1 1 0 013 6V3z"
                                clipRule="evenodd"
                              />
                            </svg>
                          </div>
                          <div>
                            <h3 className="text-lg font-semibold text-blue-600">
                              Filter Tickets
                            </h3>
                            <p className="text-xs text-gray-500 mt-0.5">
                              Filter tickets by date, week, month or year
                            </p>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                          <div>
                            <label className="block text-xs font-bold text-blue-800 mb-1 ml-1">
                              Filter by specific date
                            </label>
                            <div className="relative">
                              <input
                                type="date"
                                value={filterDate}
                                onChange={(e) => setFilterDate(e.target.value)}
                                className="w-full px-3 py-2 rounded-md text-sm border border-gray-300
                                bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                                placeholder="Filter by Date"
                              />
                              {filterDate && (
                                <button 
                                  onClick={() => setFilterDate("")} 
                                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                  title="Clear date filter"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                                  </svg>
                                </button>
                              )}
                            </div>
                          </div>
                          
                          <div>
                            <label className="block text-xs font-bold text-blue-800 mb-1 ml-1">
                              Quick filter
                            </label>
                            <button
                              onClick={() => setFilterThisWeek((prev) => !prev)}
                              className={`w-full px-3 py-2 rounded-md text-sm border transition-colors
                                ${filterThisWeek 
                                  ? "bg-blue-500 border-blue-500 text-white font-medium" 
                                  : "bg-white border-blue-200 text-black"}`}
                            >
                              {filterThisWeek
                                ? "Show All Tickets"
                                : "This Week"}
                            </button>
                          </div>
                          
                          <div>
                            <label className="block text-xs font-bold text-blue-800 mb-1 ml-1">
                              Filter by month
                            </label>                              <div className="relative">
                              <select
                                value={filterMonth}
                                onChange={(e) => setFilterMonth(e.target.value)}
                                className="w-full px-3 py-2 rounded-md text-sm border border-blue-200
                                bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 appearance-none"
                                style={{color: '#000'}}
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
                              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-blue-500">
                                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd"></path>
                                </svg>
                              </div>
                            </div>
                          </div>
                          
                          <div>
                            <label className="block text-xs font-bold text-blue-800 mb-1 ml-1">
                              Filter by year
                            </label>                              <div className="relative">
                              <select
                                value={filterYear}
                                onChange={(e) => setFilterYear(e.target.value)}
                                className="w-full px-3 py-2 rounded-md text-sm border border-blue-200
                                bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 appearance-none"
                                style={{color: '#000'}}
                              >
                                <option value="">All Years</option>
                                {[
                                  ...new Set(
                                    tickets.map((t) =>
                                      new Date(t.createdAt).getFullYear()
                                    )
                                  ),
                                ]
                                  .sort((a, b) => b - a)
                                  .map((year) => (
                                    <option key={year} value={year}>
                                      {year}
                                    </option>
                                  ))}
                              </select>
                              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-blue-500">
                                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd"></path>
                                </svg>
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        {/* Applied filters display */}
                        {(filterDate || filterMonth || filterYear || filterThisWeek) && (
                          <div className="mt-4 flex flex-wrap gap-2">
                            {filterDate && (
                              <div className="bg-blue-50 text-gray-700 text-xs px-3 py-1.5 rounded-md border border-blue-200 flex items-center">
                                <span>Date: {filterDate}</span>
                                <button onClick={() => setFilterDate("")} className="ml-2 text-blue-500 hover:text-blue-700">
                                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                                  </svg>
                                </button>
                              </div>
                            )}
                            {filterMonth && (
                              <div className="bg-blue-50 text-gray-700 text-xs px-3 py-1.5 rounded-md border border-blue-200 flex items-center">
                                <span>Month: {new Date(0, parseInt(filterMonth) - 1).toLocaleString("default", { month: "long" })}</span>
                                <button onClick={() => setFilterMonth("")} className="ml-2 text-blue-500 hover:text-blue-700">
                                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                                  </svg>
                                </button>
                              </div>
                            )}
                            {filterYear && (
                              <div className="bg-blue-50 text-gray-700 text-xs px-3 py-1.5 rounded-md border border-blue-200 flex items-center">
                                <span>Year: {filterYear}</span>
                                <button onClick={() => setFilterYear("")} className="ml-2 text-blue-500 hover:text-blue-700">
                                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                                  </svg>
                                </button>
                              </div>
                            )}
                            {filterThisWeek && (
                              <div className="bg-blue-50 text-gray-700 text-xs px-3 py-1.5 rounded-md border border-blue-200 flex items-center">
                                <span>This Week Only</span>
                                <button onClick={() => setFilterThisWeek(false)} className="ml-2 text-blue-500 hover:text-blue-700">
                                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                                  </svg>
                                </button>
                              </div>
                            )}
                            
                            {(filterDate || filterMonth || filterYear || filterThisWeek) && (
                              <button 
                                onClick={() => {
                                  setFilterDate("");
                                  setFilterMonth("");
                                  setFilterYear("");
                                  setFilterThisWeek(false);
                                }}
                                className="text-xs bg-blue-100 hover:bg-blue-200 text-blue-700 px-3 py-1.5 rounded-md transition-colors"
                              >
                                Clear All Filters
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Tickets List - Horizontal Layout */}
                    <div className="space-y-3">
                      {(() => {
                        const filteredTickets = tickets
                          .slice()
                          .sort(
                            (a, b) =>
                              new Date(b.createdAt) - new Date(a.createdAt)
                          )
                          .filter((ticket) => {
                            const created = new Date(ticket.createdAt);
                            const ticketDate = created.toISOString().slice(0, 10);
                            const ticketMonth = String(
                              created.getMonth() + 1
                            ).padStart(2, "0");
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
                          });
                          
                        // Check if we have any filtered tickets
                        const hasFilters = filterDate || filterMonth || filterYear || filterThisWeek;
                        
                        if (filteredTickets.length === 0 && hasFilters) {
                          return (
                            <div className="bg-blue-50 border border-blue-200 rounded-md p-8 text-center">                              
                              <div className="bg-blue-100 w-16 h-16 mx-auto mb-5 rounded-md flex items-center justify-center">
                                <svg className="w-8 h-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                                </svg>
                              </div>
                              
                              <h3 className="text-xl font-semibold text-blue-600 mb-3">
                                No tickets match your filters
                              </h3>
                              
                              <div className="max-w-md mx-auto">
                                <p className="text-gray-600 mb-5">
                                  Try adjusting your filter criteria to see more results.
                                </p>
                                
                                <button 
                                  onClick={() => {
                                    setFilterDate("");
                                    setFilterMonth("");
                                    setFilterYear("");
                                    setFilterThisWeek(false);
                                  }}
                                  className="text-sm bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md transition-colors"
                                >
                                  Clear All Filters
                                </button>
                              </div>
                            </div>
                          );
                        }
                        
                        return filteredTickets.map((ticket, idx) => (
                          <div
                            key={ticket._id || idx}
                            className={
                              "relative bg-white border border-gray-200 rounded-md shadow-sm hover:shadow transition-all duration-200 overflow-hidden py-4 flex h-auto" +
                              (highlightedTicket === ticket._id
                                ? " border-blue-400 ring-1 ring-blue-400"
                                : "")
                            }
                          >
                            {/* Left border indicator */}
                            <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500"></div>

                            <div className="relative px-5 flex-1">
                              {/* Horizontal Layout */}
                              <div className="flex items-stretch justify-between gap-6 flex-col md:flex-row">
                                {/* Left: Ticket Number and Date */}
                                <div className="flex items-center space-x-3 min-w-0 flex-shrink-0 mb-2 md:mb-0">
                                  <div className="bg-blue-500 p-2 rounded-md">
                                    <svg
                                      className="w-6 h-6 text-white"
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
                                    <span className="text-lg font-bold text-blue-600 block">
                                      {ticket.ticketNumber}
                                    </span>
                                    <div className="text-xs text-gray-500 flex items-center mt-0.5">
                                      <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd"></path>
                                      </svg>
                                      <span>
                                        {ticket.createdAt
                                          ? new Date(ticket.createdAt).toLocaleDateString()
                                          : "-"} {ticket.createdAt && (
                                          <span className="ml-1 text-gray-400">
                                            {new Date(ticket.createdAt).toLocaleTimeString([], {
                                              hour: "2-digit",
                                              minute: "2-digit",
                                            })}
                                          </span>
                                        )}
                                      </span>
                                    </div>
                                  </div>
                                </div>

                                {/* Center: Customer Info */}
                                <div className="flex-1 bg-blue-50 p-3 rounded-md min-w-0 flex flex-col">
                                  <div className="flex items-center mb-2">
                                    <div className="bg-blue-100 p-1 rounded-md mr-2">
                                      <svg
                                        className="w-3 h-3 text-blue-600"
                                        fill="currentColor"
                                        viewBox="0 0 20 20"
                                      >
                                        <path
                                          fillRule="evenodd"
                                          d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                                          clipRule="evenodd"
                                        />
                                      </svg>
                                    </div>
                                    <span className="text-xs font-semibold text-gray-700">
                                      Customer Information
                                    </span>
                                  </div>
                                  <div className="flex-1 flex flex-col justify-evenly space-y-1">
                                    <div className="flex">
                                      <span className="font-bold text-gray-700 text-sm w-16 flex-shrink-0">
                                        Name:
                                      </span>
                                      <span className="text-gray-700 text-sm break-words flex-1">
                                        {ticket.customerName}
                                      </span>
                                    </div>
                                    <div className="flex">
                                      <span className="font-bold text-gray-700 text-sm w-16 flex-shrink-0">
                                        Phone:
                                      </span>
                                      <span className="text-gray-700 text-sm break-words flex-1">
                                        {ticket.customerPhoneNumber || "-"}
                                      </span>
                                    </div>
                                    {ticket.customerEmail && (
                                      <div className="flex">
                                        <span className="font-bold text-gray-700 text-sm w-16 flex-shrink-0">
                                          Email:
                                        </span>
                                        <span className="text-gray-700 text-sm break-words flex-1">
                                          {ticket.customerEmail}
                                        </span>
                                      </div>
                                    )}
                                    <div className="flex">
                                      <span className="font-bold text-gray-700 text-sm w-16 flex-shrink-0">
                                        Source:
                                      </span>
                                      <span className="text-gray-700 text-sm break-words flex-1">
                                        {ticket.sourceType === "Others" && ticket.otherModeText
                                          ? `Others (${ticket.otherModeText})`
                                          : ticket.sourceType}
                                      </span>
                                    </div>
                                  </div>
                                </div>

                                {/* Right: Ticket Details */}
                                <div className="flex-1 bg-blue-50 p-3 rounded-md min-w-0 flex flex-col">
                                  <div className="flex items-center mb-2">
                                    <div className="bg-blue-100 p-1 rounded-md mr-2">
                                      <svg
                                        className="w-3 h-3 text-blue-600"
                                        fill="currentColor"
                                        viewBox="0 0 20 20"
                                      >
                                        <path
                                          fillRule="evenodd"
                                          d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z"
                                          clipRule="evenodd"
                                        />
                                      </svg>
                                    </div>
                                    <span className="text-xs font-semibold text-gray-700">
                                      Ticket Details
                                    </span>
                                  </div>
                                  <div className="space-y-1 flex-1">
                                    {ticket.department && (
                                      <div className="flex">
                                        <span className="font-bold text-gray-700 text-sm w-24 flex-shrink-0">
                                          Department:
                                        </span>
                                        <span className="text-gray-700 text-sm break-words flex-1">
                                          {ticket.department}
                                        </span>
                                      </div>
                                    )}
                                    <div className="flex">
                                      <span className="font-bold text-gray-700 text-sm w-24 flex-shrink-0">
                                        Category:
                                      </span>
                                      <span className="text-gray-700 text-sm break-words flex-1">
                                        {ticket.categoryName || "-"}
                                      </span>
                                    </div>
                                    <div className="flex">
                                      <span className="font-bold text-gray-700 text-sm w-24 flex-shrink-0">
                                        Module:
                                      </span>
                                      <span className="text-gray-700 text-sm break-words flex-1">
                                        {ticket.moduleName || "-"}
                                      </span>
                                    </div>
                                    <div className="flex">
                                      <span className="font-bold text-gray-700 text-sm w-24 flex-shrink-0 self-start mt-0.5">
                                        Description:
                                      </span>
                                      <span className="text-gray-700 text-sm leading-relaxed break-words flex-1">
                                        {ticket.description || "-"}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        ));
                      })()}
                    </div>
                  </div>
                )}
              </div>
            </ReactModal>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
