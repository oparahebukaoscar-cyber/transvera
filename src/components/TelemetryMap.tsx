"use client";
import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Crosshair, Cpu } from "lucide-react";
import SignalAtmosphere from "@/components/SignalAtmosphere";

type Props = {
  hubs?: any[];
  activeHub?: any;
  weatherOn?: boolean;
  setWeatherOn?: (v:boolean)=>void;
  layer?: string;
  setLayer?: (l:any)=>void;
};

const ThermalOverlay = () => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: [0.1, 0.3, 0.1] }}
    transition={{ duration: 4, repeat: Infinity }}
    className="absolute inset-0 bg-gradient-to-br from-orange-500/20 via-red-500/10 to-transparent mix-blend-screen pointer-events-none"
  />
);

export default function TelemetryMap({ hubs, activeHub, weatherOn, setWeatherOn, layer, setLayer }: Props) {
  const [viewMode, setViewMode] = useState<string>("Satellite");
  const [coords, setCoords] = useState({ x: 103.81, y: 1.35 });
  const [isScanning] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setCoords(prev => ({ x: prev.x + (Math.random() - 0.5) * 0.001, y: prev.y + (Math.random() - 0.5) * 0.001 }));
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  const displayLat = activeHub?.lat ?? `${coords.y.toFixed(4)}° N`;
  const displayLong = activeHub?.long ?? `${coords.x.toFixed(4)}° E`;

  return (
    <div className="relative w-full h-full rounded-[2.5rem] overflow-hidden">
      <div className={`absolute inset-0 transition-all duration-1000 ${
        viewMode === 'Thermal' ? 'grayscale invert brightness-50 contrast-150' : viewMode === 'Radar' ? 'brightness-[0.2] sepia-[1] hue-rotate-[120deg]' : ''
      }`}>
        <img
          src="https://images.unsplash.com/photo-1526778548025-fa2f459cd5c1?auto=format&fit=crop&q=80"
          alt="Satellite"
          className="w-full h-full object-cover scale-110"
        />
        {viewMode === 'Thermal' && <ThermalOverlay />}
      </div>

      {/* HUD OVERLAYS (Left Side) */}
      <div className="absolute top-8 left-8 z-30 space-y-4">
        <div className="bg-black/90 backdrop-blur-md p-6 rounded-3xl border border-white/10 max-w-[240px]">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-2 h-2 bg-[#064E3B] rounded-full animate-ping" />
            <span className="text-[10px] font-black uppercase tracking-widest text-[#064E3B]">Orbital Sync: Active</span>
          </div>
          <div className="space-y-3 font-mono text-white">
            <div className="flex justify-between text-[10px] text-slate-300">
              <span>LAT:</span>
              <span className="text-slate-100 font-bold">{displayLat}</span>
            </div>
            <div className="flex justify-between text-[10px] text-slate-300">
              <span>LONG:</span>
              <span className="text-slate-100 font-bold">{displayLong}</span>
            </div>
            <div className="pt-2 border-t border-white/10 flex justify-between items-center">
              <span className="text-[9px] font-black text-[#064E3B]">SIGNAL</span>
              <div className="flex gap-0.5">
                {[1,2,3,4].map(i => <div key={i} className={`w-1 h-3 rounded-full ${i < 4 ? 'bg-[#BEF264]' : 'bg-slate-200'}`} />)}
              </div>
            </div>
          </div>
        </div>

        <div className="flex gap-2">
          {['Satellite','Thermal','Radar'].map(m => (
            <button key={m} onClick={() => setViewMode(m)} className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest ${viewMode === m ? 'bg-[#064E3B] text-white' : 'bg-white/80 text-slate-400 hover:bg-white'}`}>
              {m}
            </button>
          ))}
        </div>
      </div>

      {/* Signal atmosphere / hub markers */}
      <SignalAtmosphere hubs={hubs || []} activeId={activeHub?.id} />

      {/* 03. SCANNING RETICLE (Center) */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
          className="relative w-80 h-80 border border-white/20 rounded-full flex items-center justify-center"
        >
          <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2">
            <div className="w-1 h-8 bg-[#BEF264] shadow-[0_0_15px_#BEF264]" />
          </div>
          <div className="w-64 h-64 border border-white/10 rounded-full border-dashed" />
        </motion.div>

        <div className="absolute flex flex-col items-center">
          <Crosshair className="text-[#BEF264]/80 mb-2" size={48} strokeWidth={1} />
          <motion.div animate={{ opacity: [0.4, 1, 0.4] }} transition={{ duration: 2, repeat: Infinity }} className="text-[10px] font-black text-white uppercase tracking-[0.5em]">Target Locked</motion.div>
        </div>
      </div>

      {/* Weather vector layer */}
      {weatherOn && (
        <div className="absolute inset-0 pointer-events-none">
          {[...Array(12)].map((_,i)=> (
            <motion.svg key={i} viewBox="0 0 24 24" className="w-6 h-6 text-white/60 absolute" style={{ left: `${(i*8)%100}%`, top: `${(i*9)%100}%` }} animate={{ x: [0, 40, 0] }} transition={{ repeat: Infinity, duration: 6 + i }}>
              <path d="M2 12 L20 12 M16 8 L20 12 L16 16" stroke="#BEF264" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
            </motion.svg>
          ))}
        </div>
      )}

      {/* 04. DATA FLOW (Right Side) */}
      <div className="absolute bottom-8 right-8 z-30 w-64">
        <div className="bg-black/90 p-6 rounded-[2.5rem] border border-white/10 shadow-2xl overflow-hidden relative">
          <div className="absolute top-0 left-0 w-full h-1 bg-[#BEF264] animate-pulse" />
          <h3 className="text-[10px] font-black text-white/40 uppercase mb-4 tracking-widest flex items-center gap-2"><Cpu size={12} /> Neural Processing</h3>
          <div className="space-y-4">
            <div className="h-20 w-full flex items-end gap-1 px-1">
              {[40,70,45,90,65,30,85,50,60,40].map((h,i) => (
                <motion.div key={i} initial={{ height: 0 }} animate={{ height: `${h}%` }} transition={{ delay: i * 0.05 }} className="flex-1 bg-white/20 rounded-t-sm" />
              ))}
            </div>
            <p className="text-[9px] font-mono text-[#BEF264] leading-tight">TRANSVERA_NODE_SGP: Verified <br/> ENCRYPTION_HASH: 0x992...F1 <br/> STATUS: SECURE_MANIFEST_LOADED</p>
          </div>
        </div>
      </div>

      {/* Scanning Line Effect */}
      <motion.div
        animate={{ top: ['0%', '100%', '0%'] }}
        transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
        className="absolute left-0 right-0 h-[1px] bg-[#BEF264]/30 z-20 shadow-[0_0_20px_#BEF264]"
      />
    </div>
  );
}
