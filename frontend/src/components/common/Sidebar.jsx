import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Ticket, Users, Upload, LogOut } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import LogoutButton from '../auth/LogoutButton.jsx';
import axiosClient from '../../utils/AxiosClient.jsx'; 

export const Sidebar = ({ onClose, onOpenCreateTicketModal, onViewTickets }) => {
  const [canUpload, setCanUpload] = useState(false);
  const [profileName, setProfileName] = useState('');

  const location = useLocation();
  
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await axiosClient.get('/profile', { withCredentials: true });

        setCanUpload(res.data.data.canUpload === true);
        setProfileName(res.data.data.name || 'Analyst');
        console.log('canUpload:', canUpload);
      } catch (err) {
        setCanUpload(false);
        setProfileName('Analyst');
      }
    };
    fetchProfile();
  }, []);
  return (
    <div
      className={
        "z-40 flex flex-col justify-between h-screen bg-white shadow-lg border-r border-gray-200 rounded-r-xl transition-all duration-300 w-64 " +
        "fixed top-0 left-0"
      }
    >
      <div>
        {/* Header with Close */}
        <div className="flex items-center justify-between p-4 border-b rounded-tr-xl">
          <h1 className="text-xl font-extrabold text-gray-900 tracking-wide">
            {profileName ? profileName : 'Analyst'}
          </h1>
          {onClose && (
            <button
              onClick={onClose}
              className="text-2xl text-gray-400 hover:text-red-500 transition-colors"
              aria-label="Close Sidebar"
            >
              ×
            </button>
          )}
        </div>

        {/* Navigation Links */}
        <div className="p-4 space-y-2 font-medium">

          <Link
            to="/analyst"
            className={`group text-lg flex items-center px-3 py-2 rounded-lg transition-colors ${
              location.pathname === '/analyst' || location.pathname === '/analyst/'
                ? 'bg-blue-100 text-blue-700 font-semibold'
                : 'hover:text-blue-700 hover:bg-blue-50'
            }`}
          >
            <Ticket className={`w-5 h-5 mr-3 ${
              location.pathname === '/analyst' || location.pathname === '/analyst/'
                ? 'text-blue-700'
                : 'text-black group-hover:text-blue-700'
            } transition-colors`} /> 
            My Tickets
          </Link>
          {canUpload && (
            <Link
              to="/analystupload"
              className={`group text-lg flex items-center px-3 py-2 rounded-lg transition-colors ${
                location.pathname === '/analystupload' || location.pathname === '/analystupload/'
                  ? 'bg-blue-100 text-blue-700 font-semibold'
                  : 'hover:text-blue-700 hover:bg-blue-50'
              }`}
            >
              <Upload className={`w-5 h-5 mr-3 ${
                location.pathname === '/analystupload' || location.pathname === '/analystupload/'
                  ? 'text-blue-700'
                  : 'text-black group-hover:text-blue-700'
              } transition-colors`} /> 
              Upload
            </Link>
          )}
          {/* <button
            type="button"
            onClick={onViewTickets}
            className={`w-full text-left group text-lg flex items-center px-3 py-2 rounded-lg transition-colors ${
              false // Add condition to determine if this button is "active"
                ? 'bg-blue-100 text-blue-700 font-semibold'
                : 'hover:text-blue-700 hover:bg-blue-50'
            }`}
          >
            <Ticket className={`w-5 h-5 mr-3 ${
              false // Same condition as above
                ? 'text-blue-700'
                : 'text-black group-hover:text-blue-700'
            } transition-colors`} /> 
            Manual Tickets
          </button> */}
        </div>
      </div>

      {/* Beautified Footer */}
      <div className="p-4 border-t bg-blue-50 rounded-b-xl">
        <LogoutButton />
      </div>
    </div>
  );
};

export default Sidebar;
 
