"use client";
import React from "react";
import { motion, useMotionValue, useTransform, useSpring } from "framer-motion";

const awards = [
  { title: 'World Logistics 2025', desc: 'Innovation in Secure Logistics' },
  { title: 'Sustainability Prize', desc: 'CO2 Reduction Program' },
  { title: 'Security Vanguard', desc: 'Excellence in Data Hardening' },
  { title: 'Tech Forward', desc: 'AI-driven Routing' }
];

export default function AwardGallery(){
  const mvX = useMotionValue(0.5);
  const mvY = useMotionValue(0.5);
  const rY = useTransform(mvX, [0,1], [20, -20]);
  const rX = useTransform(mvY, [0,1], [-10, 10]);
  const sY = useSpring(rY, { stiffness: 120, damping: 20 });
  const sX = useSpring(rX, { stiffness: 120, damping: 20 });

  return (
    <div className="w-full overflow-x-auto py-6" onMouseMove={(e)=>{
      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
      mvX.set((e.clientX - rect.left) / rect.width);
      mvY.set((e.clientY - rect.top) / rect.height);
    }} onMouseLeave={()=>{ mvX.set(0.5); mvY.set(0.5); }}>
      <div className="flex gap-6 px-6">
        {awards.map((a,i)=> (
          <motion.div key={i} style={{ rotateY: sY, rotateX: sX }} className="w-72 h-44 bg-white rounded-2xl p-4 shadow-lg relative">
            <div className="text-xs text-slate-400">Achievement</div>
            <div className="text-lg font-black mt-2">{a.title}</div>
            <div className="text-xs text-slate-500 mt-2">{a.desc}</div>
            <div className="absolute right-4 bottom-4 text-xs font-black text-[#BEF264]">View</div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
