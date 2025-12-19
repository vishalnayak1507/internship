/* eslint-disable no-unused-vars */
import React, { useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import CreateTicketManualEntry from "../../maker/CreateTicketManualEntry"; // adjust path if needed
import { fetchProfile } from '../../../utils/fetchProfile.js';
import {isSLABreached} from "../../../utils/admin/ticketHelpers";



const TicketFilters = ({
  search,
  setSearch,
  activeFilters,
  setActiveFilters,
  fromDate,
  setFromDate,
  toDate,
  setToDate,
  tickets = [],
  setFilteredTickets,
  onNewTicket, // optional: callback for new ticket button
  rightExtra,  // <-- add this prop
  onRefresh,   // <-- add this prop
}) => {
  // Only time-based filters in the second row
   const [user, setUser] = useState(null);
const [showCreateTicketModal, setShowCreateTicketModal] = useState(false);
const [showTicketsModal, setShowTicketsModal] = useState(false);
  const timeOptions = [
    { value: "today", label: "Today" },
    { value: "week", label: "This Week" },
    { value: "month", label: "This Month" },
    { value: "year", label: "This Year" }
  ];




  // Filtering logic
  useEffect(() => {
    let filtered = [...tickets];

    // If from/to is set, ignore time period buttons
    if (fromDate || toDate) {
      filtered = filtered.filter(ticket => {
        const created = new Date(ticket.creationTime);
        let valid = true;
        if (fromDate) {
          const from = new Date(fromDate);
          from.setHours(0, 0, 0, 0);
          if (created < from) valid = false;
        }
        if (toDate) {
          const to = new Date(toDate);
          to.setHours(23, 59, 59, 999);
          if (created > to) valid = false;
        }
        return valid;
      });
    } else if (activeFilters.time && activeFilters.time.length > 0) {
      // Only one time filter can be active at a time
      const timeFilter = activeFilters.time[0];
      filtered = filtered.filter(ticket => {
        const created = new Date(ticket.creationTime);

        if (timeFilter === "today") {
          // Today: complete current day (midnight to midnight)
          const today = new Date();
          today.setHours(0, 0, 0, 0); // Start of today
          const tomorrow = new Date(today);
          tomorrow.setDate(today.getDate() + 1); // Start of tomorrow
          return created >= today && created < tomorrow;
        } 
        else if (timeFilter === "week") {
          // This Week: Monday through Sunday of current week
          const now = new Date();
          const currentDay = now.getDay(); // 0 = Sunday, 1 = Monday, ...

          // Calculate days to subtract to reach Monday (if Sunday, go back 6 days)
          const daysToMonday = currentDay === 0 ? 6 : currentDay - 1;

          const monday = new Date(now);
          monday.setDate(now.getDate() - daysToMonday);
          monday.setHours(0, 0, 0, 0); // Start of Monday

          const nextMonday = new Date(monday);
          nextMonday.setDate(monday.getDate() + 7); // Start of next Monday

          return created >= monday && created < nextMonday;
        } 
        else if (timeFilter === "month") {
          // This Month: entire current month (1st to last day)
          const now = new Date();
          const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
          firstDay.setHours(0, 0, 0, 0); // Start of 1st day

          const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
          nextMonth.setHours(0, 0, 0, 0); // Start of 1st day of next month

          return created >= firstDay && created < nextMonth;
        } 
        else if (timeFilter === "year") {
          // This Year: entire current year (Jan 1 to Dec 31)
          const now = new Date();
          const firstDay = new Date(now.getFullYear(), 0, 1);
          firstDay.setHours(0, 0, 0, 0); // Start of Jan 1

          const nextYear = new Date(now.getFullYear() + 1, 0, 1);
          nextYear.setHours(0, 0, 0, 0); // Start of Jan 1 next year

          return created >= firstDay && created < nextYear;
        }
        return true;
      });
    }

    // SLA Breached filter using isSLABreached function directly
    if (activeFilters.slaBreached) {
      filtered = filtered.filter(ticket => isSLABreached(ticket));
    }

    // Always sort by SLA deadline ascending (oldest first)
    filtered.sort((a, b) => new Date(b.slaDeadline) - new Date(a.slaDeadline));

    setFilteredTickets && setFilteredTickets(filtered);
    // eslint-disable-next-line
  }, [activeFilters, tickets, fromDate, toDate]);

  useEffect(() => {
  const getProfile = async () => {
    const profile = await fetchProfile();
    setUser(profile);
    console.log('Fetched profile in TicketFilters:', profile);
  };
  getProfile();
}, []);

  return (
    <div className="bg-grey-100 p-3 rounded-xl shadow-md mb-4 border border-gray-200">
      {/* First row: Search (left), New Ticket (right of Refresh), Refresh (right) */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
        {/* Search Box */}
        <div className="min-w-[180px] w-64">
          <Input
            type="text"
            placeholder="Search by Ticket No. or Analyst"
            className="w-full border-gray-300 focus:border-blue-500 text-gray-800 h-8 text-sm"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        {/* Right side: New Ticket and Refresh */}
        <div className="flex items-center gap-2 ml-auto">
          <Button
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-3 py-1.5 rounded text-sm"
            onClick={() => setShowCreateTicketModal(true)}
          >
            + New Ticket
          </Button>
          <Button
            className="flex items-center gap-1 px-3 py-1.5 bg-grey-50 border border-blue-200 rounded-lg text-blue-700 font-semibold hover:bg-blue-100 transition text-sm"
            title="Refresh"
            onClick={onRefresh} // <-- use the prop here
          >
            ⟳ Refresh
          </Button>
          {rightExtra && (
            <div>
              {rightExtra}
            </div>
          )}
        </div>
      </div>
      {/* Second row: Time period (left), SLA Breached (right) */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-slate-800 text-xs font-medium">Time period:</span>
          {timeOptions.map(opt => (
            <Button
              key={opt.value}
              className={`px-2 py-1 rounded text-xs font-semibold border ${activeFilters.time?.[0] === opt.value
                  ? "bg-blue-600 text-white border-blue-600"
                  : "bg-white text-blue-700 border-blue-200 hover:bg-blue-50"
                }`}
              onClick={() => {
                setFromDate("");
                setToDate("");
                setActiveFilters({ ...activeFilters, time: [opt.value] });
              }}
            >
              {opt.label}
            </Button>
          ))}
          <div className="flex items-center gap-1">
            <span className="text-xs text-slate-500 ml-2">From</span>
            <input
              type="date"
              className="border rounded px-2 py-1 text-xs h-7"
              value={fromDate || ""}
              onChange={e => {
                setFromDate(e.target.value);
                setActiveFilters({ ...activeFilters, time: [] });
                // If "toDate" is set and now less than new "fromDate", reset "toDate"
                if (toDate && e.target.value && toDate < e.target.value) {
                  setToDate(e.target.value);
                }
              }}
              max={toDate || undefined} // Prevent picking a "from" after "to"
            />
            <span className="text-xs text-slate-500">to</span>
            <input
              type="date"
              className="border rounded px-2 py-1 text-xs h-7"
              value={toDate || ""}
              onChange={e => {
                // Only allow "to" >= "from"
                if (!fromDate || e.target.value >= fromDate) {
                  setToDate(e.target.value);
                  setActiveFilters({ ...activeFilters, time: [] });
                }
              }}
              min={fromDate || undefined} // Prevent picking a "to" before "from"
            />
          </div>
        </div>
        {/* SLA Breached Button on the right */}
        <div>
          <Button
            className={`px-2 py-1 rounded text-xs font-bold border ${
              activeFilters.slaBreached
                ? "bg-rose-600 text-white border-rose-600"
                : "bg-white text-rose-700 border-rose-200 hover:bg-rose-50"
            }`}
            onClick={() => {
              setActiveFilters({
                ...activeFilters,
                slaBreached: activeFilters.slaBreached ? undefined : true,
              });
            }}
          >
            SLA Breached
          </Button>
        </div>
      </div>
      <CreateTicketManualEntry
  isOpen={showCreateTicketModal}
  onRequestClose={() => setShowCreateTicketModal(false)}
  showTicketsModal={showTicketsModal}
  closeTicketsModal={() => setShowTicketsModal(false)}
  openTicketsModal={() => setShowTicketsModal(true)}
  defaultDepartment={user?.department}
/>
    </div>
  );
};

export default TicketFilters;