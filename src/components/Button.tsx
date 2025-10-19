"use client";

import React from "react";

interface ButtonProps {
  className?: string;
  onClickFunc?: () => void;
  isValid?: boolean;
  children?: React.ReactNode;
  type?: "button" | "submit" | "reset";
}

export const Button = ({
  className = "",
  onClickFunc,
  isValid = true,
  children,
  type = "button",
}: ButtonProps) => {
  return (
    <button
      type={type}
      onClick={onClickFunc}
      disabled={!isValid}
      className={`tracking-wide font-semibold px-6 py-3 rounded-lg flex items-center justify-center transition-colors duration-200 text-white
        ${
          isValid
            ? "bg-[#317EFF] hover:bg-[#317EFF] text-[#0F172A] cursor-pointer"
            : "bg-[#E5E7EB] text-[#94A3B8] cursor-not-allowed"
        }
        ${className}`}
    >
      {children}
    </button>
  );
};
