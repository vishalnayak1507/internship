import React, { createContext, useState, useContext, useEffect } from 'react';

// Create the context
const TourContext = createContext();

// Custom hook to use the tour context
export const useTour = () => useContext(TourContext);

// Tour provider component
export const TourProvider = ({ children }) => {
  // Main tour states
  const [isTourOpen, setIsTourOpen] = useState(false);
  const [tourStep, setTourStep] = useState(0);
  const [currentPage, setCurrentPage] = useState('');
  const [userRole, setUserRole] = useState('');
  
  // Load saved tour progress from localStorage on initial mount
  useEffect(() => {
    const savedTourProgress = localStorage.getItem('admin_tour_progress');
    if (savedTourProgress) {
      const { step, page } = JSON.parse(savedTourProgress);
      setTourStep(step);
      setCurrentPage(page);
    }
    
    const savedUserRole = localStorage.getItem('user_role');
    if (savedUserRole) {
      setUserRole(savedUserRole);
    }
  }, []);
  
  // Save tour progress to localStorage when changed
  useEffect(() => {
    if (tourStep > 0 || currentPage) {
      localStorage.setItem(
        'admin_tour_progress', 
        JSON.stringify({ step: tourStep, page: currentPage })
      );
    }
  }, [tourStep, currentPage]);
  
  // Open the tour
  const openTour = (page) => {
    setCurrentPage(page);
    setTourStep(0);
    setIsTourOpen(true);
  };
  
  // Close the tour
  const closeTour = () => {
    setIsTourOpen(false);
  };
  
  // Reset tour progress
  const resetTour = () => {
    setTourStep(0);
    localStorage.removeItem('admin_tour_progress');
  };
  
  // Tour steps for different pages
  const dashboardTourSteps = [
    {
      selector: '.dashboard-header, h1:contains("Dashboard"), .page-header:contains("Dashboard")',
      title: 'Admin Dashboard',
      content: 'Welcome to the Admin Dashboard! This is your central hub for monitoring ticket status and statistics. From here, you can get a complete overview of all tickets in the system, track performance metrics, and identify trends requiring attention.',
      action: () => setCurrentPage('dashboard')
    },
    {
      selector: '.ticket-summary-cards',
      title: 'Ticket Status Overview',
      content: 'These status cards provide a quick summary of your current ticket situation. They show counts for different ticket statuses and help you monitor your team\'s performance at a glance. Let\'s explore each one in detail.',
    },
    {
      selector: '.ticket-card-in-progress',
      title: 'In Progress Tickets',
      content: 'This card shows tickets currently being worked on by analysts. These tickets have been assigned and are actively being addressed by your team. Monitor this number to understand current workload distribution and capacity.',
    },
    {
      selector: '.ticket-card-resolved',
      title: 'Resolved Tickets',
      content: 'The Resolved card displays tickets that have been addressed by analysts but are awaiting final customer confirmation or additional verification before being closed. These tickets require follow-up to ensure the solution was satisfactory.',
    },
    {
      selector: '.ticket-card-closed',
      title: 'Closed Tickets',
      content: 'This card shows the count of completely resolved and closed tickets. These tickets have been successfully addressed and verified by all parties. A growing number here indicates your team is effectively handling and closing issues.',
    },
    {
      selector: '.ticket-card-sla-breached',
      title: 'SLA Breached Tickets',
      content: 'This critical indicator shows tickets that have exceeded their resolution time target (Service Level Agreement). These require immediate attention! High numbers here suggest process bottlenecks or resource constraints that need addressing.',
    },
    {
      selector: '.ticket-trend-chart',
      title: 'Ticket Trend Analysis',
      content: 'This chart shows ticket trends over time. Track how ticket volumes change across days/weeks to identify patterns and allocate resources accordingly. Rising lines indicate increasing ticket volumes, while downward trends show decreasing volumes. Use this to forecast resource needs and analyze the impact of recent changes.',
    },
    {
      selector: '.tickets-by-status',
      title: 'Status Distribution',
      content: 'This pie chart breaks down tickets by their current status. Compare the proportion of tickets in each state (New, In Progress, Resolved, Closed) to identify bottlenecks. A large number of tickets in "New" status might indicate staffing issues, while many "In Progress" tickets might signal capacity constraints.',
    },
    {
      selector: '.tickets-by-source',
      title: 'Ticket Sources',
      content: 'This chart shows the distribution of tickets by their source (Email, Portal, Phone, etc.). Identify which channels are generating the most tickets to optimize your intake processes. A sudden increase from one source might indicate an issue with that particular channel.',
    },
    {
      selector: '.dashboard-filters',
      title: 'Dashboard Filters',
      content: 'Use these filters to customize the time range and refine the dashboard data. Select predefined periods like "Today", "This Week", or "This Month", or specify a custom date range to focus on specific time periods for deeper analysis.',
    }
  ];
  
  const ticketsTourSteps = [
    {
      selector: 'button:contains("New Ticket"), button:contains("+ New Ticket"), .new-ticket-button',
      title: 'Create New Ticket',
      content: 'Click this button to manually create a new ticket in the system. This opens a form where you can enter all the necessary ticket details.',
      action: () => setCurrentPage('tickets')
    },
    {
      selector: '.sticky.top-16.z-30 > div:first-child',
      title: 'Filter Bar',
      content: 'Use these filters to quickly find specific tickets. You can search by ticket number or analyst name, and filter by time period. This helps you focus on tickets that need immediate attention.',
    },
    {
      selector: 'button[title="Refresh"], button:has(svg[class*="RefreshCw"])',
      title: 'Refresh Button',
      content: 'Click this button to update the ticket list with the latest information. The system also automatically refreshes when new tickets are created, ensuring you always see current data.',
    },
    {
      selector: '.sticky.top-16.z-30 > div:nth-child(2), .sticky.top-16.z-30 > :nth-child(2), [id="ticket-status-tabs"], [role="tablist"], .tabs, [class*="tab-list"], [class*="status-tabs"]',
      title: 'Status Tabs',
      content: 'These tabs let you quickly filter tickets by their current status. Click on "Total", "Open", "In Progress", "Resolved", or "Closed" to view only tickets in that particular state.',
    },
    {
      selector: '.flex.flex-col.gap-4.mt-4 > div > div:first-child',
      title: 'Ticket Card',
      content: 'Each card represents an individual ticket, showing key information like ticket number, status, and customer details. Color-coding indicates priority level and SLA status. Click any ticket card to view its complete details.',
    }
  ];
  
  const analystTourSteps = [
    {
      selector: '.search-box',
      title: 'Search Analysts',
      content: 'Use this search box to quickly find analysts by name or employee ID. This helps you locate and manage specific team members.',
      action: () => setCurrentPage('analyst')
    },
    {
      selector: '.filter-dropdown-container',
      title: 'Filter & Sort Options',
      content: 'Click here to access advanced filtering and sorting options. You can sort analysts by name, employee ID, or performance metrics like resolved tickets and SLA breached tickets.',
    },
    {
      selector: '.analysts-list .analyst-card:first-child',
      title: 'Analyst Card',
      content: 'Each card represents an individual analyst. You can see their name, email, employee ID, department, and today\'s ticket statistics. Click on a card or the "View Details" button to see more information about that analyst.',
    },
    {
      selector: '.sticky.bottom-0',
      title: 'Pagination Controls',
      content: 'Use these controls to navigate through the list of analysts. You can go to specific pages or use the next/previous buttons to browse through all your team members.',
    }
  ];
  
  const uploadTourSteps = [
    {
      selector: '[class*="border-dashed"], [class*="border-2"][class*="rounded"], div[onclick*="inputRef"]',
      title: 'Bulk Ticket Upload',
      content: 'Welcome to the Upload page! This tool allows you to import multiple tickets at once from Excel files. Simply drag and drop your Excel file into the upload area, or click to browse your files. The system accepts .xlsx format files with columns for Customer ID, Issue Type, Description, Priority, and other required ticket information. After uploading, the system will process your file and create tickets automatically. For best results, use the sample template to ensure your data is correctly formatted.',
      action: () => setCurrentPage('upload')
    }
  ];
  
  const exportTourSteps = [
    {
      selector: '.export-header',
      title: 'Export Tickets',
      content: 'The Export Tickets page lets you download ticket data for analysis or reporting. Generate detailed Excel reports containing all ticket information matched by your selected filters. Use these exports for management reporting, trend analysis, or integrating with other systems.',
      action: () => setCurrentPage('export')
    },
    {
      selector: '.export-filters',
      title: 'Export Filtering Options',
      content: 'Customize the data you want to export by applying these filters. Select specific ticket statuses (New, In Progress, Resolved, Closed) to focus on particular stages of the workflow. Filter by SLA compliance to identify breached tickets. Use department filters to limit the export to specific teams, and date filters to specify the time period.',
    },
    {
      selector: '.date-range-quick-select',
      title: 'Quick Date Selection',
      content: 'Quickly set common date ranges with these preset buttons. "Last 7 days" captures recent activity, "Last 30 days" gives a monthly view, and "Today" focuses on current day\'s tickets only. These shortcuts save time when generating routine reports for standard time periods.',
    },
    {
      selector: '.export-button',
      title: 'Generate Export File',
      content: 'Click here to generate and download your customized export file. The system will create an Excel file containing all tickets matching your selected filters. The download includes comprehensive ticket details including ID, status, customer information, assignee, resolution notes, and all time-stamped activities.',
    }
  ];
  
  // Get the appropriate steps based on the current page
  const getTourSteps = () => {
    switch (currentPage) {
      case 'dashboard':
        return dashboardTourSteps;
      case 'tickets':
        return ticketsTourSteps;
      case 'analyst':
        return analystTourSteps;
      case 'upload':
        return uploadTourSteps;
      case 'export':
        return exportTourSteps;
      default:
        return [];
    }
  };
  
  // The context value
  const contextValue = {
    isTourOpen,
    tourStep,
    currentPage,
    userRole,
    tourSteps: getTourSteps(),
    openTour,
    closeTour,
    setTourStep,
    setUserRole,
    resetTour
  };
  
  return (
    <TourContext.Provider value={contextValue}>
      {children}
    </TourContext.Provider>
  );
};

export default TourContext;
