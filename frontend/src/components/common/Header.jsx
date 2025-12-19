import React from "react";
import { FaArrowLeft, FaTicketAlt, FaUserCircle } from "react-icons/fa";
import ProfileButton from './ProfileButton.jsx';

export default function Header({ user, onBack, onMyTickets, logo }) {
  return (
    <div className="w-full bg-blue-100 shadow-md px-8 py-4 flex justify-between items-center border-b">
      <div className="flex items-center gap-4">
        <button
          onClick={onBack}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-600 text-white px-5 py-3 rounded-lg text-sm font-medium transition-transform duration-200 transform hover:scale-105"
        >
          <FaArrowLeft size={16} />
        </button>
        <img src={logo} alt="Tech Mahindra" className="h-[40px]" />
      </div>
      <div className="flex items-center gap-4">
        <button
          onClick={onMyTickets}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-transform duration-200 transform hover:scale-105"
        >
          <FaTicketAlt />
          My Tickets
        </button>
        <div className="relative group cursor-pointer transition-transform hover:scale-105">
          <ProfileButton />
        </div>
      </div>
    </div>
  );
}