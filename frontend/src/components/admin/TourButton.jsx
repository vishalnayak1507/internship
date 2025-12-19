import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { HelpCircle } from 'lucide-react';
import { useTour } from '../../utils/admin/TourContext';

const TourButton = () => {
  const location = useLocation();
  const { openTour } = useTour();
  const [isPulsing, setIsPulsing] = useState(true);
  const [currentPage, setCurrentPage] = useState('');
  
  // Stop pulsing animation after user has seen it a few times
  useEffect(() => {
    const visitCount = parseInt(localStorage.getItem('tour_visit_count') || '0');
    if (visitCount > 3) {
      setIsPulsing(false);
    } else {
      localStorage.setItem('tour_visit_count', (visitCount + 1).toString());
    }
  }, []);
  
  // Determine which page we're on whenever the route changes
  useEffect(() => {
    const page = getCurrentPage();
    setCurrentPage(page);
  }, [location.pathname]);
  
  const getCurrentPage = () => {
    const path = location.pathname;
    
    if (path.includes('/admindashboard')) return 'dashboard';
    if (path.includes('/adminticket')) return 'tickets';
    if (path.includes('/adminanalyst')) return 'analyst';
    if (path.includes('/adminupload')) return 'upload';
    if (path.includes('/admin/export-tickets')) return 'export';
    
    // Additional admin routes can be added here
    
    return '';
  };
  
  const handleStartTour = () => {
    // Stop pulsing once user starts the tour
    setIsPulsing(false);
    localStorage.setItem('tour_visit_count', '5'); // Set to high number to stop pulsing
    
    const page = getCurrentPage();
    if (page) {
      openTour(page);
    } else {
      // If we're on an unknown page, default to dashboard tour
      openTour('dashboard');
    }
  };
  
  return (
    <div className="relative">
      <button
        onClick={handleStartTour}
        className={`flex items-center justify-center h-10 w-10 rounded-full bg-blue-50 hover:bg-blue-100 transition-colors`}
        title={`Start ${currentPage ? currentPage.charAt(0).toUpperCase() + currentPage.slice(1) : 'Interactive'} Tour Guide`}
        aria-label="Start guided tour"
        style={{
          boxShadow: isPulsing ? '0 0 0 rgba(25, 118, 210, 0.4)' : 'none',
        }}
      >
        <HelpCircle className="h-5 w-5 text-blue-700" />
      </button>
      
      {/* Pulsing effect for the button */}
      {isPulsing && (
        <span 
          className="absolute inset-0 rounded-full"
          style={{
            animation: 'pulseTourBtn 2s infinite',
            backgroundColor: 'rgba(25, 118, 210, 0.3)',
            zIndex: -1
          }}
        />
      )}
      
      {/* Animation keyframes */}
      <style dangerouslySetInnerHTML={{
        __html: `
          @keyframes pulseTourBtn {
            0% {
              transform: scale(1);
              opacity: 0.6;
            }
            70% {
              transform: scale(1.5);
              opacity: 0;
            }
            100% {
              transform: scale(1.5);
              opacity: 0;
            }
          }
        `
      }} />
      
      {/* Small badge that says "Tour" */}
      <span
        className="absolute -bottom-2 -right-2 bg-blue-600 text-white text-xs px-2 py-0.5 rounded-full"
        style={{ fontSize: '8px', fontWeight: 'bold' }}
      >
        TOUR
      </span>
    </div>
  );
};

export default TourButton;
