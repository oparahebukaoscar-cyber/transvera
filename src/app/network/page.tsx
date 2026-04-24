"use client";
import React, { useState, useEffect, useMemo } from "react";
import { motion } from 'framer-motion';
import { 
  Activity, ShieldCheck, MapPin, 
  Search, Filter, Maximize, RefreshCw, Radio, 
  Wind, Server 
} from 'lucide-react';
import SecurityAuthModal from "@/components/SecurityAuthModal";
import IncidentArchive from "@/components/IncidentArchive";
import TelemetryMap from "@/components/TelemetryMap";

// --- Advanced UI Components ---
const TelemetryBadge = ({ label, value, trend }) => (
  <div className="bg-slate-50 border border-slate-100 p-4 rounded-2xl">
    <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">{label}</div>
    <div className="flex items-baseline gap-2">
      <span className="text-xl font-black text-[#064E3B]">{value}</span>
      <span className={`text-[9px] font-bold ${trend === 'up' ? 'text-red-500' : 'text-emerald-500'}`}>
        {trend === 'up' ? '▲' : '▼'}
      </span>
    </div>
  </div>
);

const HubCard = ({ hub, isActive, onClick }) => (
  <motion.div 
    onClick={onClick}
    whileHover={{ x: 5 }}
    className={`p-6 rounded-[2rem] cursor-pointer transition-all border ${isActive ? 'bg-[#064E3B] text-white border-[#064E3B] shadow-2xl shadow-emerald-900/30' : 'bg-white text-slate-900 border-slate-100 hover:border-[#BEF264]'}`}
  >
    <div className="flex justify-between items-start mb-4">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isActive ? 'bg-[#BEF264] text-[#064E3B]' : 'bg-slate-100 text-slate-500'}`}>
        <MapPin size={18} />
      </div>
      <div className={`text-[8px] font-black px-2 py-1 rounded uppercase tracking-tighter ${hub.status === 'Critical' ? 'bg-red-500 text-white' : 'bg-[#BEF264] text-[#064E3B]'}`}>
        {hub.status}
      </div>
    </div>
    <h3 className="text-lg font-black uppercase tracking-tighter leading-none mb-1">{hub.id}</h3>
    <p className={`text-[9px] font-bold uppercase tracking-widest opacity-60`}>{hub.region}</p>
    
    <div className="mt-6 space-y-2">
      <div className="flex justify-between text-[10px] font-mono">
        <span>Load Factor</span>
        <span>{hub.congestion}%</span>
      </div>
      <div className="h-1 w-full bg-black/10 rounded-full overflow-hidden">
        <motion.div 
          initial={{ width: 0 }} 
          animate={{ width: `${hub.congestion}%` }} 
          className={`h-full ${isActive ? 'bg-white' : 'bg-[#064E3B]'}`} 
        />
      </div>
    </div>
  </motion.div>
);

export default function NetworkPage() {
  const [selectedId, setSelectedId] = useState('Singapore');
  const [searchQuery, setSearchQuery] = useState("");
  const [layer, setLayer] = useState<'IR'|'Thermal'|'Topo'>('IR');
  const [authOpen, setAuthOpen] = useState(false);
  const [incidentOpen, setIncidentOpen] = useState(false);
  const [incidents, setIncidents] = useState<any[]>([]);
  const [syncProgress, setSyncProgress] = useState(0);
  // Weather vector toggle
  const [weatherOn, setWeatherOn] = useState(false);
  
  const hubs = useMemo(() => [
    { id: 'Singapore', region: 'South East Asia', congestion: 14, queue: 4, status: 'Optimal', lat: '1.3521 N', long: '103.8198 E', throughput: '84.2k' },
    { id: 'Rotterdam', region: 'Northern Europe', congestion: 72, queue: 19, status: 'Congested', lat: '51.9225 N', long: '4.4792 E', throughput: '112.5k' },
    { id: 'Dubai', region: 'Middle East', congestion: 34, queue: 9, status: 'Optimal', lat: '25.2048 N', long: '55.2708 E', throughput: '92.1k' },
    { id: 'New York', region: 'North America', congestion: 58, queue: 12, status: 'Warning', lat: '40.7128 N', long: '74.0060 W', throughput: '156.9k' },
    { id: 'Shanghai', region: 'East Asia', congestion: 89, queue: 42, status: 'Critical', lat: '31.2304 N', long: '121.4737 E', throughput: '240.2k' },
  ], []);

  const activeHub = hubs.find(h => h.id === selectedId) || hubs[0];

  // generate incidents periodically
  useEffect(() => {
    const types = ['INFO','WARN','CRIT'];
    const id = setInterval(() => {
      const t = types[Math.floor(Math.random()*types.length)];
      const msg = `${activeHub.id}_NODE: ${t} — ${['Re-routing vessel TRV-88','Telemetry spike','Satellite handoff'][Math.floor(Math.random()*3)]}`;
      setIncidents(prev => [ { level: t, text: msg, ts: new Date().toLocaleTimeString() }, ...prev ].slice(0, 100));
    }, 5000);
    return () => clearInterval(id);
  }, [activeHub.id]);

  // handle sync progress when override confirmed
  useEffect(() => {
    if (syncProgress <= 0) return;
    if (syncProgress >= 100) return;
    const id = setInterval(() => setSyncProgress(p => Math.min(100, p + Math.random()*12)), 600);
    return () => clearInterval(id);
  }, [syncProgress]);

  // Security auth modal (multi-stage: dial + biometric)
  const handleAuthorize = ()=>{ setSyncProgress(5); setAuthOpen(false); };

  return (
    <main className="min-h-screen bg-[#F8FAFB] pt-32 pb-20 px-8">
      {/* 01. TOP COMMAND BAR */}
      <section className="max-w-[1600px] mx-auto mb-10">
        <div className="flex flex-col md:flex-row justify-between items-end gap-6">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex -space-x-2">
                {[1,2,3].map(i => <div key={i} className="w-6 h-6 rounded-full border-2 border-white bg-slate-200" />)}
              </div>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">12 Operators Online</span>
            </div>
            <h1 className="text-7xl font-black uppercase tracking-tighter text-slate-900 leading-[0.8]">
              Global <br /> <span className="text-[#064E3B]">Nodes.</span>
            </h1>
          </div>

          <div className="w-full md:w-auto flex flex-col gap-4">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input 
                type="text" 
                placeholder="Search Global Infrastructure..." 
                className="w-full md:w-80 pl-12 pr-4 py-4 bg-white border border-slate-100 rounded-2xl font-bold text-sm outline-none focus:ring-2 ring-[#BEF264]/20"
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </div>
      </section>

      {/* 02. MAIN ANALYTICS GRID */}
      <section className="max-w-[1600px] mx-auto grid lg:grid-cols-12 gap-8">
        
        {/* LEFT: HUB DIRECTORY */}
        <div className="lg:col-span-3 space-y-4 h-[800px] overflow-y-auto pr-2 custom-scrollbar">
          <div className="flex items-center justify-between px-2 mb-6">
            <h2 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Node Directory</h2>
            <Filter size={14} className="text-slate-400" />
          </div>
          {hubs.filter(h => h.id.toLowerCase().includes(searchQuery.toLowerCase())).map(hub => (
            <HubCard 
              key={hub.id} 
              hub={hub} 
              isActive={selectedId === hub.id} 
              onClick={() => setSelectedId(hub.id)} 
            />
          ))}
        </div>

        {/* CENTER: GEOSPATIAL VISUALIZER */}
        <div className="lg:col-span-6 space-y-8">
          <div className="bg-white rounded-[3rem] p-4 border border-slate-100 shadow-sm relative overflow-hidden h-[550px]">
            <TelemetryMap hubs={hubs} activeHub={activeHub} weatherOn={weatherOn} setWeatherOn={(v:boolean)=>setWeatherOn(v)} layer={layer} setLayer={(l:any)=>setLayer(l)} />
          </div>

          <div className="grid grid-cols-3 gap-6">
            <TelemetryBadge label="Queue Load" value={activeHub.queue} trend="up" />
            <TelemetryBadge label="Avg Throughput" value={activeHub.throughput} trend="down" />
            <TelemetryBadge label="System Health" value="98.2%" trend="down" />
          </div>
        </div>

        {/* RIGHT: LIVE TERMINAL & INSPECTOR */}
        <div className="lg:col-span-3 space-y-8">
          <div className="bg-[#064E3B] rounded-[3rem] p-8 text-white h-full flex flex-col">
            <div className="flex justify-between items-center mb-10">
              <h2 className="text-[10px] font-black uppercase tracking-widest text-[#BEF264]">Terminal Inspector</h2>
              <Maximize size={16} className="text-white/40 cursor-pointer" />
            </div>

            <div className="flex-1 space-y-8">
               <section>
                  <div className="text-[10px] font-black uppercase text-white/40 mb-4">Environment Status</div>
                  <div className="flex items-center gap-4 bg-white/5 p-4 rounded-2xl">
                    <Wind className="text-[#BEF264]" size={20} />
                    <div>
                      <div className="text-xs font-bold">14.2 knots</div>
                      <div className="text-[8px] uppercase font-black text-white/30">Wind Velocity</div>
                    </div>
                  </div>
               </section>

               <section>
                  <div className="text-[10px] font-black uppercase text-white/40 mb-4">Node Capability</div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-white/5 p-4 rounded-2xl text-center">
                       <Server size={16} className="mx-auto mb-2 text-white/40" />
                       <div className="text-[10px] font-black uppercase">Edge Compute</div>
                    </div>
                    <div className="bg-white/5 p-4 rounded-2xl text-center">
                       <Radio size={16} className="mx-auto mb-2 text-white/40" />
                       <div className="text-[10px] font-black uppercase">5G Relay</div>
                    </div>
                  </div>
               </section>

               <section className="bg-black/20 p-6 rounded-[2rem] border border-white/5">
                  <div className="flex items-center gap-2 mb-4">
                    <Activity size={14} className="text-red-500 animate-pulse" />
                    <span className="text-[9px] font-black uppercase text-red-500">Live Congestion Logic</span>
                  </div>
                  <div className="h-24 flex items-end gap-1">
                    {[40, 70, 45, 90, 65, 30, 85].map((h, i) => (
                      <motion.div 
                        key={i}
                        initial={{ height: 0 }}
                        animate={{ height: `${h}%` }}
                        className="flex-1 bg-gradient-to-t from-[#BEF264] to-emerald-400 rounded-t-sm"
                      />
                    ))}
                  </div>
               </section>
            </div>

            {/* Admin action removed from public UI */}
            <button onClick={()=>setAuthOpen(true)} className="w-full mt-3 bg-white text-[#064E3B] py-3 rounded-2xl font-black uppercase text-[10px] tracking-widest border border-slate-100">Emergency Override</button>
            <button onClick={()=>setIncidentOpen(o=>!o)} className="w-full mt-3 bg-white/5 text-white py-3 rounded-2xl font-black uppercase text-[10px] tracking-widest border border-white/10">Toggle Incident Archive</button>
          </div>
        </div>
      </section>

      {/* Security Auth Modal */}
      <SecurityAuthModal open={authOpen} onClose={()=>setAuthOpen(false)} onAuthorize={handleAuthorize} />

      {/* Incident Archive Sidebar */}
      <IncidentArchive open={incidentOpen} onClose={()=>setIncidentOpen(false)} incidents={incidents} />

      {/* FOOTER METRICS STRIP */}
      <section className="max-w-[1600px] mx-auto mt-12 pt-8 border-t border-slate-200">
        <div className="flex flex-wrap gap-12">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
            <span className="text-[10px] font-black uppercase text-slate-400">Database Synced: 0.4ms ago</span>
          </div>
          <div className="flex items-center gap-3">
            <ShieldCheck size={14} className="text-[#064E3B]" />
            <span className="text-[10px] font-black uppercase text-slate-400">SSL Encryption Active</span>
          </div>
          <div className="flex items-center gap-3">
            <RefreshCw size={14} className="text-slate-400 animate-spin-slow" />
            <span className="text-[10px] font-black uppercase text-slate-400">Auto-Polling Sector 7</span>
          </div>
        </div>
      </section>
    </main>
  );
}