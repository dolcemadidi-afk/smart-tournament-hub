import React from "react";

function Loader({ text = "Loading..." }) {
  return (
    <>
      <style>
        {`
          @keyframes ssc-spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }

          @keyframes ssc-fade {
            0% { opacity: 0.6; transform: translateY(4px); }
            100% { opacity: 1; transform: translateY(0); }
          }
        `}
      </style>

      <div style={wrapperStyle}>
        <div style={cardStyle}>
          <img
            src="/logo-smart-sport-consulting.jpg"
            alt="Logo"
            style={logoStyle}
          />

          <div style={spinnerStyle} />

          <h2 style={titleStyle}>{text}</h2>
          <p style={descStyle}>
            Please wait while we load your content.
          </p>
        </div>
      </div>
    </>
  );
}

const wrapperStyle = {
  minHeight: "100vh",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  background:
    "linear-gradient(180deg, #f8fbff 0%, #eef6fb 50%, #f8fafc 100%)",
  padding: "24px",
};

const cardStyle = {
  width: "100%",
  maxWidth: "380px",
  background: "#ffffff",
  borderRadius: "22px",
  padding: "34px 24px",
  boxShadow: "0 16px 40px rgba(20, 118, 182, 0.12)",
  border: "1px solid rgba(20, 118, 182, 0.08)",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  textAlign: "center",
  animation: "ssc-fade 0.4s ease forwards",
};

const logoStyle = {
  width: "90px",
  marginBottom: "20px",
};

const spinnerStyle = {
  width: "54px",
  height: "54px",
  border: "5px solid #dbeafe",
  borderTop: "5px solid #1476b6",
  borderRadius: "50%",
  animation: "ssc-spin 0.9s linear infinite",
  marginBottom: "18px",
};

const titleStyle = {
  margin: "0 0 8px 0",
  fontSize: "22px",
  fontWeight: "700",
  color: "#0f172a",
};

const descStyle = {
  margin: 0,
  fontSize: "14px",
  color: "#475569",
};

export default Loader;