// frontend/src/components/common/LoadingSpinner.jsx
import React from "react";

const LoadingSpinner = () => (
  <div style={{ 
    display: "flex", 
    justifyContent: "center", 
    padding: "40px" 
  }}>
    <div
      style={{
        width: "40px",
        height: "40px",
        borderRadius: "50%",
        border: "3px solid rgba(0, 0, 0, 0.1)",
        borderTopColor: "#1976d2",
        animation: "spin 1s linear infinite",
      }}
    />
    <style>{`
      @keyframes spin {
        to { transform: rotate(360deg); }
      }
    `}</style>
  </div>
);

export default LoadingSpinner;