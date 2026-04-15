import React from "react";

function Skeleton({ height = "20px", width = "100%", radius = "8px" }) {
  return (
    <>
      <style>
        {`
          @keyframes ssc-skeleton {
            0% { background-position: 200% 0; }
            100% { background-position: -200% 0; }
          }
        `}
      </style>

      <div
        style={{
          height,
          width,
          borderRadius: radius,
          background: "linear-gradient(90deg, #e5e7eb 25%, #f3f4f6 50%, #e5e7eb 75%)",
          backgroundSize: "200% 100%",
          animation: "ssc-skeleton 1.4s ease infinite",
        }}
      />
    </>
  );
}

export default Skeleton;