"use client";
import React from "react";

export default function IncidentArchive({ open, onClose, incidents }:{ open:boolean; onClose:()=>void; incidents:any[] }){
  return (
    <aside className={`${open? 'right-6' : '-right-96'} transition-all duration-300 fixed top-24 z-50 w-96 bg-white p-4 rounded-2xl border shadow-lg`}>
      <div className="flex justify-between items-center mb-3">
        <div className="font-black">Incident Archive</div>
        <button onClick={onClose} className="text-sm bg-slate-100 px-2 py-1 rounded">Close</button>
      </div>
      <div className="h-[520px] overflow-y-auto font-mono text-sm space-y-2">
        {incidents.slice(0,50).map((it,i)=> (
          <div key={i} className="p-2 border rounded">
            <div className="text-xs opacity-40">{new Date().toLocaleString()}</div>
            <div className="font-black">EVT-{String(992 - i).padStart(4,'0')}-X — {it.level}</div>
            <div className="text-xs text-slate-600">{it.text}</div>
          </div>
        ))}
      </div>
    </aside>
  );
}
