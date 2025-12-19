import React from "react";
import ReactModal from "react-modal";

export default function ViewTicketsModal({ isOpen, onRequestClose, tickets }) {
  return (
    <ReactModal
      isOpen={isOpen}
      onRequestClose={onRequestClose}
      ariaHideApp={false}
      className="max-w-4xl mx-auto my-12 bg-white rounded-2xl shadow-xl p-8 outline-none"
      overlayClassName="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50"
    >
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-blue-800">My Tickets</h2>
        <button
          onClick={onRequestClose}
          className="text-2xl text-gray-400 hover:text-gray-700 font-bold"
        >
          ×
        </button>
      </div>
      <div className="space-y-3 max-h-[60vh] overflow-y-auto">
        {tickets && tickets.length > 0 ? (
          tickets.map(ticket => (
            <div
              key={ticket.ticketNumber}
              className="border border-blue-100 rounded-xl p-4 shadow-sm bg-gradient-to-r from-white to-blue-50"
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-semibold text-blue-900">{ticket.customerName}</div>
                  <div className="text-sm text-blue-700">{ticket.customerEmail}</div>
                  <div className="text-xs text-slate-500">{ticket.customerPhoneNumber}</div>
                </div>
                <div className="text-xs text-blue-600 font-semibold">
                  {ticket.status}
                </div>
              </div>
              <div className="mt-2 text-sm text-blue-800">
                <span className="font-semibold">Description: </span>
                {ticket.description}
              </div>
              {/* Add more ticket details as needed */}
            </div>
          ))
        ) : (
          <div className="text-center text-blue-700">No tickets found.</div>
        )}
      </div>
    </ReactModal>
  );
}