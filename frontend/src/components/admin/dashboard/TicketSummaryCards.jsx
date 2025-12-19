import React from "react";
import { FaSpinner, FaCheckCircle, FaExclamationTriangle, FaThumbsUp } from "react-icons/fa";

const cardConfig = [
  {
    label: "In Progress",
    icon: <FaSpinner size={24} />,
    background: "linear-gradient(135deg, #ffb74d 0%, #f57c00 100%)",
    color: "#fff",
    className: "ticket-card-in-progress",
  },
  {
    label: "Resolved",
    icon: <FaThumbsUp size={24} />,
    background: "linear-gradient(135deg, #9575cd 0%, #5e35b1 100%)",
    color: "#fff",
    className: "ticket-card-resolved",
  },
  {
    label: "Closed",
    icon: <FaCheckCircle size={24} />,
    background: "linear-gradient(135deg, #81c784 0%, #388e3c 100%)",
    color: "#fff",
    className: "ticket-card-closed",
  },
  {
    label: "SLA Breached",
    icon: <FaExclamationTriangle size={24} />,
    background: "linear-gradient(135deg, #e57373 0%, #d32f2f 100%)",
    color: "#fff",
    className: "ticket-card-sla-breached",
  },
];

const SummaryCard = React.memo(({ label, value, icon, background, color, className }) => (
  <div
    className={className}
    style={{
      flex: "1 1 220px",
      minWidth: "220px",
      padding: "24px 20px",
      borderRadius: "16px",
      background,
      color,
      boxShadow: "0 6px 20px rgba(0,0,0,0.08)",
      display: "flex",
      alignItems: "center",
      transition: "transform 0.2s, box-shadow 0.2s",
      cursor: "pointer",
    }}
    onMouseEnter={e => {
      e.currentTarget.style.transform = "translateY(-5px)";
      e.currentTarget.style.boxShadow = "0 12px 28px rgba(0,0,0,0.12)";
    }}
    onMouseLeave={e => {
      e.currentTarget.style.transform = "translateY(0)";
      e.currentTarget.style.boxShadow = "0 6px 20px rgba(0,0,0,0.08)";
    }}
  >
    <div
      style={{
        padding: "14px",
        borderRadius: "50%",
        background: "rgba(255,255,255,0.2)",
        marginRight: "20px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {icon}
    </div>
    <div>
      <div style={{ fontSize: "2.2rem", fontWeight: 700, letterSpacing: "0.5px" }}>
        <span>{value || 0}</span>
      </div>
      <div style={{ fontSize: "0.95rem", opacity: 0.85, fontWeight: 500 }}>{label}</div>
    </div>
  </div>
));

const TicketSummaryCards = React.memo(({ inProgress, resolved, closed, slaBreached, onCardClick }) => {
  const items = [
    { label: "In Progress", value: inProgress },
    { label: "Resolved", value: resolved },
    { label: "Closed", value: closed },
    { label: "SLA Breached", value: slaBreached },
  ];

  return (
    <div className="ticket-summary-cards" style={{ display: "flex", gap: "24px", flexWrap: "wrap", marginBottom: "24px" }}>
      {items.map((item, idx) => {
        const config = cardConfig[idx];
        return (
          <div key={item.label} onClick={() => onCardClick && onCardClick(item.label)} style={{flex: "1 1 220px", minWidth: "220px", padding: "0", background: "none", border: "none"}}>
            <SummaryCard
              label={item.label}
              value={item.value}
              icon={config.icon}
              background={config.background}
              color={config.color}
              className={config.className}
            />
          </div>
        );
      })}
    </div>
  );
});

export default TicketSummaryCards;