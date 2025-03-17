import refresh from "../data/refresh.png";
import React from "react";

const RefreshButton = ({ onClick }) => {
  return (
    <button
      onClick={onClick}
      className="p-1 rounded-md hover:opacity-80"
      style={{
        background: "none",
        border: "none",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <img
        src={refresh}
        alt="Refresh"
        className="w-6 h-6"
        style={{ width: "24px", height: "24px" }} 
      />
    </button>
  );
};

export default RefreshButton;
