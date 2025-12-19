import React, { useEffect, useState } from 'react';
import { Link, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, Ticket, Users, Upload, LogOut, Download } from 'lucide-react';
import LogoutButton from '../../auth/LogoutButton.jsx';
import CreateTicketManualEntry from "../../maker/CreateTicketManualEntry.jsx";
import ViewTicketManualEntry from "../../maker/ViewTicketManualEntry.jsx";
import axiosClient from '@/utils/AxiosClient.jsx';

const AdminSidebar = ({ onClose, onOpenCreateTicketModal, onViewTickets}) => {
  const navigate = useNavigate();
  const location = useLocation();

  const [profileName, setProfileName] = useState(''); // <-- Add state for name

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await axiosClient.get('/profile', { withCredentials: true });
        setProfileName(res.data.data.name || 'Admin'); 
      } catch (err) {
        setProfileName('Admin');
      }
    };
    fetchProfile();
  }, []);

  return (
    <div className="w-64 bg-white shadow-lg h-screen fixed top-0 left-0 z-40 flex flex-col justify-between rounded-r-xl border-r border-gray-200">
      <div>
        {/* Header with Close */}
        <div className="flex items-center justify-between p-4 border-b rounded-tr-xl">
          <h1 className="text-xl font-extrabold text-gray-900 tracking-wide">
            {profileName ? profileName : "Admin"}
          </h1>
          <button
            onClick={onClose}
            className="text-2xl text-gray-400 hover:text-red-500 transition-colors"
            aria-label="Close Sidebar"
          >
            ×
          </button>
        </div>

        {/* Navigation Links */}
        <div className="p-4 space-y-2 font-medium">
          <Link
            to="/admindashboard"
            className={`group text-lg flex items-center px-3 py-2 rounded-lg transition-colors ${
              location.pathname === '/admindashboard' || location.pathname === '/admindashboard/'
                ? 'bg-blue-100 text-blue-700 font-semibold'
                : 'hover:text-blue-700 hover:bg-blue-50'
            }`}
          >
            <LayoutDashboard className={`w-5 h-5 mr-3 ${
              location.pathname === '/admindashboard' || location.pathname === '/admindashboard/'
                ? 'text-blue-700'
                : 'text-black group-hover:text-blue-700'
            } transition-colors`} /> Dashboard
          </Link>
          <Link
            to="/adminticket"
            className={`group text-lg flex items-center px-3 py-2 rounded-lg transition-colors ${
              location.pathname === '/adminticket' || location.pathname === '/adminticket/'
                ? 'bg-blue-100 text-blue-700 font-semibold'
                : 'hover:text-blue-700 hover:bg-blue-50'
            }`}
          >
            <Ticket className={`w-5 h-5 mr-3 ${
              location.pathname === '/adminticket' || location.pathname === '/adminticket/'
                ? 'text-blue-700'
                : 'text-black group-hover:text-blue-700'
            } transition-colors`} /> Tickets
          </Link>
          <Link
            to="/adminanalyst"
            className={`group text-lg flex items-center px-3 py-2 rounded-lg transition-colors ${
              location.pathname === '/adminanalyst' || location.pathname === '/adminanalyst/'
                ? 'bg-blue-100 text-blue-700 font-semibold'
                : 'hover:text-blue-700 hover:bg-blue-50'
            }`}
          >
            <Users className={`w-5 h-5 mr-3 ${
              location.pathname === '/adminanalyst' || location.pathname === '/adminanalyst/'
                ? 'text-blue-700'
                : 'text-black group-hover:text-blue-700'
            } transition-colors`} /> Analyst
          </Link>
          <Link
            to="/adminupload"
            className={`group text-lg flex items-center px-3 py-2 rounded-lg transition-colors ${
              location.pathname === '/adminupload' || location.pathname === '/adminupload/'
                ? 'bg-blue-100 text-blue-700 font-semibold'
                : 'hover:text-blue-700 hover:bg-blue-50'
            }`}
          >
            <Upload className={`w-5 h-5 mr-3 ${
              location.pathname === '/adminupload' || location.pathname === '/adminupload/'
                ? 'text-blue-700'
                : 'text-black group-hover:text-blue-700'
            } transition-colors`} /> Upload
          </Link>

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
  } transition-colors`} /> Manual Tickets
</button> */}
          {/* Export Tickets Link */}
          <Link
            to="/admin/export-tickets"
            className={`group text-lg flex items-center px-3 py-2 rounded-lg transition-colors ${
              location.pathname === '/admin/export-tickets' || location.pathname === '/admin/export-tickets/'
                ? 'bg-blue-100 text-blue-700 font-semibold'
                : 'hover:text-blue-700 hover:bg-blue-50'
            }`}
          >
            <Download className={`w-5 h-5 mr-3 ${
              location.pathname === '/admin/export-tickets' || location.pathname === '/admin/export-tickets/'
                ? 'text-blue-700'
                : 'text-black group-hover:text-blue-700'
            } transition-colors`} /> Export Tickets
          </Link>
        </div>
      </div>

      {/* Beautified Footer */}
      <div className="p-4 border-t bg-blue-50 rounded-b-xl">
        <LogoutButton />
      </div>
    </div>
  );
};

export default AdminSidebar;