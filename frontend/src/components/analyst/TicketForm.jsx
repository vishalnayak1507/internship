import React, { useEffect, useState } from "react";
import axios from "axios";
import { Formik, Form } from "formik";
import FieldArea from "../maker/FieldArea";
import FieldSelect from "../maker/FieldSelect";
import { countryCodes } from "../../lib/countryCodes";

const modeOptions = ["Call", "Email", "Message", "Others"];
const countryCodeOptions = countryCodes.map((opt) => ({
  value: opt.code,
  label: `${opt.code} ${opt.label}`,
}));

export default function TicketForm({
  initialValues,
  validationSchema,
  onSubmit,
  ticketmasters,
  userRole,
  user,
  departments,
  setDepartments,
  loading,
  countryCode,
  setCountryCode,
  ...props
}) {
  const [categoryOptions, setCategoryOptions] = useState([]);
  const [moduleOptions, setModuleOptions] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [showCustomerIdDropdown, setShowCustomerIdDropdown] = useState(false);
  const [showCustomerNameDropdown, setShowCustomerNameDropdown] = useState(false);
  const [isDropdownSelection, setIsDropdownSelection] = useState(false);

  // Extract unique departments if needed
  useEffect(() => {
    // Always fetch departments from backend for superadmin and maker
    const fetchDepartments = async () => {
      if (userRole === "superadmin" || userRole === "maker") {
        try {
          const response = await axios.get("http://localhost:8000/api/departments");
          if (response.data && response.data.success && Array.isArray(response.data.departments)) {
            // Filter out duplicates and falsy values
            const uniqueDepartments = Array.from(new Set(response.data.departments.filter(Boolean)));
            setDepartments(uniqueDepartments);
          } else {
            setDepartments([]);
          }
        } catch (err) {
          setDepartments([]);
        }
      } else if (user && user.department) {
        setDepartments([user.department]);
      }
    };
    fetchDepartments();
  }, [userRole, user, setDepartments]);

  // Customer search handler
  const handleSearch = async (searchTerm, field) => {
    try {
      const query =
        field === "customerId"
          ? { customerIdentity: { $regex: `^${searchTerm}`, $options: "i" } }
          : { customerIdentity: { $regex: ` - ${searchTerm}`, $options: "i" } };
      const res = await fetch(
        `http://localhost:8000/api/customer/search?q=${encodeURIComponent(searchTerm)}&field=${field}`
      );
      const data = await res.json();
      setSearchResults(data);
    } catch (err) {
      setSearchResults([]);
    }
  };

  return (
    <Formik
      initialValues={initialValues}
      validationSchema={validationSchema}
      onSubmit={onSubmit}
      enableReinitialize
    >
      {({
        values,
        setFieldValue,
        setFieldError,
        errors,
        touched,
        resetForm,
        submitCount,
      }) => {
        // Category and module options logic
        useEffect(() => {
          if (values.department) {
            const categories = [
              ...new Set(
                ticketmasters
                  .filter((item) => item.department === values.department)
                  .map((item) => item.categoryName)
              ),
            ];
            setCategoryOptions(categories);
            setFieldValue("categoryName", "");
            setFieldValue("moduleName", "");
            setModuleOptions([]);
          } else {
            setCategoryOptions([]);
            setModuleOptions([]);
            setFieldValue("categoryName", "");
            setFieldValue("moduleName", "");
          }
          // eslint-disable-next-line
        }, [values.department, ticketmasters]);
        useEffect(() => {
          if (values.department && values.categoryName) {
            const modules = [
              ...new Set(
                ticketmasters
                  .filter(
                    (item) =>
                      item.department === values.department &&
                      item.categoryName === values.categoryName
                  )
                  .map((item) => item.moduleName)
              ),
            ];
            setModuleOptions(modules);
            setFieldValue("moduleName", "");
          } else {
            setModuleOptions([]);
            setFieldValue("moduleName", "");
          }
          // eslint-disable-next-line
        }, [values.categoryName, values.department, ticketmasters]);

        // Dropdown close logic
        useEffect(() => {
          function handleClickOutside(event) {
            if (
              showCustomerIdDropdown &&
              !event.target.closest('[name="customerId"]') &&
              !event.target.closest('[role="listbox"]')
            ) {
              setShowCustomerIdDropdown(false);
            }
            if (
              showCustomerNameDropdown &&
              !event.target.closest('[name="customerName"]') &&
              !event.target.closest('[role="listbox"]')
            ) {
              setShowCustomerNameDropdown(false);
            }
          }
          document.addEventListener("mousedown", handleClickOutside);
          return () =>
            document.removeEventListener("mousedown", handleClickOutside);
        }, [showCustomerIdDropdown, showCustomerNameDropdown]);

        useEffect(() => {
          if (!isDropdownSelection) {
            setFieldValue("customerName", "");
            setFieldValue("customerPhoneNumber", "");
            setFieldValue("customerEmail", "");
            setCountryCode("+91");
          }
          // eslint-disable-next-line
        }, [values.customerId]);

        return (
          <Form className="space-y-6">
            <div className="flex flex-wrap gap-6 justify-between">
              <div className="flex-1 min-w-[30%]">
                <div className="relative">
                  <label className="flex items-center gap-1 font-medium text-gray-700 mb-1" htmlFor="customerId">
                    Customer ID
                  </label>
                  <FieldArea
                    name="customerId"
                    placeholder="Enter Customer ID"
                    value={values.customerId || ""}
                    onChange={(e) => {
                      const searchTerm = e.target.value;
                      setFieldValue("customerId", searchTerm);
                      handleSearch(searchTerm, "customerId");
                      setShowCustomerIdDropdown(true);
                      setShowCustomerNameDropdown(false);
                    }}
                    className="h-10"
                    autoComplete="on"
                    onKeyDown={(e) => {
                      if (
                        e.key === "ArrowDown" && searchResults.length > 0) {
                        e.preventDefault();
                        document.getElementById("customer-result-0")?.focus();
                      } else if (e.key === "Escape") {
                        e.preventDefault();
                        setShowCustomerIdDropdown(false);
                      }
                    }}
                  />
                  {showCustomerIdDropdown && searchResults.length > 0 && (
                    <div
                      className="absolute z-30 w-full mt-1 border rounded-md p-2 bg-white shadow-lg max-h-60 overflow-y-auto"
                      role="listbox"
                    >
                      {searchResults.map((customer, index) => (
                        <div
                          id={`customer-result-${index}`}
                          key={customer.customerIdentity}
                          className="cursor-pointer hover:bg-blue-50 p-2 rounded transition-colors focus:bg-blue-100 focus:outline-none"
                          onClick={() => {
                            setIsDropdownSelection(true);
                            setFieldValue("customerId", customer.customerIdentity.split(" - ")[0]);
                            setFieldValue("customerName", customer.customerIdentity.split(" - ")[1]);
                            setFieldValue("customerPhoneNumber", customer.customerPhoneNumber);
                            setFieldValue("customerEmail", customer.customerEmail);
                            setShowCustomerIdDropdown(false);
                            setTimeout(() => setIsDropdownSelection(false), 0);
                          }}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") {
                              e.preventDefault();
                              setIsDropdownSelection(true);
                              setFieldValue("customerId", customer.customerIdentity.split(" - ")[0]);
                              setFieldValue("customerName", customer.customerIdentity.split(" - ")[1]);
                              setFieldValue("customerPhoneNumber", customer.customerPhoneNumber);
                              setFieldValue("customerEmail", customer.customerEmail);
                              setShowCustomerIdDropdown(false);
                              setTimeout(() => setIsDropdownSelection(false), 0);
                              document.querySelector('input[name="customerId"]')?.focus();
                            } else if (e.key === "ArrowDown") {
                              e.preventDefault();
                              const nextElement = document.getElementById(`customer-result-${index + 1}`);
                              nextElement?.focus();
                            } else if (e.key === "ArrowUp") {
                              e.preventDefault();
                              if (index === 0) {
                                document.querySelector('input[name="customerId"]')?.focus();
                              } else {
                                const prevElement = document.getElementById(`customer-result-${index - 1}`);
                                prevElement?.focus();
                              }
                            } else if (e.key === "Escape") {
                              e.preventDefault();
                              setShowCustomerIdDropdown(false);
                            }
                          }}
                          role="option"
                          tabIndex="0"
                        >
                          <div className="font-medium">{customer.customerIdentity}</div>
                          <div className="text-xs text-gray-500">
                            {customer.customerPhoneNumber} • {customer.customerEmail || "No email"}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <div className="flex-1 min-w-[30%]">
                <div className="relative">
                  <FieldArea
                    label="Customer Name"
                    name="customerName"
                    placeholder="Enter Customer Name"
                    value={values.customerName || ""}
                    required
                    onChange={(e) => {
                      const searchTerm = e.target.value;
                      setFieldValue("customerName", searchTerm);
                      handleSearch(searchTerm, "customerName");
                      setShowCustomerNameDropdown(true);
                      setShowCustomerIdDropdown(false);
                    }}
                    className="h-10"
                    autoComplete="on"
                    onKeyDown={(e) => {
                      if (e.key === "ArrowDown" && searchResults.length > 0) {
                        e.preventDefault();
                        document.getElementById("customer-result-0")?.focus();
                      } else if (e.key === "Escape") {
                        e.preventDefault();
                        setShowCustomerNameDropdown(false);
                      }
                    }}
                  />
                  {showCustomerNameDropdown && searchResults.length > 0 && (
                    <div
                      className="absolute z-30 w-full mt-1 border rounded-md p-2 bg-white shadow-lg max-h-60 overflow-y-auto"
                      role="listbox"
                    >
                      {searchResults.map((customer, index) => (
                        <div
                          id={`customer-result-${index}`}
                          key={customer.customerIdentity}
                          className="cursor-pointer hover:bg-blue-50 p-2 rounded transition-colors focus:bg-blue-100 focus:outline-none"
                          onClick={() => {
                            setIsDropdownSelection(true);
                            setFieldValue("customerId", customer.customerIdentity.split(" - ")[0]);
                            setFieldValue("customerName", customer.customerIdentity.split(" - ")[1]);
                            setFieldValue("customerPhoneNumber", customer.customerPhoneNumber);
                            setFieldValue("customerEmail", customer.customerEmail);
                            setShowCustomerNameDropdown(false);
                            setTimeout(() => setIsDropdownSelection(false), 0);
                          }}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") {
                              e.preventDefault();
                              setIsDropdownSelection(true);
                              setFieldValue("customerId", customer.customerIdentity.split(" - ")[0]);
                              setFieldValue("customerName", customer.customerIdentity.split(" - ")[1]);
                              setFieldValue("customerPhoneNumber", customer.customerPhoneNumber);
                              setFieldValue("customerEmail", customer.customerEmail);
                              setShowCustomerNameDropdown(false);
                              setTimeout(() => setIsDropdownSelection(false), 0);
                              document.querySelector('input[name="customerName"]')?.focus();
                            } else if (e.key === "ArrowDown") {
                              e.preventDefault();
                              const nextElement = document.getElementById(`customer-result-${index + 1}`);
                              nextElement?.focus();
                            } else if (e.key === "ArrowUp") {
                              e.preventDefault();
                              if (index === 0) {
                                document.querySelector('input[name="customerName"]')?.focus();
                              } else {
                                const prevElement = document.getElementById(`customer-result-${index - 1}`);
                                prevElement?.focus();
                              }
                            } else if (e.key === "Escape") {
                              e.preventDefault();
                              setShowCustomerNameDropdown(false);
                            }
                          }}
                          role="option"
                          tabIndex="0"
                        >
                          <div className="font-medium">
                            {customer.customerIdentity}
                          </div>
                          <div className="text-xs text-gray-500">
                            {customer.customerPhoneNumber} • {customer.customerEmail || "No email"}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <div className="flex-1 min-w-[30%]">
                <FieldSelect
                  label="Query Mode"
                  name="mode"
                  value={values.mode}
                  onChange={(val) => setFieldValue("mode", val)}
                  options={modeOptions.map((opt) => ({
                    value: opt,
                    label: opt,
                  }))}
                  required
                  selectClassName="h-10"
                />
                {touched.mode && errors.mode && (
                  <div className="text-red-500 text-xs mt-1">
                    {errors.mode}
                  </div>
                )}
                {values.mode === "Others" && (
                  <div>
                    <FieldArea
                      name="otherModeText"
                      label={
                        <span>
                          Please specify{" "}
                          <span className="text-red-600">*</span> 
                        </span>
                      }
                      maxLength={30}
                      placeholder="Enter short description"
                      rows={1}
                      value={values.otherModeText}
                      onChange={(e) => {
                        const val = e.target.value;
                        setFieldValue("otherModeText", val);
                        if (val.length > 30) {
                          setFieldError(
                            "otherModeText",
                            "Mode cannot exceed 30 characters"
                          );
                        }
                      }}
                      className="h-10"
                    />
                    {errors.otherModeText &&
                      values.otherModeText.length > 30 && (
                        <div className="text-red-500 text-xs mt-1">
                          {errors.otherModeText}
                        </div>
                      )}
                  </div>
                )}
              </div>
            </div>
            <div className="flex flex-row gap-6 justify-between">
              <div className="flex-1 min-w-[0.5%]">
                <div style={{ minWidth: 100, maxWidth: 120 }}>
                  <FieldSelect
                    label="Country Code"
                    value={countryCode}
                    onChange={(val) => setCountryCode(val)}
                    options={countryCodeOptions}
                    required
                    selectClassName="h-10 text-xs py-1 px-1"
                  />
                </div>
              </div>
              <div className="flex-1 min-w-[35%]">
                <FieldArea
                  label="Customer Phone Number"
                  name="customerPhoneNumber"
                  required
                  placeholder="Phone Number"
                  value={values.customerPhoneNumber}
                  onChange={(e) => {
                    const input = e.target;
                    let val = input.value.replace(/\D/g, "");
                    if (values.customerPhoneNumber.length === 10 && val.length > 10) {
                      setFieldError(
                        "customerPhoneNumber",
                        "Phone number is already 10 digits"
                      );
                      return;
                    }
                    if (val.length <= 10) {
                      setFieldValue("customerPhoneNumber", val);
                      if (errors.customerPhoneNumber) {
                        setFieldError("customerPhoneNumber", undefined);
                      }
                    }
                  }}
                  className="h-10"
                />
              </div>
              <div className="flex-1 min-w-[45%]">
                <FieldArea
                  label="Customer Email"
                  name="customerEmail"
                  required
                  type="email"
                  placeholder="Customer Email"
                  value={values.customerEmail}
                  onChange={(e) => {
                    const val = e.target.value;
                    setFieldValue("customerEmail", val);
                    if (val.length > 100) {
                      setFieldError("customerEmail","Customer Email cannot exceed 100 characters");
                    }
                  }}
                  className="h-10"
                />
              </div>
            </div>
            <div className="flex flex-wrap gap-6 justify-between">
              <div className="flex-1 min-w-[30%]">
                {userRole === "superadmin"  || userRole === "maker"? (
                  <FieldSelect
                    label="Department"
                    value={values.department}
                    onChange={(val) => {
                      setFieldValue("department", val);
                    }}
                    options={departments.map((dep) => ({
                      value: dep,
                      label: dep,
                    }))}
                    required
                    selectClassName="h-10"
                  />
                ) : (
                  <FieldArea
                    label="Department"
                    name="department"
                    value={values.department}
                    disabled
                    className="h-10"
                  />
                )}
                {touched.department && errors.department && (
                  <div className="text-red-500 text-xs mt-1">
                    {errors.department}
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-[30%]">
                <FieldSelect
                  label="Category"
                  name="categoryName"
                  value={values.categoryName}
                  onChange={(val) => {
                    setFieldValue("categoryName", val);
                  }}
                  options={categoryOptions.map((opt) => ({
                    value: opt,
                    label: opt,
                  }))}
                  required
                  selectClassName="h-10"
                  disabled={!values.department}
                />
                {touched.categoryName && errors.categoryName && (
                  <div className="text-red-500 text-xs mt-1">
                    {errors.categoryName}
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-[30%]">
                <FieldSelect
                  label="Module"
                  name="categoryModule"
                  value={values.moduleName}
                  onChange={(val) => setFieldValue("moduleName", val)}
                  options={moduleOptions.map((opt) => ({
                    value: opt,
                    label: opt,
                  }))}
                  required
                  disabled={!values.categoryName}
                  selectClassName="h-10"
                />
                {touched.moduleName && errors.moduleName && (
                  <div className="text-red-500 text-xs mt-1">
                    {errors.moduleName}
                  </div>
                )}
              </div>
            </div>
            <FieldArea
              label="Description"
              name="description"
              required
              as="textarea"
              placeholder="Enter Description"
              className="h-48 pb-6"
              value={values.description}
              maxLength={300}
              onChange={(e) => {
                const val = e.target.value;
                setFieldValue("description", val);
                if (val.length > 300) {
                  setFieldError(
                    "description",
                    "Description cannot exceed 300 characters"
                  );
                }
              }}
            />
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={loading}
                className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-md text-sm font-semibold transition-transform duration-200 transform hover:scale-105"
              >
                Create Ticket
              </button>
            </div>
          </Form>
        );
      }}
    </Formik>
  );
}