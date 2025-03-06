import React from "react";

export const Button = ({ children, onClick, type = "button", className = "" }) => {
  return (
    <button
      type={type}
      onClick={onClick}
      className={`px-4 py-2 bg-blue-500 text-white font-semibold rounded-lg hover:bg-blue-600 transition ${className}`}
    >
      {children}
    </button>
  );
};
