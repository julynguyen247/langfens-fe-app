"use client";
import React, { forwardRef, useState } from "react";
import { FiEye, FiEyeOff } from "react-icons/fi";

interface InputProps {
  type?: string;
  value?: string | number; // controlled
  defaultValue?: string | number; // uncontrolled
  name?: string;
  required?: boolean;
  disabled?: boolean;
  label?: string;
  placeholder?: string;
  className?: string;
  inputClassName?: string;
  labelClassName?: string;
  onChangeFunc?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  errorMessage?: string;
  maxLength?: number;
  minLength?: number;
  list?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>((props, ref) => {
  const [showPassword, setShowPassword] = useState(false);
  const togglePasswordHandler = () => setShowPassword((prev) => !prev);

  let inputType = props.type || "text";
  if (props.type === "password") {
    inputType = showPassword ? "text" : "password";
  }

  return (
    <div className={`flex flex-col gap-2 ${props.className ?? ""}`}>
      {props.label && (
        <label
          className={`text-[#0A0A0A] text-sm font-medium font-sans ${
            props.labelClassName ?? ""
          }`}
        >
          {props.label}{" "}
          {props.required && <span className="text-red-500">*</span>}
        </label>
      )}

      <div className="relative">
        <input
          ref={ref}
          value={props.value}
          defaultValue={props.defaultValue}
          name={props.name}
          className={`w-full px-4 py-3 rounded-lg font-medium bg-white border placeholder-gray-500 text-sm 
          transition-all duration-150
          ${
            props.errorMessage
              ? "border-red-500 focus:border-red-500"
              : "border-gray-200 focus:border-2 focus:border-blue-600"
          }
          focus:outline-none focus:bg-white
          ${props.inputClassName ?? ""}`}
          type={inputType}
          placeholder={props.placeholder || ""}
          onChange={props.onChangeFunc}
          disabled={props.disabled}
          maxLength={props.maxLength}
          minLength={props.minLength}
          list={props.list}
          max={props.type === "date" ? "9999-12-31" : undefined}
        />

        {props.type === "password" && (
          <button
            type="button"
            aria-label="Toggle password visibility"
            onClick={togglePasswordHandler}
            className="absolute inset-y-0 right-3 flex items-center text-gray-500 hover:text-blue-600 focus:outline-none"
          >
            {showPassword ? (
              <FiEyeOff className="w-5 h-5" />
            ) : (
              <FiEye className="w-5 h-5" />
            )}
          </button>
        )}
      </div>

      {props.errorMessage && (
        <p className="mt-1 text-xs text-red-500">{props.errorMessage}</p>
      )}
    </div>
  );
});

Input.displayName = "Input";

export default Input;
