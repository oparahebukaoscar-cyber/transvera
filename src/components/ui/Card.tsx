import React from "react";

export const Card = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <div className={`bg-white rounded-[2rem] p-8 shadow-soft border border-neutral-50 ${className}`}>
    {children}
  </div>
);

export default Card;
