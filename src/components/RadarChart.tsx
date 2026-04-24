"use client";
import React from "react";

type ValSet = { customs:number; security:number; throughput:number; stability:number };

function toPoints(vals: ValSet, size=80){
  const cx = 50, cy = 50; const rad = size/2;
  const angles = [ -Math.PI/2, 0, Math.PI/2, Math.PI ];
  return angles.map((a,i)=>{
    const v = [vals.customs, vals.security, vals.throughput, vals.stability][i] / 100;
    return `${cx + Math.cos(a) * rad * v} ${cy + Math.sin(a) * rad * v}`;
  }).join(' ');
}

export default function RadarChart({ a, b }:{ a: ValSet; b: ValSet }){
  const pa = toPoints(a); const pb = toPoints(b);
  return (
    <div className="flex gap-4 items-center">
      <svg viewBox="0 0 100 100" className="w-40 h-40 bg-slate-50 rounded">
        <circle cx="50" cy="50" r="40" fill="#fff2" />
        <polygon points={pa} fill="#BEF26480" stroke="#064E3B" />
        <polygon points={pb} fill="#34D39980" stroke="#064E3B" />
      </svg>
      <div>
        <div className="text-xs">Customs Speed: <span className="font-black">{a.customs} / {b.customs}</span></div>
        <div className="text-xs">Cyber Security: <span className="font-black">{a.security} / {b.security}</span></div>
        <div className="text-xs">Throughput: <span className="font-black">{a.throughput} / {b.throughput}</span></div>
        <div className="text-xs">Stability: <span className="font-black">{a.stability} / {b.stability}</span></div>
      </div>
    </div>
  );
}
