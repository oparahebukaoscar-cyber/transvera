"use client";
import React from "react";

const clusters = [
  { id: 'Cluster A', cooling: 'Direct Liquid Immersion', hsm: 'HSM-X9', redundancy: '3x' },
  { id: 'Cluster B', cooling: 'Rear Door Heat Exchanger', hsm: 'HSM-7', redundancy: '2x' },
  { id: 'Cluster C', cooling: 'Closed Loop Liquid', hsm: 'HSM-Prime', redundancy: '2x' },
  { id: 'Cluster D', cooling: 'Air + Liquid Hybrid', hsm: 'HSM-Lite', redundancy: '3x' }
];

export default function HardwareHardening(){
  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-100">
      <h4 className="text-xs font-black uppercase text-slate-400 mb-4">Hardware Hardening — Server Cluster Specs</h4>
      <div className="grid grid-cols-2 gap-4">
        {clusters.map(c => (
          <div key={c.id} className="p-4 border rounded-lg">
            <div className="font-black">{c.id}</div>
            <div className="text-xs text-slate-500">Liquid Cooling: <span className="font-bold text-slate-700">{c.cooling}</span></div>
            <div className="text-xs text-slate-500">HSM Model: <span className="font-bold text-slate-700">{c.hsm}</span></div>
            <div className="text-xs text-slate-500">Geo Redundancy: <span className="font-bold text-slate-700">{c.redundancy}</span></div>
          </div>
        ))}
      </div>
    </div>
  );
}
