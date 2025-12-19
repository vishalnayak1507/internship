import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Ticket, Users, Upload, LogOut } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import LogoutButton from '../auth/LogoutButton.jsx';
import axiosClient from '../../utils/AxiosClient.jsx';


const Sidebar = ({ onClose,onMyTickets,showModal }) => {
  const navigate = useNavigate();

  const [profileName, setProfileName] = useState(''); // <-- Add state for name

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await axiosClient.get('/profile', { withCredentials: true });
        setProfileName(res.data.data.name || 'Maker'); 
      } catch (err) {
        setProfileName('Maker');
      }
    };
    fetchProfile();
  }, []);

  const location = useLocation();
  return (
    <div className="w-64 bg-white shadow-lg h-screen fixed top-0 left-0 z-40 flex flex-col justify-between rounded-r-xl border-r border-gray-200">
      <div>
        {/* Header with Close */}
        <div className="flex items-center justify-between p-4 border-b rounded-tr-xl">
          <h1 className="text-xl font-extrabold text-gray-900 tracking-wide">
            {profileName ? profileName : "Maker"}
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
      {/* Manual Entry tab */}
      <button
        type="button"
        className={`group text-lg flex items-center px-3 py-2 rounded-lg transition-colors w-full text-left ${
          !showModal
            ? "bg-blue-100 text-blue-700 font-bold"
            : "text-blue-700 font-bold"
        }`}
        disabled={location.pathname === "/manual_entry"}
      >
        <LayoutDashboard className={`w-5 h-5 mr-3 text-blue-700 transition-colors`} />
        Manual Entry
      </button>

      {/* My Tickets tab */}
      <button
        type="button"
        onClick={typeof onMyTickets === "function" ? onMyTickets : undefined}
        className={`group text-lg flex items-center px-3 py-2 rounded-lg transition-colors w-full text-left ${
          showModal ? "bg-blue-100 text-blue-700 font-bold" : "hover:text-blue-700"
        }`}
      >
        <Ticket className="w-5 h-5 mr-3 text-black group-hover:text-blue-700 transition-colors" /> My Tickets
      </button>
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
