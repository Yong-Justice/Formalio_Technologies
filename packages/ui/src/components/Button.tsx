import React from "react";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
type ButtonSize = "sm" | "md" | "lg";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
};

export function Button({
  children,
  variant = "primary",
  size = "md",
  isLoading = false,
  disabled,
  className = "",
  ...props
}: ButtonProps) {
  return (
    <button
      disabled={disabled || isLoading}
      className={`btn btn-${variant} btn-${size} ${className}`}
      {...props}
    >
      {isLoading ? "Loading..." : children}
    </button>
  );
}
