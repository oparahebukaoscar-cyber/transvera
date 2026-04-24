"use client";
import React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline";
}

export const Button = ({ className, variant = "primary", ...props }: ButtonProps) => {
  const variants = {
    primary: "bg-foreground text-white hover:bg-neutral-800",
    secondary: "bg-accent text-white hover:bg-blue-700 shadow-lg shadow-blue-200",
    outline: "border-2 border-neutral-200 bg-transparent hover:bg-neutral-50",
  } as const;

  return (
    <motion.button
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.98 }}
      className={cn(
        "px-6 py-3 rounded-2xl font-semibold transition-all duration-200 disabled:opacity-50",
        variants[variant],
        className
      )}
      {...(props as any)}
    />
  );
};

export default Button;
