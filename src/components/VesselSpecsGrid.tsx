"use client";
import React from "react";

type Props = { specs?: { speed?: string; payload?: string; index?: string; fuel?: string; risk?: string } };

export default function VesselSpecsGrid({ specs }: Props) {
  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-100">
      <h4 className="text-xs font-black uppercase text-slate-400 mb-4">Vessel Specifications</h4>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <div className="text-[10px] text-slate-500">Speed</div>
          <div className="font-black">{specs?.speed || '—'}</div>
        </div>
        <div>
          <div className="text-[10px] text-slate-500">Payload</div>
          <div className="font-black">{specs?.payload || '—'}</div>
        </div>
        <div>
          <div className="text-[10px] text-slate-500">Index</div>
          <div className="font-black">{specs?.index || '—'}</div>
        </div>
        <div>
          <div className="text-[10px] text-slate-500">Fuel Type</div>
          <div className="font-black">{specs?.fuel || '—'}</div>
        </div>
        <div className="col-span-2">
          <div className="text-[10px] text-slate-500">Risk</div>
          <div className="font-black">{specs?.risk || '—'}</div>
        </div>
      </div>
    </div>
  );
}
