import React, { useEffect, useState, useRef } from 'react';
import { useTour } from '../../utils/admin/TourContext';
import '../../styles/TourStyles.css';
import '../../styles/TourHighlightEffects.css';

const RealTourComponent = () => {
  const { 
    isTourOpen, 
    tourStep, 
    tourSteps, 
    closeTour, 
    setTourStep,
    currentPage
  } = useTour();

  const [position, setPosition] = useState({ top: '50%', left: '50%', transform: 'translate(-50%, -50%)' });
  const [arrowPosition, setArrowPosition] = useState('none');
  const tooltipRef = useRef(null);
  const overlayRef = useRef(null);
  const highlightRef = useRef(null);
  const currentElementRef = useRef(null);

  // Function to highlight the current element and position the tooltip
  const positionTooltip = () => {
    try {
      if (!isTourOpen || !tourSteps[tourStep]?.selector) return;
      
      // Get the element to highlight
      const selector = tourSteps[tourStep].selector;
      
      // Try both querySelector and querySelectorAll approaches
      let element = document.querySelector(selector);
      
      // Handle specific dashboard elements with direct targeting
      if (!element && currentPage === 'dashboard') {
        if (selector.includes('ticket-trend-chart')) {
          // Find ticket trend chart by component or containing elements
          const trendCharts = document.querySelectorAll('.recharts-responsive-container');
          const trendSections = document.querySelectorAll('div[style*="border-radius: 24px"]');
          
          // Try to find trend chart container
          element = document.querySelector('.ticket-trend-chart') || 
                   Array.from(trendSections).find(el => 
                     el.textContent && el.textContent.toLowerCase().includes('trend')) ||
                   (trendCharts.length > 0 ? trendCharts[0].closest('div[style*="background"]') : null);
        } 
        else if (selector.includes('tickets-by-status')) {
          // Find status pie chart
          const pieCharts = document.querySelectorAll('.recharts-pie');
          const statusChart = Array.from(document.querySelectorAll('div[style*="border-radius: 24px"]')).find(el => 
            el.textContent && el.textContent.toLowerCase().includes('status'));
          
          element = document.querySelector('.tickets-by-status') || statusChart;
        }
        else if (selector.includes('tickets-by-source')) {
          // Find source pie chart
          const sourceChart = Array.from(document.querySelectorAll('div[style*="border-radius: 24px"]')).find(el => 
            el.textContent && el.textContent.toLowerCase().includes('source'));
            
          element = document.querySelector('.tickets-by-source') || sourceChart;
        }
        else if (selector.includes('dashboard-filters')) {
          // Find filter section
          element = document.querySelector('.dashboard-filters') || 
                    document.querySelector('.filter-container') ||
                    document.querySelector('div[style*="border-radius"]').querySelector('select, input[type="date"]')?.closest('div');
        }
      }
      
      // If still not found, try a more specific approach based on the current page
      if (!element) {
        element = findElementForCurrentPage(selector);
        
        if (!element) {
          console.warn(`Element with selector ${selector} not found`);
          return;
        }
      }
    
      // Function to find elements based on the current page
      function findElementForCurrentPage(selector) {
        switch(currentPage) {
          case 'analyst':
            return findAnalystElement(selector);
          case 'tickets':
            return findTicketElement(selector);
          case 'upload':
            return findUploadElement(selector);
          default:
            return null;
        }
      }
      
      // Helper function for analyst page elements with enhanced selectors
      function findAnalystElement(selector) {
        console.log('Finding analyst element for selector:', selector);
        
        // Find search box
        if (selector.includes('search-box') || selector.includes('search-filter-container') || selector.includes('input[type="text"]')) {
          console.log('Looking for search box or input');
          
          // First try directly targeting the search box container with input
          const searchBox = document.querySelector('.search-box');
          if (searchBox) {
            // Apply highlight
            searchBox.classList.add('tour-highlight');
            
            // Apply direct styles to ensure visibility with !important flags to override blur
            searchBox.style.zIndex = '10000';
            searchBox.style.position = 'relative';
            searchBox.style.filter = 'none !important';
            searchBox.style.webkitFilter = 'none !important';
            searchBox.style.backdropFilter = 'none !important';
            searchBox.style.webkitBackdropFilter = 'none !important';
            searchBox.style.opacity = '1 !important';
            searchBox.style.visibility = 'visible !important';
            
            // Also ensure children (especially the input) don't have filter effects
            const children = searchBox.querySelectorAll('*');
            children.forEach(child => {
              child.style.filter = 'none !important';
              child.style.webkitFilter = 'none !important';
              child.style.backdropFilter = 'none !important';
              child.style.webkitBackdropFilter = 'none !important';
              child.style.opacity = '1 !important';
              child.style.visibility = 'visible !important';
            });
            
            return searchBox;
          }
          
          // Look for any search inputs
          const searchInputs = document.querySelectorAll('input[type="text"], input[type="search"], input[placeholder*="Search"], input[placeholder*="search"]');
          for (let input of searchInputs) {
            if (input) {
              console.log('Found search input:', input);
              // Look for a parent container that would be better to highlight
              const parentContainer = input.closest('.search-box') || 
                                    input.closest('.search-filter-container') || 
                                    input.closest('[class*="search"]') ||
                                    input.closest('div');
                                    
              const elementToHighlight = parentContainer || input;
              
              // Apply highlight
              elementToHighlight.classList.add('tour-highlight');
              
              // Apply direct styles to ensure visibility
              elementToHighlight.style.zIndex = '10000';
              elementToHighlight.style.position = 'relative';
              elementToHighlight.style.filter = 'none !important';
              elementToHighlight.style.webkitFilter = 'none !important';
              elementToHighlight.style.backdropFilter = 'none !important';
              elementToHighlight.style.webkitBackdropFilter = 'none !important';
              elementToHighlight.style.opacity = '1 !important';
              elementToHighlight.style.visibility = 'visible !important';
              
              // Make all children visible too
              const allChildren = elementToHighlight.querySelectorAll('*');
              allChildren.forEach(child => {
                child.style.filter = 'none !important';
                child.style.webkitFilter = 'none !important';
                child.style.backdropFilter = 'none !important';
                child.style.webkitBackdropFilter = 'none !important';
                child.style.opacity = '1 !important';
                child.style.visibility = 'visible !important';
              });
              
              return elementToHighlight;
            }
          }
          
          // Last resort: Find something at the top of the page that might be the search/filter area
          const topContainer = document.querySelector('.search-filter-container');
          if (topContainer) {
            console.log('Using search-filter-container fallback');
            topContainer.classList.add('tour-highlight');
            
            // Apply direct styles
            topContainer.style.zIndex = '10000';
            topContainer.style.position = 'relative';
            topContainer.style.filter = 'none !important';
            topContainer.style.webkitFilter = 'none !important';
            topContainer.style.backdropFilter = 'none !important';
            topContainer.style.webkitBackdropFilter = 'none !important';
            topContainer.style.opacity = '1 !important';
            topContainer.style.visibility = 'visible !important';
            
            // Make all children visible too
            const allChildren = topContainer.querySelectorAll('*');
            allChildren.forEach(child => {
              child.style.filter = 'none !important';
              child.style.webkitFilter = 'none !important';
              child.style.backdropFilter = 'none !important';
              child.style.webkitBackdropFilter = 'none !important';
              child.style.opacity = '1 !important';
              child.style.visibility = 'visible !important';
            });
            
            return topContainer;
          }
        }
        
        // Find filter dropdown
        if (selector.includes('filter-dropdown-container') || selector.includes('Filter & Sort')) {
          console.log('Looking for filter dropdown');
          
          // Look for filter elements
          const filterDropdown = document.querySelector('.filter-dropdown-container');
          if (filterDropdown) {
            console.log('Found filter dropdown element');
            
            // Apply highlight
            filterDropdown.classList.add('tour-highlight');
            
            // Apply direct styles to ensure visibility
            filterDropdown.style.zIndex = '10000';
            filterDropdown.style.position = 'relative';
            filterDropdown.style.filter = 'none !important';
            filterDropdown.style.webkitFilter = 'none !important';
            filterDropdown.style.backdropFilter = 'none !important';
            filterDropdown.style.webkitBackdropFilter = 'none !important';
            filterDropdown.style.opacity = '1 !important';
            filterDropdown.style.visibility = 'visible !important';
            
            // Make all children visible too
            const allChildren = filterDropdown.querySelectorAll('*');
            allChildren.forEach(child => {
              child.style.filter = 'none !important';
              child.style.webkitFilter = 'none !important';
              child.style.backdropFilter = 'none !important';
              child.style.webkitBackdropFilter = 'none !important';
              child.style.opacity = '1 !important';
              child.style.visibility = 'visible !important';
            });
            
            return filterDropdown;
          }
          
          // Look for any button with "Filter" text
          const buttons = document.querySelectorAll('button');
          for (const button of buttons) {
            if (button.textContent && button.textContent.toLowerCase().includes('filter')) {
              console.log('Found filter button');
              
              // Apply highlight
              button.classList.add('tour-highlight');
              
              // Apply direct styles
              button.style.zIndex = '10000';
              button.style.position = 'relative';
              button.style.filter = 'none !important';
              button.style.webkitFilter = 'none !important';
              button.style.backdropFilter = 'none !important';
              button.style.webkitBackdropFilter = 'none !important';
              button.style.opacity = '1 !important';
              button.style.visibility = 'visible !important';
              
              return button;
            }
          }
        }
        
        // Find analyst card
        if (selector.includes('analyst-card') || selector.includes('Analyst Card')) {
          // Find the first analyst card
          const analystCards = document.querySelectorAll('.analyst-card');
          if (analystCards.length > 0) return analystCards[0];
          
          // Look in the analysts list
          const analystsList = document.querySelector('.analysts-list');
          if (analystsList && analystsList.firstElementChild) return analystsList.firstElementChild;
          
          // Try to find any card-like element
          return document.querySelector('[class*="card"]') || document.querySelector('.grid > div');
        }
        
        // Find ticket statistics boxes
        if (selector.includes('ticket-stat-box')) {
          // Look for ticket stat boxes
          const statBoxes = document.querySelectorAll('.ticket-stat-box');
          if (statBoxes.length > 0) return statBoxes[0];
          
          // Look for anything with ticket stats
          const ticketStats = document.querySelector('[class*="stat"]');
          if (ticketStats) return ticketStats;
          
          // Look for any small info boxes
          return document.querySelector('[class*="badge"]') || document.querySelector('[class*="tag"]');
        }
        
        // Find pagination controls
        if (selector.includes('sticky.bottom-0') || selector.includes('pagination')) {
          // Look for pagination container at the bottom
          const pagination = document.querySelector('.sticky.bottom-0');
          if (pagination) return pagination;
          
          // Look for navigation controls
          return document.querySelector('[class*="pagination"]') || document.querySelector('nav');
        }
        
       
        if (selector.includes('dialog') || selector.includes('[aria-modal="true"]') || selector.includes('[role="dialog"]')) {
          // Look for analyst details dialog/modal
          const dialog = document.querySelector('[aria-modal="true"], .dialog, [role="dialog"], [class*="modal"]');
          if (dialog) return dialog;
          
          // Look for any content that might be a dialog based on styling
          const possibleDialogs = document.querySelectorAll('div[style*="position: fixed"], div[style*="position:fixed"]');
          for (let dialog of possibleDialogs) {
            if (dialog.style.zIndex && parseInt(dialog.style.zIndex) > 50) {
              return dialog;
            }
          }
        }
        
        return null;
      }
      
      // Helper function for tickets page elements with enhanced selectors
      function findTicketElement(selector) {
        console.log('Finding ticket element for selector:', selector);
        
        // Find new ticket button
        if (selector.includes('New Ticket') || selector.includes('+ New Ticket') || selector.includes('new-ticket-button')) {
          // Look for any button containing "New Ticket" text
          const buttons = document.querySelectorAll('button');
          for (let button of buttons) {
            if (button.textContent && (
              button.textContent.toLowerCase().includes('new ticket') || 
              button.textContent.toLowerCase().includes('create ticket')
            )) {
              return button;
            }
          }
          
          // Look for buttons with plus icons that might be "new" buttons
          const newButtons = document.querySelectorAll('button');
          for (let btn of newButtons) {
            if (btn.innerHTML.includes('svg') && (
              btn.textContent.includes('+') || 
              btn.textContent.toLowerCase().includes('new') ||
              btn.textContent.toLowerCase().includes('create')
            )) {
              return btn;
            }
          }
          
          // Last resort - find action buttons
          return document.querySelector('[class*="create"], [class*="new"], [class*="add"]');
        }
        
        // Find filter bar - matching updated selector: '.sticky.top-16.z-30 > div:first-child'
        if (selector.includes('filter') || selector.includes('sticky') || selector.includes('Filter Bar')) {
          // First try the direct selector - most reliable
          const stickyFilter = document.querySelector('.sticky.top-16.z-30 > div:first-child');
          if (stickyFilter) {
            console.log('Found filter bar with direct selector');
            
            // Apply enhanced highlight styling
            stickyFilter.classList.add('tickets-filter-highlight');
            
            // Apply direct styles to ensure visibility
            stickyFilter.style.zIndex = '99999';
            stickyFilter.style.position = 'relative';
            stickyFilter.style.filter = 'none';
            stickyFilter.style.webkitFilter = 'none';
            stickyFilter.style.backdropFilter = 'none';
            stickyFilter.style.webkitBackdropFilter = 'none';
            stickyFilter.style.opacity = '1';
            
            // Make all children visible too
            const allChildren = stickyFilter.querySelectorAll('*');
            allChildren.forEach(child => {
              child.style.filter = 'none';
              child.style.webkitFilter = 'none';
              child.style.backdropFilter = 'none';
              child.style.webkitBackdropFilter = 'none';
              child.style.opacity = '1';
            });
            
            return stickyFilter;
          }
          
          // Fallbacks
          const anySticky = document.querySelector('.sticky');
          if (anySticky && anySticky.firstElementChild) {
            console.log('Found filter bar via any sticky element');
            
            // Apply enhanced highlight styling
            anySticky.firstElementChild.classList.add('tickets-filter-highlight');
            
            // Apply direct styles
            anySticky.firstElementChild.style.zIndex = '99999';
            anySticky.firstElementChild.style.position = 'relative';
            anySticky.firstElementChild.style.filter = 'none';
            anySticky.firstElementChild.style.webkitFilter = 'none';
            anySticky.firstElementChild.style.backdropFilter = 'none';
            anySticky.firstElementChild.style.webkitBackdropFilter = 'none';
            anySticky.firstElementChild.style.opacity = '1';
            
            // Make all children visible too
            const allChildren = anySticky.firstElementChild.querySelectorAll('*');
            allChildren.forEach(child => {
              child.style.filter = 'none';
              child.style.webkitFilter = 'none';
              child.style.backdropFilter = 'none';
              child.style.webkitBackdropFilter = 'none';
              child.style.opacity = '1';
            });
            
            return anySticky.firstElementChild;
          }
          
          // Look for TicketFilters component
          const filterComponent = document.getElementById('ticket-filters');
          if (filterComponent) {
            console.log('Found ticket filters by ID');
            
            // Apply enhanced highlight styling
            filterComponent.classList.add('tickets-filter-highlight');
            
            // Apply direct styles
            filterComponent.style.zIndex = '99999';
            filterComponent.style.position = 'relative';
            filterComponent.style.filter = 'none';
            filterComponent.style.webkitFilter = 'none';
            filterComponent.style.backdropFilter = 'none';
            filterComponent.style.webkitBackdropFilter = 'none';
            filterComponent.style.opacity = '1';
            
            // Make all children visible too
            const allChildren = filterComponent.querySelectorAll('*');
            allChildren.forEach(child => {
              child.style.filter = 'none';
              child.style.webkitFilter = 'none';
              child.style.backdropFilter = 'none';
              child.style.webkitBackdropFilter = 'none';
              child.style.opacity = '1';
            });
            
            return filterComponent;
          }
          
          // Look for search inputs and containers
          const searchInputs = document.querySelectorAll('input[type="search"], input[type="text"], input[placeholder*="search"]');
          if (searchInputs.length > 0) {
            const container = searchInputs[0].closest('.sticky') || searchInputs[0].closest('form') || searchInputs[0].closest('div');
            console.log('Found filter via search input');
            
            const element = container || searchInputs[0];
            
            // Apply enhanced highlight styling
            element.classList.add('tickets-filter-highlight');
            
            // Apply direct styles
            element.style.zIndex = '99999';
            element.style.position = 'relative';
            element.style.filter = 'none';
            element.style.webkitFilter = 'none';
            element.style.backdropFilter = 'none';
            element.style.webkitBackdropFilter = 'none';
            element.style.opacity = '1';
            
            // Make all children visible too
            const allChildren = element.querySelectorAll('*');
            allChildren.forEach(child => {
              child.style.filter = 'none';
              child.style.webkitFilter = 'none';
              child.style.backdropFilter = 'none';
              child.style.webkitBackdropFilter = 'none';
              child.style.opacity = '1';
            });
            
            return element;
          }
        }
        
        // Find refresh button - matching updated selector: 'button[title="Refresh"], button:has(svg[class*="RefreshCw"])'
        if (selector.includes('Refresh') || selector.includes('refresh') || selector.includes('RefreshCw')) {
          // Try direct selectors first
          const refreshButton = document.querySelector('button[title="Refresh"], button:has(svg[class*="RefreshCw"])');
          if (refreshButton) {
            console.log('Found refresh button with direct selector');
            
            // Apply enhanced highlight styling
            refreshButton.classList.add('tickets-refresh-highlight');
            
            // Apply direct styles to ensure visibility
            refreshButton.style.zIndex = '99999';
            refreshButton.style.position = 'relative';
            refreshButton.style.filter = 'none';
            refreshButton.style.webkitFilter = 'none';
            refreshButton.style.backdropFilter = 'none';
            refreshButton.style.webkitBackdropFilter = 'none';
            refreshButton.style.opacity = '1';
            
            // Make all children visible too
            const allChildren = refreshButton.querySelectorAll('*');
            allChildren.forEach(child => {
              child.style.filter = 'none';
              child.style.webkitFilter = 'none';
              child.style.backdropFilter = 'none';
              child.style.webkitBackdropFilter = 'none';
              child.style.opacity = '1';
            });
            
            return refreshButton;
          }
          
          // Look for buttons with RefreshCw component
          const buttons = document.querySelectorAll('button');
          for (let btn of buttons) {
            // Check for refresh text
            if (btn.textContent && btn.textContent.toLowerCase().includes('refresh')) {
              console.log('Found refresh button via text content');
              
              // Apply enhanced highlight styling
              btn.classList.add('tickets-refresh-highlight');
              
              // Apply direct styles
              btn.style.zIndex = '99999';
              btn.style.position = 'relative';
              btn.style.filter = 'none';
              btn.style.webkitFilter = 'none';
              btn.style.backdropFilter = 'none';
              btn.style.webkitBackdropFilter = 'none';
              btn.style.opacity = '1';
              
              // Make all children visible too
              const allChildren = btn.querySelectorAll('*');
              allChildren.forEach(child => {
                child.style.filter = 'none';
                child.style.webkitFilter = 'none';
                child.style.backdropFilter = 'none';
                child.style.webkitBackdropFilter = 'none';
                child.style.opacity = '1';
              });
              
              return btn;
            }
            
            // Check for RefreshCw icon
            if (btn.innerHTML && btn.innerHTML.includes('RefreshCw')) {
              console.log('Found refresh button via RefreshCw in HTML');
              
              // Apply enhanced highlight styling
              btn.classList.add('tickets-refresh-highlight');
              
              // Apply direct styles
              btn.style.zIndex = '99999';
              btn.style.position = 'relative';
              btn.style.filter = 'none';
              btn.style.webkitFilter = 'none';
              btn.style.backdropFilter = 'none';
              btn.style.webkitBackdropFilter = 'none';
              btn.style.opacity = '1';
              
              // Make all children visible too
              const allChildren = btn.querySelectorAll('*');
              allChildren.forEach(child => {
                child.style.filter = 'none';
                child.style.webkitFilter = 'none';
                child.style.backdropFilter = 'none';
                child.style.webkitBackdropFilter = 'none';
                child.style.opacity = '1';
              });
              
              return btn;
            }
            
            // Check for refresh icon in SVG
            const svgIcons = btn.querySelectorAll('svg');
            for (let icon of svgIcons) {
              if (icon.outerHTML && (
                icon.outerHTML.toLowerCase().includes('refresh') ||
                icon.getAttribute('class') && icon.getAttribute('class').includes('RefreshCw')
              )) {
                console.log('Found refresh button via SVG icon');
                
                // Apply enhanced highlight styling
                btn.classList.add('tickets-refresh-highlight');
                
                // Apply direct styles
                btn.style.zIndex = '99999';
                btn.style.position = 'relative';
                btn.style.filter = 'none';
                btn.style.webkitFilter = 'none';
                btn.style.backdropFilter = 'none';
                btn.style.webkitBackdropFilter = 'none';
                btn.style.opacity = '1';
                
                // Make all children visible too
                const allChildren = btn.querySelectorAll('*');
                allChildren.forEach(child => {
                  child.style.filter = 'none';
                  child.style.webkitFilter = 'none';
                  child.style.backdropFilter = 'none';
                  child.style.webkitBackdropFilter = 'none';
                  child.style.opacity = '1';
                });
                
                return btn;
              }
            }
          }
        }
        
        // Find status tabs - matching updated selector: '.sticky.top-16.z-30 > :nth-child(2)'
        if (selector.includes('status-tabs') || selector.includes('tab') || selector.includes('Status Tab')) {
          // Try direct selector first
          const statusTabs = document.querySelector('.sticky.top-16.z-30 > :nth-child(2)');
          if (statusTabs) {
            console.log('Found status tabs with direct selector');
            
            // Force id and class for robust tour highlighting
            statusTabs.setAttribute('id', 'ticket-status-tabs');
            statusTabs.classList.add('tickets-tabs-highlight');
            
            // Apply enhanced highlight styling
            statusTabs.style.zIndex = '99999';
            statusTabs.style.position = 'relative';
            statusTabs.style.filter = 'none';
            statusTabs.style.webkitFilter = 'none';
            statusTabs.style.backdropFilter = 'none';
            statusTabs.style.webkitBackdropFilter = 'none';
            statusTabs.style.opacity = '1';
            
            // Make all children visible too
            const allChildren = statusTabs.querySelectorAll('*');
            allChildren.forEach(child => {
              child.style.filter = 'none';
              child.style.webkitFilter = 'none';
              child.style.backdropFilter = 'none';
              child.style.webkitBackdropFilter = 'none';
              child.style.opacity = '1';
            });
            
            return statusTabs;
          }
          
          // Try TicketStatusTabs component
          const tabsComponent = document.querySelector('[id="ticket-status-tabs"]');
          if (tabsComponent) {
            console.log('Found ticket status tabs by ID');
            
            // Apply enhanced highlight styling
            tabsComponent.classList.add('tickets-tabs-highlight');
            
            // Apply direct styles
            tabsComponent.style.zIndex = '99999';
            tabsComponent.style.position = 'relative';
            tabsComponent.style.filter = 'none';
            tabsComponent.style.webkitFilter = 'none';
            tabsComponent.style.backdropFilter = 'none';
            tabsComponent.style.webkitBackdropFilter = 'none';
            tabsComponent.style.opacity = '1';
            
            // Make all children visible too
            const allChildren = tabsComponent.querySelectorAll('*');
            allChildren.forEach(child => {
              child.style.filter = 'none';
              child.style.webkitFilter = 'none';
              child.style.backdropFilter = 'none';
              child.style.webkitBackdropFilter = 'none';
              child.style.opacity = '1';
            });
            
            return tabsComponent;
          }
          
          // Look for tab elements
          const tabs = document.querySelector('[role="tablist"], .tabs, [class*="tab-list"], [class*="status-tabs"]');
          if (tabs) {
            console.log('Found tabs via generic tab selectors');
            
            // Apply enhanced highlight styling
            tabs.classList.add('tickets-tabs-highlight');
            
            // Apply direct styles
            tabs.style.zIndex = '99999';
            tabs.style.position = 'relative';
            tabs.style.filter = 'none';
            tabs.style.webkitFilter = 'none';
            tabs.style.backdropFilter = 'none';
            tabs.style.webkitBackdropFilter = 'none';
            tabs.style.opacity = '1';
            
            // Make all children visible too
            const allChildren = tabs.querySelectorAll('*');
            allChildren.forEach(child => {
              child.style.filter = 'none';
              child.style.webkitFilter = 'none';
              child.style.backdropFilter = 'none';
              child.style.webkitBackdropFilter = 'none';
              child.style.opacity = '1';
            });
            
            return tabs;
          }
          
          // Find by tab button text content
          const allButtons = document.querySelectorAll('button');
          const statusButtons = Array.from(allButtons).filter(btn => 
            btn.textContent && (
              btn.textContent.toLowerCase().includes('total') ||
              btn.textContent.toLowerCase().includes('new') ||
              btn.textContent.toLowerCase().includes('open') ||
              btn.textContent.toLowerCase().includes('in progress') ||
              btn.textContent.toLowerCase().includes('resolved') ||
              btn.textContent.toLowerCase().includes('closed')
            )
          );
          
          if (statusButtons.length > 1) {
            console.log('Found status tabs via button text content');
            const parent = statusButtons[0].parentElement;
            // Find a common parent if possible
            if (parent && parent.contains(statusButtons[1])) {
              
              // Apply enhanced highlight styling
              parent.classList.add('tickets-tabs-highlight');
              
              // Apply direct styles
              parent.style.zIndex = '99999';
              parent.style.position = 'relative';
              parent.style.filter = 'none';
              parent.style.webkitFilter = 'none';
              parent.style.backdropFilter = 'none';
              parent.style.webkitBackdropFilter = 'none';
              parent.style.opacity = '1';
              
              // Make all children visible too
              const allChildren = parent.querySelectorAll('*');
              allChildren.forEach(child => {
                child.style.filter = 'none';
                child.style.webkitFilter = 'none';
                child.style.backdropFilter = 'none';
                child.style.webkitBackdropFilter = 'none';
                child.style.opacity = '1';
              });
              
              return parent;
            }
            
            const elementToHighlight = statusButtons[0].parentElement || statusButtons[0];
            
            // Apply enhanced highlight styling
            elementToHighlight.classList.add('tickets-tabs-highlight');
            
            // Apply direct styles
            elementToHighlight.style.zIndex = '99999';
            elementToHighlight.style.position = 'relative';
            elementToHighlight.style.filter = 'none';
            elementToHighlight.style.webkitFilter = 'none';
            elementToHighlight.style.backdropFilter = 'none';
            elementToHighlight.style.webkitBackdropFilter = 'none';
            elementToHighlight.style.opacity = '1';
            
            // Make all children visible too
            const allChildren = elementToHighlight.querySelectorAll('*');
            allChildren.forEach(child => {
              child.style.filter = 'none';
              child.style.webkitFilter = 'none';
              child.style.backdropFilter = 'none';
              child.style.webkitBackdropFilter = 'none';
              child.style.opacity = '1';
            });
            
            return elementToHighlight;
          }
        }
        
        // Find ticket card - matching updated selector: '.flex.flex-col.gap-4.mt-4 > div > div:first-child'
        if (selector.includes('ticket') || selector.includes('card') || selector.includes('Ticket Card')) {
          // Try direct selector first
          const ticketCard = document.querySelector('.flex.flex-col.gap-4.mt-4 > div > div:first-child');
          if (ticketCard) {
            console.log('Found ticket card with direct selector');
            
            // Apply enhanced highlight styling
            ticketCard.classList.add('tickets-card-highlight');
            
            // Apply direct styles to ensure visibility
            ticketCard.style.zIndex = '99999';
            ticketCard.style.position = 'relative';
            ticketCard.style.filter = 'none';
            ticketCard.style.webkitFilter = 'none';
            ticketCard.style.backdropFilter = 'none';
            ticketCard.style.webkitBackdropFilter = 'none';
            ticketCard.style.opacity = '1';
            
            // Make all children visible too
            const allChildren = ticketCard.querySelectorAll('*');
            allChildren.forEach(child => {
              child.style.filter = 'none';
              child.style.webkitFilter = 'none';
              child.style.backdropFilter = 'none';
              child.style.webkitBackdropFilter = 'none';
              child.style.opacity = '1';
            });
            
            return ticketCard;
          }
          
          // Look for any visible ticket cards with ticket classes
          const ticketCards = document.querySelectorAll('[class*="ticket-card"], .card');
          if (ticketCards.length > 0) {
            console.log('Found ticket card via class name');
            
            // Apply enhanced highlight styling
            ticketCards[0].classList.add('tickets-card-highlight');
            
            // Apply direct styles
            ticketCards[0].style.zIndex = '99999';
            ticketCards[0].style.position = 'relative';
            ticketCards[0].style.filter = 'none';
            ticketCards[0].style.webkitFilter = 'none';
            ticketCards[0].style.backdropFilter = 'none';
            ticketCards[0].style.webkitBackdropFilter = 'none';
            ticketCards[0].style.opacity = '1';
            
            // Make all children visible too
            const allChildren = ticketCards[0].querySelectorAll('*');
            allChildren.forEach(child => {
              child.style.filter = 'none';
              child.style.webkitFilter = 'none';
              child.style.backdropFilter = 'none';
              child.style.webkitBackdropFilter = 'none';
              child.style.opacity = '1';
            });
            
            return ticketCards[0];
          }
          
          // Find container with ticket list
          const ticketContainer = document.querySelector('.flex.flex-col.gap-4');
          if (ticketContainer && ticketContainer.querySelector('div > div')) {
            console.log('Found ticket card via container structure');
            
            const card = ticketContainer.querySelector('div > div');
            
            // Apply enhanced highlight styling
            card.classList.add('tickets-card-highlight');
            
            // Apply direct styles
            card.style.zIndex = '99999';
            card.style.position = 'relative';
            card.style.filter = 'none';
            card.style.webkitFilter = 'none';
            card.style.backdropFilter = 'none';
            card.style.webkitBackdropFilter = 'none';
            card.style.opacity = '1';
            
            // Make all children visible too
            const allChildren = card.querySelectorAll('*');
            allChildren.forEach(child => {
              child.style.filter = 'none';
              child.style.webkitFilter = 'none';
              child.style.backdropFilter = 'none';
              child.style.webkitBackdropFilter = 'none';
              child.style.opacity = '1';
            });
            
            return card;
          }
          
          // Last resort - find any card-like component
          const anyCard = document.querySelector('.w-full > div > div');
          if (anyCard) {
            console.log('Found ticket card via generic structure');
            
            // Apply enhanced highlight styling
            anyCard.classList.add('tickets-card-highlight');
            
            // Apply direct styles
            anyCard.style.zIndex = '99999';
            anyCard.style.position = 'relative';
            anyCard.style.filter = 'none';
            anyCard.style.webkitFilter = 'none';
            anyCard.style.backdropFilter = 'none';
            anyCard.style.webkitBackdropFilter = 'none';
            anyCard.style.opacity = '1';
            
            // Make all children visible too
            const allChildren = anyCard.querySelectorAll('*');
            allChildren.forEach(child => {
              child.style.filter = 'none';
              child.style.webkitFilter = 'none';
              child.style.backdropFilter = 'none';
              child.style.webkitBackdropFilter = 'none';
              child.style.opacity = '1';
            });
            
            return anyCard;
          }
        }
        
        
        if (selector.includes('refresh') || selector.includes('button:contains("Refresh")')) {
          // Look for refresh/reload buttons
          const buttons = document.querySelectorAll('button, a, [role="button"]');
          for (let btn of buttons) {
            if (btn && btn.textContent && 
               (btn.textContent.toLowerCase().includes('refresh') || 
                btn.textContent.toLowerCase().includes('reload'))) {
              return btn;
            }
          }
          
          // Look for refresh icons
          const refreshIcons = document.querySelectorAll('svg, [class*="refresh"], [class*="reload"], [class*="sync"]');
          for (let icon of refreshIcons) {
            const button = icon.closest('button') || icon.closest('a') || icon.closest('[role="button"]');
            if (button) return button;
          }
        }
        
        return null;
      }
      
     // Helper function for upload page elements with enhanced selectors
      function findUploadElement(selector) {
        // Look for upload card or dropzone element
        if (selector.includes('dropzone') || selector.includes('upload-area') || selector.includes('file-upload') || selector.includes('card') || selector.includes('upload')) {
          console.log('Finding upload element...');
          
          // Look for the dropzone or drag area first - this is the specific upload component we want to highlight
          const dragArea = document.querySelector('[class*="border-dashed"], [class*="border-2"][class*="rounded"], div[onclick*="inputRef"]');
          if (dragArea) {
            console.log('Found drag & drop area');
            // Apply highlighting directly to the drag area
            dragArea.classList.add('tour-highlight');
            dragArea.style.zIndex = '10000';
            dragArea.style.position = 'relative';
            dragArea.style.filter = 'none';
            dragArea.style.webkitFilter = 'none';
            dragArea.style.backdropFilter = 'none';
            dragArea.style.webkitBackdropFilter = 'none';
            dragArea.style.opacity = '1';
            return dragArea;
          }
          
          // DIRECT APPROACH: Find the most prominent element in the upload page
          // First target the main white card with shadow - this is the most visible element
          const mainCard = document.querySelector('.bg-white.rounded-2xl.shadow-lg.border');
          if (mainCard) {
            console.log('Found main card with direct class selector');
            mainCard.classList.add('tour-highlight');
            mainCard.style.zIndex = '10000';
            mainCard.style.position = 'relative';
            mainCard.style.filter = 'none';
            mainCard.style.webkitFilter = 'none';
            mainCard.style.backdropFilter = 'none';
            mainCard.style.webkitBackdropFilter = 'none';
            mainCard.style.opacity = '1';
            return mainCard;
          }
          
          // Look for any white card with shadow
          const whiteCard = document.querySelector('.bg-white[class*="shadow"], .bg-white[class*="border"], [class*="bg-white"][class*="rounded"]');
          if (whiteCard) {
            console.log('Found white card with shadow');
            whiteCard.classList.add('tour-highlight');
            whiteCard.style.zIndex = '10000';
            whiteCard.style.position = 'relative';
            whiteCard.style.filter = 'none';
            whiteCard.style.webkitFilter = 'none';
            whiteCard.style.backdropFilter = 'none';
            whiteCard.style.webkitBackdropFilter = 'none';
            whiteCard.style.opacity = '1';
            return whiteCard;
          }
          
          // Find any element containing "Ticket File Upload" text
          const allDivs = document.querySelectorAll('div');
          for (let div of allDivs) {
            if (div.textContent && div.textContent.includes('Ticket File Upload')) {
              // Get the container that has the full upload UI
              const parentCard = div.closest('.bg-white') || 
                              div.closest('[class*="shadow"]') || 
                              div.closest('[class*="border"]') ||
                              div.closest('div');
                              
              if (parentCard) {
                console.log('Found parent card by "Ticket File Upload" text');
                parentCard.classList.add('tour-highlight');
                parentCard.style.zIndex = '10000';
                parentCard.style.position = 'relative';
                parentCard.style.filter = 'none !important';
                parentCard.style.backdropFilter = 'none !important';
                return parentCard;
              }
            }
          }
          
          // Find the main FileUpload component container
          const fileUploadDiv = document.querySelector('.max-w-xl.mx-auto');
          if (fileUploadDiv) {
            console.log('Found FileUpload component container');
            fileUploadDiv.classList.add('tour-highlight');
            fileUploadDiv.style.zIndex = '10000';
            fileUploadDiv.style.position = 'relative';
            fileUploadDiv.style.filter = 'none !important';
            fileUploadDiv.style.backdropFilter = 'none !important';
            return fileUploadDiv;
          }
          
          // We already checked for dragArea at the top of the function, so this code is now redundant
          // Check for any file-related components that might be the upload area
          const fileComponents = document.querySelector('[class*="file-component"], [class*="upload-component"]');
          if (fileComponents) {
            console.log('Found file components');
            const containerCard = fileComponents.closest('.bg-white') || fileComponents.parentElement;
            if (containerCard) {
              containerCard.classList.add('tour-highlight');
              containerCard.style.zIndex = '10000';
              containerCard.style.position = 'relative';
              containerCard.style.filter = 'none';
              containerCard.style.webkitFilter = 'none';
              containerCard.style.backdropFilter = 'none';
              containerCard.style.webkitBackdropFilter = 'none';
              containerCard.style.opacity = '1';
              return containerCard;
            }
            fileComponents.classList.add('tour-highlight');
            fileComponents.style.zIndex = '10000';
            fileComponents.style.position = 'relative';
            fileComponents.style.filter = 'none';
            fileComponents.style.webkitFilter = 'none';
            fileComponents.style.backdropFilter = 'none';
            fileComponents.style.webkitBackdropFilter = 'none';
            fileComponents.style.opacity = '1';
            return fileComponents;
          }
          
          // Find by file input and move up to find container
          const fileInput = document.querySelector('input[type="file"]');
          if (fileInput) {
            console.log('Found by file input');
            let parent = fileInput.parentElement;
            // Go up 3 levels to find the card
            for (let i = 0; i < 3 && parent; i++) {
              parent = parent.parentElement;
              if (parent.classList.contains('bg-white') || 
                 parent.classList.toString().includes('shadow') || 
                 parent.classList.toString().includes('border')) {
                parent.classList.add('tour-highlight');
                parent.style.zIndex = '10000';
                parent.style.position = 'relative';
                parent.style.filter = 'none !important';
                parent.style.backdropFilter = 'none !important';
                return parent;
              }
            }
          }
          
          // FALLBACK: Find any main element on the page
          const mainElement = document.querySelector('main');
          if (mainElement && mainElement.children.length > 0) {
            const firstChild = mainElement.children[0];
            console.log('Using fallback - first child of main');
            firstChild.classList.add('tour-highlight');
            firstChild.style.zIndex = '10000';
            firstChild.style.position = 'relative';
            firstChild.style.filter = 'none !important';
            firstChild.style.backdropFilter = 'none !important';
            return firstChild;
          }
          
          // Ultimate fallback - use the body
          console.log('Using body fallback');
          document.body.classList.add('tour-highlight');
          return document.body;
        }
        
        // Last resort, try to find any element related to file upload
        return document.querySelector('.file-upload, input[type="file"], [class*="upload-container"]') || 
               document.querySelector('main') || document.body;
      }
      

      currentElementRef.current = element;
      
      // Add tour-highlight class to make the element stand out
      element.classList.add('tour-highlight');
      
      // Add specific class based on element type to apply special highlighting
      // For dashboard ticket cards, be more specific with selection
      if (currentPage === 'dashboard') {
        if (selector.includes('ticket-card-in-progress')) {
          // For ticket summary cards in dashboard
          if (element.classList.contains('ticket-summary-cards')) {
            // Find the specific "In Progress" card within the container
            const cards = element.querySelectorAll('.ticket-card-in-progress');
            if (cards.length > 0) {
              // Apply highlighting to the specific card
              cards[0].classList.add('tour-highlight');
              cards[0].style.zIndex = '99990';
              cards[0].style.position = 'relative';
              
              // If the card is wrapped in another div, highlight that too
              const cardWrapper = cards[0].closest('div[style*="flex"]');
              if (cardWrapper && cardWrapper !== element) {
                cardWrapper.classList.add('tour-highlight');
                cardWrapper.style.zIndex = '99990';
              }
            } else {
              // If no direct class match, try to find by content
              const allCards = element.querySelectorAll('div');
              for (let card of allCards) {
                if (card.textContent && 
                    card.textContent.toLowerCase().includes('progress') && 
                    card.textContent.match(/\d+/)) {
                  card.classList.add('ticket-card-in-progress');
                  card.classList.add('tour-highlight');
                  card.style.zIndex = '99990';
                  card.style.position = 'relative';
                  break;
                }
              }
            }
          } else {
            // Direct highlighting for the card element
            element.classList.add('ticket-card-in-progress');
            element.style.zIndex = '99990';
            element.style.position = 'relative';
          }
        } 
        else if (selector.includes('ticket-card-resolved')) {
          // For ticket summary cards in dashboard
          if (element.classList.contains('ticket-summary-cards')) {
            // Find the specific "Resolved" card within the container
            const cards = element.querySelectorAll('.ticket-card-resolved');
            if (cards.length > 0) {
              // Apply highlighting to the specific card
              cards[0].classList.add('tour-highlight');
              cards[0].style.zIndex = '99990';
              cards[0].style.position = 'relative';
              
              // If the card is wrapped in another div, highlight that too
              const cardWrapper = cards[0].closest('div[style*="flex"]');
              if (cardWrapper && cardWrapper !== element) {
                cardWrapper.classList.add('tour-highlight');
                cardWrapper.style.zIndex = '99990';
              }
            } else {
              // If no direct class match, try to find by content
              const allCards = element.querySelectorAll('div');
              for (let card of allCards) {
                if (card.textContent && 
                    card.textContent.toLowerCase().includes('resolved') && 
                    card.textContent.match(/\d+/)) {
                  card.classList.add('ticket-card-resolved');
                  card.classList.add('tour-highlight');
                  card.style.zIndex = '99990';
                  card.style.position = 'relative';
                  break;
                }
              }
            }
          } else {
            // Direct highlighting for the card element
            element.classList.add('ticket-card-resolved');
            element.style.zIndex = '99990';
            element.style.position = 'relative';
          }
        } 
        else if (selector.includes('ticket-card-closed')) {
          // For ticket summary cards in dashboard
          if (element.classList.contains('ticket-summary-cards')) {
            // Find the specific "Closed" card within the container
            const cards = element.querySelectorAll('.ticket-card-closed');
            if (cards.length > 0) {
              // Apply highlighting to the specific card
              cards[0].classList.add('tour-highlight');
              cards[0].style.zIndex = '99990';
              cards[0].style.position = 'relative';
              
              // If the card is wrapped in another div, highlight that too
              const cardWrapper = cards[0].closest('div[style*="flex"]');
              if (cardWrapper && cardWrapper !== element) {
                cardWrapper.classList.add('tour-highlight');
                cardWrapper.style.zIndex = '99990';
              }
            } else {
              // If no direct class match, try to find by content
              const allCards = element.querySelectorAll('div');
              for (let card of allCards) {
                if (card.textContent && 
                    card.textContent.toLowerCase().includes('closed') && 
                    card.textContent.match(/\d+/)) {
                  card.classList.add('ticket-card-closed');
                  card.classList.add('tour-highlight');
                  card.style.zIndex = '99990';
                  card.style.position = 'relative';
                  break;
                }
              }
            }
          } else {
            // Direct highlighting for the card element
            element.classList.add('ticket-card-closed');
            element.style.zIndex = '99990';
            element.style.position = 'relative';
          }
        } 
        else if (selector.includes('ticket-card-sla-breached')) {
          // For ticket summary cards in dashboard
          if (element.classList.contains('ticket-summary-cards')) {
            // Find the specific "SLA Breached" card within the container
            const cards = element.querySelectorAll('.ticket-card-sla-breached');
            if (cards.length > 0) {
              // Apply highlighting to the specific card
              cards[0].classList.add('tour-highlight');
              cards[0].style.zIndex = '99990';
              cards[0].style.position = 'relative';
              
              // If the card is wrapped in another div, highlight that too
              const cardWrapper = cards[0].closest('div[style*="flex"]');
              if (cardWrapper && cardWrapper !== element) {
                cardWrapper.classList.add('tour-highlight');
                cardWrapper.style.zIndex = '99990';
              }
            } else {
              // If no direct class match, try to find by content
              const allCards = element.querySelectorAll('div');
              for (let card of allCards) {
                if (card.textContent && 
                    (card.textContent.toLowerCase().includes('sla') || 
                     card.textContent.toLowerCase().includes('breach')) && 
                    card.textContent.match(/\d+/)) {
                  card.classList.add('ticket-card-sla-breached');
                  card.classList.add('tour-highlight');
                  card.style.zIndex = '99990';
                  card.style.position = 'relative';
                  break;
                }
              }
            }
          } else {
            // Direct highlighting for the card element
            element.classList.add('ticket-card-sla-breached');
            element.style.zIndex = '99990';
            element.style.position = 'relative';
          }
        }
      } else if (currentPage === 'analyst') {
        // Analyst page specific highlighting
        if (selector.includes('table') || selector.includes('grid') || selector.includes('list')) {
          element.classList.add('analyst-table-highlight');
        } else if (selector.includes('filter') || selector.includes('search')) {
          element.classList.add('analyst-filter-highlight');
        } else if (selector.includes('stats') || selector.includes('metrics') || selector.includes('performance')) {
          element.classList.add('analyst-stats-highlight');
        }
      } else if (currentPage === 'tickets') {
        // Tickets page specific highlighting
        if (selector.includes('filter')) {
          element.classList.add('tickets-filter-highlight');
        } else if (selector.includes('table') || selector.includes('card')) {
          element.classList.add('tickets-table-highlight');
        } else if (selector.includes('pagination')) {
          element.classList.add('tickets-pagination-highlight');
        } else if (selector.includes('refresh')) {
          element.classList.add('tickets-refresh-highlight');
        }
      } else {
        // Generic handling for other pages based on content
        if (element.textContent?.toLowerCase().includes('progress')) {
          element.classList.add('ticket-card-in-progress');
        } else if (element.textContent?.toLowerCase().includes('resolved')) {
          element.classList.add('ticket-card-resolved');
        } else if (element.textContent?.toLowerCase().includes('closed')) {
          element.classList.add('ticket-card-closed');
        } else if (element.textContent?.toLowerCase().includes('breach') || 
                  element.textContent?.toLowerCase().includes('sla')) {
          element.classList.add('ticket-card-sla-breached');
        }
      }

      // Create overlay if it doesn't exist
      if (!overlayRef.current) {
        const overlay = document.createElement('div');
        overlay.className = 'tour-overlay';
        document.body.appendChild(overlay);
        
        // Allow clicking the overlay to close the tour
        overlay.addEventListener('click', (e) => {
          if (e.target === overlay) {
            closeTour();
          }
        });
        
        overlayRef.current = overlay;
      }

      // Get element position and dimensions
      const rect = element.getBoundingClientRect();
      
      // Apply highlight class directly to the element instead of creating a separate highlight div
      if (!element.classList.contains('tour-highlight')) {
        // Remove any existing highlight classes from all elements first
        document.querySelectorAll('.tour-highlight').forEach(el => {
          el.classList.remove('tour-highlight');
          el.style.filter = '';
          el.style.webkitFilter = '';
          el.style.backdropFilter = '';
          el.style.webkitBackdropFilter = '';
        });
        
        // Apply the highlight class
        element.classList.add('tour-highlight');
        
        // Ensure no filter effect on the highlighted element or its children
        element.style.filter = 'none !important';
        element.style.webkitFilter = 'none !important';
        element.style.backdropFilter = 'none !important';
        element.style.webkitBackdropFilter = 'none !important';
        element.style.zIndex = '10000';
        element.style.position = 'relative';
          
        // Also ensure children don't have filter effects
        const children = element.querySelectorAll('*');
        children.forEach(child => {
          child.style.filter = 'none !important';
          child.style.webkitFilter = 'none !important';
          child.style.backdropFilter = 'none !important';
          child.style.webkitBackdropFilter = 'none !important';
        });
      }
      
      // Create highlight if needed for positioning (invisible but used for positioning)
      if (!highlightRef.current) {
        const highlight = document.createElement('div');
        highlight.style.position = 'fixed';
        highlight.style.border = 'none';
        highlight.style.backgroundColor = 'transparent';
        highlight.style.pointerEvents = 'none';
        highlight.style.zIndex = '9999';
        highlight.style.opacity = '0';
        document.body.appendChild(highlight);
        highlightRef.current = highlight;
      }
      
      // Position the highlight
      if (highlightRef.current) {
        highlightRef.current.style.top = `${rect.top - 4}px`;
        highlightRef.current.style.left = `${rect.left - 4}px`;
        highlightRef.current.style.width = `${rect.width + 8}px`;
        highlightRef.current.style.height = `${rect.height + 8}px`;
      }
      
      // Get tooltip dimensions
      const tooltipWidth = tooltipRef.current ? tooltipRef.current.offsetWidth : 360; // Wider tooltip
      const tooltipHeight = tooltipRef.current ? tooltipRef.current.offsetHeight : 240; // Taller tooltip
      
      // Get viewport dimensions
      const viewportHeight = window.innerHeight;
      const viewportWidth = window.innerWidth;
      
      // Determine best position for tooltip
      let newPosition = {};
      let newArrowPosition = 'none';
      
      // Special handling for chart elements that might expand
      const isExpandableElement = selector.includes('trend') || 
                               selector.includes('chart') || 
                               element.querySelector('canvas, svg') !== null;
      
      // For elements likely to expand, prefer positioning to sides
      if (isExpandableElement) {
        // Try right side first
        if (rect.right + tooltipWidth + 20 < viewportWidth) {
          newPosition = {
            top: `${rect.top + 10}px`,  // Position near the top of the chart
            left: `${rect.right + 15}px`,
            transform: 'none'
          };
          newArrowPosition = 'left';
        } 
        // Try left side if right doesn't work
        else if (rect.left - tooltipWidth - 20 > 0) {
          newPosition = {
            top: `${rect.top + 10}px`,  // Position near the top of the chart
            left: `${rect.left - tooltipWidth - 15}px`,
            transform: 'none'
          };
          newArrowPosition = 'right';
        }
        // If sides don't work, try above the element
        else if (rect.top - tooltipHeight - 20 > 0) {
          newPosition = {
            top: `${rect.top - tooltipHeight - 15}px`,
            left: `${rect.left + Math.min(rect.width/4, 100)}px`, // Offset from left to avoid overlap
            transform: 'none'
          };
          newArrowPosition = 'bottom';
        }
        // Fallback to below with offset
        else {
          newPosition = {
            top: `${rect.bottom + 15}px`,
            left: `${rect.left + Math.min(rect.width/4, 100)}px`, // Offset from left to avoid overlap
            transform: 'none'
          };
          newArrowPosition = 'top';
        }
      }
      // For standard elements, use normal positioning logic
      else {
        // Try to position below the element
        if (rect.bottom + tooltipHeight + 20 < viewportHeight) {
          newPosition = {
            top: `${rect.bottom + 15}px`,
            left: `${rect.left + rect.width/2 - tooltipWidth/2}px`,
            transform: 'none'
          };
          newArrowPosition = 'top';
        }
        // Try to position above the element
        else if (rect.top - tooltipHeight - 20 > 0) {
          newPosition = {
            top: `${rect.top - tooltipHeight - 15}px`,
            left: `${rect.left + rect.width/2 - tooltipWidth/2}px`,
            transform: 'none'
          };
          newArrowPosition = 'bottom';
        }
        // Try to position to the right
        else if (rect.right + tooltipWidth + 20 < viewportWidth) {
          newPosition = {
            top: `${rect.top + rect.height/2 - tooltipHeight/2}px`,
            left: `${rect.right + 15}px`,
            transform: 'none'
          };
          newArrowPosition = 'left';
        }
        // Try to position to the left
        else if (rect.left - tooltipWidth - 20 > 0) {
          newPosition = {
            top: `${rect.top + rect.height/2 - tooltipHeight/2}px`,
            left: `${rect.left - tooltipWidth - 15}px`,
            transform: 'none'
          };
          newArrowPosition = 'right';
        }
        // Fallback to center position
        else {
          newPosition = {
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)'
          };
          newArrowPosition = 'none';
        }
      }
      
      // Make sure tooltip is within viewport bounds
      if (parseFloat(newPosition.left) < 10) {
        newPosition.left = '10px';
      }
      if (parseFloat(newPosition.left) + tooltipWidth > viewportWidth - 10) {
        newPosition.left = `${viewportWidth - tooltipWidth - 10}px`;
      }
      if (parseFloat(newPosition.top) < 10) {
        newPosition.top = '10px';
      }
      if (parseFloat(newPosition.top) + tooltipHeight > viewportHeight - 10) {
        newPosition.top = `${viewportHeight - tooltipHeight - 10}px`;
      }
      
      setPosition(newPosition);
      setArrowPosition(newArrowPosition);
      
      // Scroll element into view if needed
      element.scrollIntoView({
        behavior: 'smooth',
        block: 'center'
      });
      
    } catch (error) {
      console.error("Error positioning tooltip:", error);
    }
  };

  // Position immediately and on window resize
  useEffect(() => {
    if (isTourOpen && tourSteps[tourStep]?.selector) {
      // Clean up all highlights before applying new ones
      const cleanupHighlights = () => {
        console.log('Cleaning up all highlights');
        
        // Remove general highlight class
        document.querySelectorAll('.tour-highlight').forEach(elem => {
          elem.classList.remove('tour-highlight');
          
          // Also remove any inline styles we might have added
          if (elem.style) {
            elem.style.zIndex = '';
            elem.style.position = '';
            elem.style.transform = '';
            elem.style.filter = '';
            elem.style.webkitFilter = '';
            elem.style.backdropFilter = '';
            elem.style.webkitBackdropFilter = '';
            elem.style.boxShadow = '';
            elem.style.outline = '';
            elem.style.outlineOffset = '';
            elem.style.animation = '';
          }
        });
        
        // Remove dashboard ticket card classes
        document.querySelectorAll('.ticket-card-in-progress, .ticket-card-resolved, .ticket-card-closed, .ticket-card-sla-breached').forEach(elem => {
          // Don't remove the base class if it's a genuine ticket card
          // Only remove if it was added as part of the tour
          if (elem.classList.contains('tour-highlight')) {
            elem.classList.remove('ticket-card-in-progress');
            elem.classList.remove('ticket-card-resolved');
            elem.classList.remove('ticket-card-closed');
            elem.classList.remove('ticket-card-sla-breached');
          }
          
          // Always remove inline styles
          if (elem.style) {
            elem.style.zIndex = '';
            elem.style.position = '';
            elem.style.transform = '';
            elem.style.filter = '';
            elem.style.webkitFilter = '';
            elem.style.backdropFilter = '';
            elem.style.webkitBackdropFilter = '';
            elem.style.boxShadow = '';
            elem.style.outline = '';
            elem.style.outlineOffset = '';
            elem.style.animation = '';
          }
        });
        
        // Remove analyst page classes
        document.querySelectorAll('.analyst-table-highlight, .analyst-filter-highlight, .analyst-stats-highlight').forEach(elem => {
          elem.classList.remove('analyst-table-highlight');
          elem.classList.remove('analyst-filter-highlight');
          elem.classList.remove('analyst-stats-highlight');
          
          if (elem.style) {
            elem.style.zIndex = '';
            elem.style.position = '';
            elem.style.transform = '';
            elem.style.filter = '';
            elem.style.webkitFilter = '';
            elem.style.backdropFilter = '';
            elem.style.webkitBackdropFilter = '';
            elem.style.boxShadow = '';
            elem.style.outline = '';
            elem.style.outlineOffset = '';
            elem.style.animation = '';
          }
        });
        
        // Remove tickets page classes
        document.querySelectorAll('.tickets-filter-highlight, .tickets-table-highlight, .tickets-pagination-highlight, .tickets-refresh-highlight').forEach(elem => {
          elem.classList.remove('tickets-filter-highlight');
          elem.classList.remove('tickets-table-highlight');
          elem.classList.remove('tickets-pagination-highlight');
          elem.classList.remove('tickets-refresh-highlight');
          
          if (elem.style) {
            elem.style.zIndex = '';
            elem.style.position = '';
            elem.style.transform = '';
            elem.style.filter = '';
            elem.style.webkitFilter = '';
            elem.style.backdropFilter = '';
            elem.style.webkitBackdropFilter = '';
            elem.style.boxShadow = '';
            elem.style.outline = '';
            elem.style.outlineOffset = '';
            elem.style.animation = '';
          }
        });
      };
      
      // Clean up existing highlights
      cleanupHighlights();
      
      // Position the tooltip for the new step
      positionTooltip();

      // Set up interval to check and reapply highlights if removed
      const highlightInterval = setInterval(() => {
        const selector = tourSteps[tourStep].selector;
        const element = document.querySelector(selector);
        if (element && !element.classList.contains('tour-highlight')) {
          // If the element exists but highlight is gone, reapply it
          positionTooltip();
        }
      }, 300);
      
      // Add event listeners
      window.addEventListener('resize', positionTooltip);
      window.addEventListener('scroll', positionTooltip, true);
      
      return () => {
        clearInterval(highlightInterval);
        window.removeEventListener('resize', positionTooltip);
        window.removeEventListener('scroll', positionTooltip, true);
        cleanupHighlights();
      };
    }
  }, [isTourOpen, tourStep, tourSteps, currentPage]);
  
  // Clean up overlay and highlight on unmount or when tour closes
  useEffect(() => {
    return () => {
      // Remove overlay if it exists
      if (overlayRef.current) {
        document.body.removeChild(overlayRef.current);
        overlayRef.current = null;
      }
      
      // Remove highlight if it exists
      if (highlightRef.current) {
        document.body.removeChild(highlightRef.current);
        highlightRef.current = null;
      }
      
      // Remove tour-highlight class from any elements
      document.querySelectorAll('.tour-highlight').forEach(elem => {
        elem.classList.remove('tour-highlight');
        elem.classList.remove('ticket-card-in-progress');
        elem.classList.remove('ticket-card-resolved');
        elem.classList.remove('ticket-card-closed');
        elem.classList.remove('ticket-card-sla-breached');
      });
    };
  }, []);
  
  useEffect(() => {
    if (!isTourOpen) {
      // Remove overlay if it exists
      if (overlayRef.current) {
        document.body.removeChild(overlayRef.current);
        overlayRef.current = null;
      }
      
      // Remove highlight if it exists
      if (highlightRef.current) {
        document.body.removeChild(highlightRef.current);
        highlightRef.current = null;
      }
      
      // Remove tour-highlight class from any elements
      document.querySelectorAll('.tour-highlight').forEach(elem => {
        elem.classList.remove('tour-highlight');
        elem.classList.remove('ticket-card-in-progress');
        elem.classList.remove('ticket-card-resolved');
        elem.classList.remove('ticket-card-closed');
        elem.classList.remove('ticket-card-sla-breached');
      });
    }
  }, [isTourOpen]);
  
  if (!isTourOpen) return null;
  
  // Get arrow styles based on position
  const getArrowStyle = () => {
    const baseStyle = {
      position: 'absolute',
      width: '20px',
      height: '20px',
      backgroundColor: 'white',
    };
    
    switch (arrowPosition) {
      case 'top':
        return {
          ...baseStyle,
          top: '-10px',
          left: '50%',
          transform: 'translateX(-50%) rotate(45deg)',
          borderTop: '1px solid #e0e0e0',
          borderLeft: '1px solid #e0e0e0',
        };
      case 'bottom':
        return {
          ...baseStyle,
          bottom: '-10px',
          left: '50%',
          transform: 'translateX(-50%) rotate(45deg)',
          borderBottom: '1px solid #e0e0e0',
          borderRight: '1px solid #e0e0e0',
        };
      case 'left':
        return {
          ...baseStyle,
          left: '-10px',
          top: '50%',
          transform: 'translateY(-50%) rotate(45deg)',
          borderLeft: '1px solid #e0e0e0',
          borderBottom: '1px solid #e0e0e0',
        };
      case 'right':
        return {
          ...baseStyle,
          right: '-10px',
          top: '50%',
          transform: 'translateY(-50%) rotate(45deg)',
          borderRight: '1px solid #e0e0e0',
          borderTop: '1px solid #e0e0e0',
        };
      default:
        return { display: 'none' };
    }
  };
  
  // Get icon for the current step
  const getStepIcon = () => {
    const title = tourSteps[tourStep]?.title?.toLowerCase() || '';
    
    if (title.includes('dashboard')) return '📊';
    if (title.includes('ticket') && title.includes('management')) return '🎫';
    if (title.includes('analyst')) return '👨‍💻';
    if (title.includes('upload')) return '📤';
    if (title.includes('export')) return '📥';
    if (title.includes('filter')) return '🔍';
    if (title.includes('progress')) return '⏳';
    if (title.includes('resolved')) return '✅';
    if (title.includes('closed')) return '🔒';
    if (title.includes('sla')) return '⚠️';
    if (title.includes('trend')) return '📈';
    if (title.includes('source')) return '📱';
    if (title.includes('status')) return '📋';
    
    return '💡';
  };
  
  return (
    <div 
      ref={tooltipRef}
      style={{
        position: 'fixed',
        top: position.top,
        left: position.left,
        transform: position.transform,
        backgroundColor: 'white',
        padding: '0',
        borderRadius: '12px',
        boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
        zIndex: 999999, // Highest possible z-index to ensure it's above all elements
        maxWidth: '420px',
        width: '360px',
        transition: 'all 0.3s ease',
        overflow: 'hidden',
        border: '1px solid rgba(230, 235, 241, 0.8)',
        pointerEvents: 'auto' // Ensure it can be clicked
      }}
    >
      {/* Arrow pointing to the element */}
      <div style={getArrowStyle()}></div>
      
      {/* Tour header */}
      <div style={{
        backgroundColor: '#f8fafc',
        borderBottom: '1px solid #e6ebf1',
        padding: '15px 20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <span style={{ 
            fontSize: '24px', 
            marginRight: '10px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '40px',
            height: '40px',
            borderRadius: '8px',
            backgroundColor: '#eef2ff',
            color: '#1d4ed8'
          }}>
            {getStepIcon()}
          </span>
          <h3 style={{ 
            color: '#1e293b', 
            margin: 0, 
            fontSize: '18px', 
            fontWeight: '600',
            lineHeight: '1.4'
          }}>
            {tourSteps[tourStep]?.title || 'Welcome to the tour!'}
          </h3>
        </div>
        {/* Close button */}
        <button 
          onClick={closeTour}
          style={{
            background: 'none',
            border: 'none',
            fontSize: '24px',
            cursor: 'pointer',
            color: '#94a3b8',
            padding: '0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '32px',
            height: '32px',
            borderRadius: '16px',
            transition: 'all 0.2s'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#f1f5f9';
            e.currentTarget.style.color = '#64748b';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
            e.currentTarget.style.color = '#94a3b8';
          }}
        >
          ×
        </button>
      </div>
      
      {/* Tour content */}
      <div style={{ 
        padding: '20px',
        fontSize: '15px', 
        lineHeight: '1.6', 
        color: '#334155', 
        maxHeight: '220px', 
        overflowY: 'auto',
        borderBottom: '1px solid #e6ebf1'
      }}>
        {tourSteps[tourStep]?.content || 'Learn about the features of this page.'}
      </div>
      
      {/* Footer with progress indicator and navigation buttons */}
      <div style={{ 
        padding: '15px 20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px'
      }}>
        {/* Progress indicator */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center',
          alignItems: 'center',
          gap: '4px'
        }}>
          {tourSteps.map((_, i) => (
            <div 
              key={i} 
              onClick={() => setTourStep(i)}
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                backgroundColor: i === tourStep ? '#2563eb' : '#cbd5e1',
                margin: '0 3px',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                transform: i === tourStep ? 'scale(1.3)' : 'scale(1)'
              }}
            />
          ))}
        </div>
        
        {/* Navigation buttons */}
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '10px' }}>
          <button 
            onClick={() => setTourStep(Math.max(0, tourStep - 1))}
            disabled={tourStep === 0}
            style={{
              flex: '1',
              padding: '10px 16px',
              backgroundColor: tourStep === 0 ? '#f1f5f9' : '#f8fafc',
              color: tourStep === 0 ? '#94a3b8' : '#475569',
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
              cursor: tourStep === 0 ? 'not-allowed' : 'pointer',
              fontSize: '14px',
              fontWeight: '500',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              if (tourStep !== 0) {
                e.currentTarget.style.backgroundColor = '#f1f5f9';
              }
            }}
            onMouseLeave={(e) => {
              if (tourStep !== 0) {
                e.currentTarget.style.backgroundColor = '#f8fafc';
              }
            }}
          >
            Previous
          </button>
          {tourStep < tourSteps.length - 1 ? (
            <button 
              onClick={() => setTourStep(tourStep + 1)}
              style={{
                flex: '1',
                padding: '10px 16px',
                backgroundColor: '#2563eb',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#1d4ed8';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#2563eb';
              }}
            >
              Next
            </button>
          ) : (
            <button 
              onClick={closeTour}
              style={{
                flex: '1',
                padding: '10px 16px',
                backgroundColor: '#16a34a',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#15803d';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#16a34a';
              }}
            >
              Finish
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default RealTourComponent;