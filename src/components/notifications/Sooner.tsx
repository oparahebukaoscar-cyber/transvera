"use client";
import React, { createContext, useCallback, useContext, useMemo, useState } from "react";

type Toast = { id: string; message: string };

const SoonerContext = createContext<{ show: (msg: string) => void } | null>(null);

export const SoonerProvider = ({ children }: { children: React.ReactNode }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const show = useCallback((message: string) => {
    const id = Math.random().toString(36).slice(2, 9);
    setToasts((t) => [...t, { id, message }]);
    // auto-remove
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3500);
  }, []);

  const value = useMemo(() => ({ show }), [show]);

  return (
    <SoonerContext.Provider value={value}>
      {children}
      <div aria-live="polite" className="fixed z-50 right-4 bottom-6 flex flex-col gap-3">
        {toasts.map((t) => (
          <div key={t.id} className="bg-[#064E3B] text-white px-4 py-2 rounded-lg shadow-md max-w-xs">
            {t.message}
          </div>
        ))}
      </div>
    </SoonerContext.Provider>
  );
};

export const useSooner = () => {
  const ctx = useContext(SoonerContext);
  if (!ctx) throw new Error("useSooner must be used within SoonerProvider");
  return ctx;
};

export default SoonerProvider;
