/* eslint-disable no-unused-vars */
import React from "react";
import { Button } from "@/components/ui/button";
import { statusStyles, isSLABreached } from "../../../utils/admin/ticketHelpers";

// Define the new status tabs array with "Total Tickets" as the first tab, remove "New"
const statusTabs = ["Total", "Open", "In Progress", "Resolved", "Closed"];

const TicketStatusTabs = ({
  statusFilter,
  setStatusFilter,
  tickets = [],
  filteredTickets = [],
  timeRange = null,
  activeFilters = {},
  search = "",
}) => {
  // Calculate time ranges for the active filter
  const getTimeRanges = () => {
    // If timeRange is provided directly, use it
    if (timeRange && timeRange.startDate && timeRange.endDate) {
      return timeRange;
    }

    // Default to complete data range if no time filter
    const now = new Date();
    let startDate = new Date(0); // earliest possible date
    let endDate = new Date(8640000000000000); // latest possible date

    // Get time range from the parent component's filtered tickets
    const activeTimeFilter = filteredTickets?.timeFilter;

    if (activeTimeFilter === "today") {
      // Today: complete current day (midnight to midnight)
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      startDate = today;

      const tomorrow = new Date(today);
      tomorrow.setDate(today.getDate() + 1);
      endDate = tomorrow;
    } else if (activeTimeFilter === "week") {
      // This Week: Monday through Sunday
      const currentDay = now.getDay(); // 0 = Sunday, 1 = Monday, ...
      const daysToMonday = currentDay === 0 ? 6 : currentDay - 1;

      const monday = new Date(now);
      monday.setDate(now.getDate() - daysToMonday);
      monday.setHours(0, 0, 0, 0);
      startDate = monday;

      const nextMonday = new Date(monday);
      nextMonday.setDate(monday.getDate() + 7);
      endDate = nextMonday;
    } else if (activeTimeFilter === "month") {
      // This Month: 1st to last day
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
      firstDay.setHours(0, 0, 0, 0);
      startDate = firstDay;

      const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
      nextMonth.setHours(0, 0, 0, 0);
      endDate = nextMonth;
    } else if (activeTimeFilter === "year") {
      // This Year: Jan 1 to Dec 31
      const firstDay = new Date(now.getFullYear(), 0, 1);
      firstDay.setHours(0, 0, 0, 0);
      startDate = firstDay;

      const nextYear = new Date(now.getFullYear() + 1, 0, 1);
      nextYear.setHours(0, 0, 0, 0);
      endDate = nextYear;
    }

    return { startDate, endDate };
  };

  // Get ticket counts based on status and time range - independent of current status filter
  const calculateCounts = () => {
    // Use the time range from parent component
    const { startDate, endDate } = getTimeRanges();

    // Initialize count object
    const counts = {
      New: 0,
      Open: 0,
      "In Progress": 0,
      Resolved: 0,
      Closed: 0,
    };

    // Apply search filter before filtering by SLA breached
    let ticketsToCount = [...tickets];

    // Apply search filter if there is a search term
    if (search && search.trim() !== "") {
      const searchTerm = search.toLowerCase().trim();
      ticketsToCount = ticketsToCount.filter((ticket) => {
        const assignedToName = ticket.assignedTo?.name?.toLowerCase() || "";
        const latestAnalystName = ticket.latestAnalyst?.toLowerCase() || "";
        const ticketNumber = ticket.ticketNumber?.toLowerCase() || "";
        
        return (
          assignedToName.includes(searchTerm) ||
          latestAnalystName.includes(searchTerm) ||
          ticketNumber.includes(searchTerm)
        );
      });
    }

    // Then apply SLA breached filter if active
    if (activeFilters?.slaBreached) {
      ticketsToCount = ticketsToCount.filter((ticket) => isSLABreached(ticket));
    }

    // Count all tickets by status based on appropriate time rules
    ticketsToCount.forEach((ticket) => {
      const createdAt = new Date(ticket.createdAt || ticket.creationTime);
      const lastModified = new Date(
        ticket.lastModifiedAt || ticket.createdAt || ticket.creationTime
      );

      // For "New" tickets - count if created within time range
      if (createdAt >= startDate && createdAt <= endDate) {
        counts.New++;
      }

      // For status-specific counts, check appropriate conditions
      if (ticket.status === "Open" || ticket.status === "In Progress") {
        if (createdAt <= endDate) {
          counts[ticket.status]++;
        }
      }

      if (ticket.status === "Resolved" || ticket.status === "Closed") {
        if (lastModified >= startDate && lastModified <= endDate) {
          counts[ticket.status]++;
        }
      }
    });

    return counts;
  };

  // Calculate counts - this should be independent of current status filter
  const ticketCounts = calculateCounts();

  // Calculate total tickets for the current filter (sum of Open, In Progress, Resolved, Closed)
  const totalTicketsCount =
    (ticketCounts["Open"] || 0) +
    (ticketCounts["In Progress"] || 0) +
    (ticketCounts["Resolved"] || 0) +
    (ticketCounts["Closed"] || 0);

  return (
    <div className="flex flex-col gap-2">
      <div className="grid grid-cols-5 gap-3 w-full">
        {statusTabs.map((status) => {
          let symbol = "📋";
          if (status === "Total") ;
          else if (status === "Open") symbol = "➕";
          else if (status === "In Progress") symbol = "⏳";
          else if (status === "Resolved") symbol = "📋✓";
          else if (status === "Closed") symbol = "✅";

          // Use correct style for "Total"
          const styleClass = statusStyles[status] || statusStyles.Open;

          // Show total count for "Total", otherwise show per-status count
          const countToShow =
            status === "Total"
              ? totalTicketsCount
              : ticketCounts[status] || 0;

          return (
            <Button
              key={status}
              variant="outline"
              className={`flex flex-col items-center justify-center h-16 w-[92%] gap-0.5 ${styleClass}
                transition-all hover:scale-105 border px-2 py-1 rounded-lg
                ${statusFilter === status ? "ring-2 ring-opacity-50 ring-blue-500 scale-105" : ""}`}
              onClick={() => setStatusFilter(status)}
            >
              <div className="flex items-center gap-1">
                <span className="text-base">{symbol}</span>
                <span className="font-bold text-base">{status}</span>
              </div>
              <div className="mt-0.5">
                <span className="px-2 py-0.5 bg-white bg-opacity-30 rounded-full text-xs font-bold">
                  {countToShow}
                </span>
              </div>
            </Button>
          );
        })}
      </div>
    </div>
  );
};

export default TicketStatusTabs;