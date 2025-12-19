export const priorityColors = {
  P1: "bg-red-500",
  P2: "bg-yellow-500",
  P3: "bg-green-500",
};
 
export const statusColors = {
Open: "bg-blue-400",
  "In Progress": "bg-yellow-400 text-black",
  Resolved: "bg-green-200 text-green-900",
  Closed: "bg-green-400",
};


 
export const statusTabs = ["Total", "Open", "In Progress", "Resolved", "Closed", "SLA Breached"];
 
export const statusStyles = {
  Total: "bg-gradient-to-br from-white to-gray-200 border border-gray-300 text-gray-800 shadow-md rounded-lg",
  Open: "bg-gradient-to-br from-blue-200 to-blue-300 border border-blue-300 text-blue-900 shadow-md rounded-lg",
  "In Progress": "bg-gradient-to-br from-amber-300 to-orange-300 border border-amber-300 text-amber-900 shadow-md rounded-lg",
  Resolved: "bg-gradient-to-br from-green-200 to-green-300 border border-green-300 text-green-900 shadow-md rounded-lg",
  Closed: "bg-gradient-to-br from-green-400 to-slate-500 border border-slate-300 text-slate-900 shadow-md rounded-lg",
  "SLA Breached": "bg-gradient-to-br from-rose-200 to-rose-300 border border-rose-300 text-rose-900 shadow-md rounded-lg",
};
// Helper function to determine if SLA is breached
export const isSLABreached = (ticket) => {
  return !!ticket.slaStatusFlag;
};
// Custom styles for ticket cards based on status
export const getTicketCardStyle = () => {
  // Use the same styling for all tickets regardless of status or SLA breach
  return "from-blue-50 via-white to-blue-50 border-blue-200";
};