"use client";
import React from "react";

export default function TelemetryTicker() {
  const items = [
    'Telemetry: All Nodes Nominal',
    'Active Sync: 98.7%',
    'Latency (p95): 34ms',
    'Fuel Index: 0.87',
    'CO2 Reduction: 4.2M Tons',
  ];

  return (
    <div className="w-full overflow-hidden bg-[#F7FFF8] rounded-xl p-2 border border-slate-100">
      <div className="whitespace-nowrap animate-ticker">
        {items.concat(items).map((it, i) => (
          <span key={i} className="inline-block px-6 text-xs font-black text-slate-600">{it}</span>
        ))}
      </div>
      <style>{`.animate-ticker{animation: ticker 18s linear infinite;} @keyframes ticker{0%{transform:translateX(0)}100%{transform:translateX(-50%)}}`}</style>
    </div>
  );
}
