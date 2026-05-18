import React from "react";

type InputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  error?: string;
};

export function Input({ label, error, id, className = "", ...props }: InputProps) {
  return (
    <div className="input-wrapper">
      {label && <label htmlFor={id}>{label}</label>}
      <input id={id} className={`input ${error ? "input-error" : ""} ${className}`} {...props} />
      {error && <span className="input-error-msg">{error}</span>}
    </div>
  );
}
