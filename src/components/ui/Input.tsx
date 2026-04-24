import React from "react";
import { cn } from "@/lib/utils";

export const Input = ({ className, ...props }: React.InputHTMLAttributes<HTMLInputElement>) => (
  <input
    className={cn(
      "w-full px-4 py-3 bg-neutral-100 border-2 border-transparent rounded-xl focus:bg-white focus:border-accent outline-none transition-all",
      className
    )}
    {...props}
  />
);

export default Input;
