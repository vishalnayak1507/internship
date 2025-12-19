// frontend/src/components/common/ErrorAlert.jsx
import React from "react";

const ErrorAlert = ({ message }) => (
  <div
    style={{
      background: "#ffebee",
      color: "#c62828",
      padding: "16px",
      borderRadius: "8px",
      marginBottom: "20px",
      border: "1px solid #ef9a9a",
      display: "flex",
      alignItems: "center",
    }}
  >
    <div style={{ marginRight: "12px", fontSize: "24px" }}>⚠️</div>
    <div>
      <strong>Error:</strong> {message || "Failed to load data"}
    </div>
  </div>
);

export default ErrorAlert;