"use client";
import React, { useMemo, useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Plane, Ship, Truck, Activity, Wind, Zap, BarChart3, Binary, 
  Maximize2, Radio, Target, ShieldAlert, Cpu, Database, 
  Globe2, Layers, AlertTriangle, ChevronRight, HardDrive, Terminal
} from "lucide-react";
import useCounter from "@/hooks/useCounter";
import ManifestDrawer from "@/components/ManifestDrawer";
import FuelEfficiencyGraph from "@/components/FuelEfficiencyGraph";
import RouteSimulationModal from "@/components/RouteSimulationModal";
import TelemetryTicker from "@/components/TelemetryTicker";
import VesselSpecsGrid from "@/components/VesselSpecsGrid";

// --- Sub-Components for Density ---
type DataStreamProps = { label: string; value: string; status?: string };
const DataStream: React.FC<DataStreamProps> = ({ label, value, status }) => (
  <div className="flex flex-col gap-1 border-l border-slate-200 pl-4 py-1">
    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{label}</span>
    <div className="flex items-baseline gap-2">
      <span className="text-sm font-bold text-slate-800 font-mono">{value}</span>
      {status && <span className="text-[8px] font-black px-1.5 py-0.5 bg-[#BEF264] text-[#064E3B] rounded uppercase">{status}</span>}
    </div>
  </div>
);

const TerminalLog = ({ logs }) => {
  // Use a deterministic placeholder for server render, update the time on client
  const [now, setNow] = useState('00:00:00');
  useEffect(() => {
    setNow(new Date().toLocaleTimeString());
    const id = setInterval(() => setNow(new Date().toLocaleTimeString()), 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="bg-black/95 rounded-2xl p-6 font-mono text-[10px] text-emerald-500/80 h-48 overflow-y-hidden border border-white/10 shadow-2xl relative">
      <div className="absolute top-0 left-0 right-0 h-8 bg-gradient-to-b from-black to-transparent z-10" />
      <div className="space-y-1">
        {logs.map((log, i) => (
          <div key={i} className="flex gap-4">
            <span className="opacity-30">[{now}]</span>
            <span className={log.includes('WARN') ? 'text-amber-400' : ''}>{log}</span>
          </div>
        ))}
        <motion.div animate={{ opacity: [0, 1] }} transition={{ repeat: Infinity, duration: 0.8 }} className="w-2 h-3 bg-emerald-500 inline-block" />
      </div>
      <div className="absolute bottom-4 right-6 text-[8px] font-black text-white/20 uppercase tracking-[0.4em]">Auth_Session: Active</div>
    </div>
  );
};

export default function IntermodalPage() {
  const [mode, setMode] = useState("Air");
  const [logs, setLogs] = useState(["Initializing Neural Link...", "Fetching Vector Data...", "Handshaking with SGP-Node..."]);
  const [activeLayer, setActiveLayer] = useState("Telemetry");
  // Manifest modal
  const [manifestOpen, setManifestOpen] = useState(false);
  const [hazardClass, setHazardClass] = useState("Class 3");
  const [tempRange, setTempRange] = useState("-20C to +4C");
  const [signature, setSignature] = useState("");
  // Climate simulation
  const [climate, setClimate] = useState({ waveHeight: 1.2, windSpeed: 8, jetStream: 240 });
  // Active nodes explorer
  const nodes = [
    { id: 'Singapore', dwell: [2,3,1,4,3,2] },
    { id: 'Rotterdam', dwell: [6,5,7,8,6,7] },
    { id: 'Dubai', dwell: [3,2,4,3,5,4] },
  ];

  // Dynamic Data Engine
  const specs = useMemo(() => {
    const data = {
      Air: { speed: "880 km/h", payload: "120,000 kg", index: "Tier 1", fuel: "SAF-Hybrid", risk: "0.02%" },
      Sea: { speed: "42 km/h", payload: "24,000 TEU", index: "Tier 3", fuel: "LNG-Electric", risk: "0.14%" },
      Land: { speed: "72 km/h", payload: "80,000 kg", index: "Tier 2", fuel: "Hydrogen", risk: "0.08%" }
    };
    return data[mode];
  }, [mode]);

  const efficiency = useCounter(mode === "Air" ? 72 : mode === "Sea" ? 48 : 64, true);
  const capacity = useCounter(mode === "Air" ? 62 : mode === "Sea" ? 84 : 70, true);
  const [routeSimOpen, setRouteSimOpen] = useState(false);

  // System Log Simulator
  useEffect(() => {
    const messages = [
      `Recalibrating ${mode} flight paths...`,
      `Syncing manifest TRV-909-${mode.toUpperCase()}`,
      `Atmospheric pressure: Nominal`,
      `WARN: Congestion detected at Rotterdam Gateway`,
      `Optimizing fuel-to-weight ratio for ${specs.payload}`
    ];
    setLogs(prev => [...prev.slice(-10), messages[Math.floor(Math.random() * messages.length)]]);
  }, [mode, specs.payload]);

  // climate simulation updater
  useEffect(() => {
    const id = setInterval(() => {
      setClimate(c => ({
        waveHeight: Math.max(0.2, +(c.waveHeight + (Math.random()-0.5)*0.6).toFixed(2)),
        windSpeed: Math.max(0, Math.round(c.windSpeed + (Math.random()-0.5)*3)),
        jetStream: Math.max(180, Math.round(c.jetStream + (Math.random()-0.5)*12))
      }));
    }, 3000);
    return () => clearInterval(id);
  }, []);

  return (
    <main className="min-h-screen bg-[#F4F7F6] pt-32 pb-20 px-8 selection:bg-[#BEF264]">
      {/* 01. GLOBAL NAV STRIP (INTERNAL) */}
      <div className="max-w-[1500px] mx-auto mb-10 flex flex-wrap items-center justify-between gap-6 border-b border-slate-200 pb-8">
        <div className="flex items-center gap-8">
          <div className="bg-[#064E3B] p-4 rounded-2xl shadow-xl shadow-emerald-900/20">
            <Layers className="text-[#BEF264]" size={24} />
          </div>
          <div>
        
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Intermodal Orchestration Environment</p>

        {/* telemetry ticker */}
        <div className="max-w-[1500px] mx-auto mt-6">
          <TelemetryTicker />
        </div>
          </div>
        </div>
        
        <div className="flex gap-4">
          <DataStream label="Network Uptime" value="99.998%" status="LIVE" />
          <DataStream label="Active Vessels" value="1,402" />
          <DataStream label="CO2 saved" value="4.2M Tons" />
        </div>
      </div>

      <section className="max-w-[1500px] mx-auto grid lg:grid-cols-12 gap-8">
        
        {/* LEFT COLUMN: CONTROL & TELEMETRY */}
        <div className="lg:col-span-8 space-y-8">
          
          {/* MAIN VISUALIZER */}
          <div className="bg-white rounded-[3rem] p-10 border border-slate-100 shadow-sm relative overflow-hidden">
            <div className="flex justify-between items-start mb-10">
              <div className="flex gap-3">
                    {["Telemetry", "Thermal", "Risk"].map(layer => (
                  <motion.button 
                    key={layer}
                    onClick={() => setActiveLayer(layer)}
                    whileTap={{ scale: 0.95 }}
                    whileHover={{ y: -2 }}
                    className={`text-[9px] font-black uppercase tracking-widest px-4 py-2 rounded-lg transition-all ${activeLayer === layer ? 'bg-[#064E3B] text-white' : 'bg-slate-50 text-slate-400'}`}
                  >
                    {layer} Layer
                  </motion.button>
                ))}
              </div>
              <div className="text-right">
                <div className="text-[9px] font-black text-slate-400 uppercase">Selected Vector</div>
                <div className="text-xl font-black text-[#064E3B] uppercase">{mode} Freight</div>
              </div>
            </div>

            <div className="relative aspect-[21/10] bg-slate-900 rounded-[2rem] border-[12px] border-slate-50 flex items-center justify-center overflow-hidden shadow-inner">
               {/* SVG MAP LOGIC */}
               <motion.svg viewBox="0 0 800 360" className="w-full h-full p-12">
                  <path d="M50 180 L750 180" stroke="white" strokeWidth="0.5" strokeDasharray="4 4" opacity="0.1" />
                  <AnimatePresence mode="wait">
                    <motion.g key={mode}>
                            {mode === "Air" && (
                              <motion.path 
                                d="M100 250 C 250 50, 550 50, 700 250" 
                                stroke="#BEF264" strokeWidth="4" fill="none" strokeLinecap="round"
                                initial={{ pathLength: 0, opacity: 0 }} animate={{ pathLength: 1, opacity: 1 }}
                                transition={{ duration: 1.5 }}
                              />
                            )}
                      {mode === "Sea" && (
                        <motion.path 
                          d="M100 250 L400 280 L700 250" 
                          stroke="#34D399" strokeWidth="4" fill="none" strokeDasharray="10 5"
                          initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                        />
                      )}
                    </motion.g>
                  </AnimatePresence>
                  <circle cx="100" cy="250" r="6" fill="#BEF264" />
                  <circle cx="700" cy="250" r="6" fill="#BEF264" />
               </motion.svg>

               {/* scanning laser */}
               <motion.div
                 className="absolute left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#BEF264] to-transparent opacity-80"
                 style={{ top: -10 }}
                 animate={{ y: [0, '110%'] }}
                 transition={{ repeat: Infinity, duration: 5, ease: 'linear' }}
               />
               
               {/* UI OVERLAY SQUARES */}
               <div className="absolute top-8 left-8 p-4 bg-white/5 backdrop-blur-md rounded-xl border border-white/10">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                    <span className="text-[8px] font-bold text-white uppercase italic">Active Interference Detection</span>
                  </div>
                  <div className="h-10 w-32 flex items-end gap-0.5">
                    {[1,2,3,4,5,6,7,8].map((_, idx) => (
                      <div key={idx} className="flex-1 bg-white/20" style={{ height: `${(idx * 37) % 100}%` }} />
                    ))}
                  </div>
               </div>
            </div>
          </div>

          {/* SECONDARY DATA GRID */}
          <div className="grid md:grid-cols-2 gap-8">
             <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100">
                <h3 className="text-xs font-black uppercase text-slate-400 mb-6 flex items-center gap-2">
                  <Cpu size={14} /> Propulsion Dynamics
                </h3>
                <div className="space-y-4">
                   <div className="flex justify-between items-end">
                      <span className="text-[10px] font-bold text-slate-500 uppercase">Power Source</span>
                      <span className="text-sm font-black text-[#064E3B]">{specs.fuel}</span>
                   </div>
                   <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                      <motion.div initial={{ width: 0 }} animate={{ width: '85%' }} className="h-full bg-[#064E3B]" />
                   </div>
                  <div className="mt-4">
                    <FuelEfficiencyGraph />
                  </div>
                   <p className="text-[10px] text-slate-400 leading-relaxed italic">Next-gen energy systems optimized for high-capacity long-range vectors.</p>
                </div>
             </div>

             <div className="bg-[#BEF264]/10 p-8 rounded-[2.5rem] border border-[#BEF264]/20">
                <h3 className="text-xs font-black uppercase text-[#064E3B] mb-6 flex items-center gap-2">
                  <ShieldAlert size={14} /> Risk Assessment
                </h3>
                <div className="flex items-center gap-6">
                   <div className="w-20 h-20 rounded-full border-8 border-[#064E3B] border-t-transparent animate-spin flex items-center justify-center">
                      <span className="text-xs font-black">{specs.risk}</span>
                   </div>
                   <div>
                      <div className="text-[10px] font-black uppercase text-slate-500 mb-1">Incident Probability</div>
                      <div className="text-sm font-bold text-[#064E3B]">Tier-0 Secured Transit</div>
                   </div>
                </div>
             </div>
          </div>

            {/* Climate Vector Impact (live simulation) */}
            <div className="bg-white p-6 rounded-2xl border border-slate-100 mt-6">
              <h4 className="text-xs font-black uppercase text-slate-400 mb-4">Climate Vector Impact</h4>
              {mode === 'Sea' ? (
                <div className="flex gap-6 items-center">
                  <div className="flex-1">
                    <div className="text-[10px] text-slate-500">Wave Height (m)</div>
                    <div className="text-2xl font-black text-[#064E3B]">{climate.waveHeight.toFixed(1)}</div>
                  </div>
                  <div className="flex-1">
                    <div className="text-[10px] text-slate-500">Wind Speed (kn)</div>
                    <div className="text-2xl font-black text-[#064E3B]">{climate.windSpeed} kt</div>
                  </div>
                </div>
              ) : (
                <div>
                  <div className="text-[10px] text-slate-500">Jet Stream Velocity</div>
                  <div className="text-2xl font-black text-[#064E3B]">{climate.jetStream} km/h</div>
                </div>
              )}
            </div>

          <TerminalLog logs={logs} />

          {/* Real-Time Node Explorer */}
          <div className="mt-6">
            <h4 className="text-xs font-black uppercase text-slate-400 mb-3">Active Nodes</h4>
            <div className="flex gap-4 overflow-x-auto py-2">
              {nodes.map((n) => (
                <div key={n.id} className="min-w-[220px] bg-white p-4 rounded-xl border border-slate-100">
                  <div className="flex justify-between items-center mb-2">
                    <div className="font-black">{n.id}</div>
                    <div className="text-xs text-slate-500">Dwell (hrs)</div>
                  </div>
                  <div className="flex items-end gap-2 h-20">
                    {n.dwell.map((d,i) => (
                      <motion.div key={i} initial={{ height: 4 }} animate={{ height: `${d * 8}px` }} className="flex-1 bg-[#064E3B] rounded-t-md" />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: MANIFEST & AUTH */}
        <div className="lg:col-span-4 space-y-8">
           {/* VECTOR SELECTOR */}
           <div className="bg-[#064E3B] p-8 rounded-[3rem] text-white">
              <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-[#BEF264] mb-8">Vector Authority</h2>
              <div className="space-y-3">
                 {["Air", "Sea", "Land"].map(m => (
                    <button 
                      key={m} 
                      onClick={() => setMode(m)}
                      className={`w-full flex items-center justify-between p-5 rounded-2xl border transition-all ${mode === m ? 'bg-white text-[#064E3B] border-white' : 'bg-white/5 border-white/10 hover:border-white/40'}`}
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-[#064E3B]">
                          {m === "Air" ? <Plane size={16} /> : m === "Sea" ? <Ship size={16} /> : <Truck size={16} />}
                        </div>
                        <span className="text-xs font-black uppercase tracking-widest">{m} Freight</span>
                      </div>
                      {mode === m && <ChevronRight size={16} />}
                    </button>
                 ))}
              </div>
           </div>

           {/* STATS BENTO */}
           <div className="bg-white p-8 rounded-[3rem] border border-slate-100">
              <div className="space-y-8">
                 <div>
                    <div className="flex justify-between items-center mb-2">
                       <span className="text-[10px] font-black uppercase text-slate-400">Payload Capacity</span>
                       <span className="text-xs font-black text-[#064E3B]">{capacity}%</span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                       <motion.div initial={{ width: 0 }} animate={{ width: `${capacity}%` }} className="h-full bg-[#064E3B]" />
                    </div>
                 </div>
                 <div>
                    <div className="flex justify-between items-center mb-2">
                       <span className="text-[10px] font-black uppercase text-slate-400">Carbon Efficiency</span>
                       <span className="text-xs font-black text-[#064E3B]">{efficiency}%</span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                       <motion.div initial={{ width: 0 }} animate={{ width: `${efficiency}%` }} className="h-full bg-[#BEF264]" />
                    </div>
                 </div>
              </div>

              <div className="mt-12 pt-8 border-t border-slate-50 space-y-4">
                 <div className="flex gap-4 items-center">
                    <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-[#064E3B]">
                       <Database size={18} />
                    </div>
                    <div>
                       <div className="text-[9px] font-black text-slate-400 uppercase">Archive ID</div>
                       <div className="text-xs font-bold font-mono">TRV-992-QX-26</div>
                    </div>
                 </div>
              </div>
           </div>

            {/* CALL TO ACTION */}
            <motion.button onClick={() => setManifestOpen(true)} whileTap={{ scale: 0.95 }} whileHover={{ y: -2 }} className="w-full bg-black text-white p-8 rounded-[3rem] font-black text-xs uppercase tracking-[0.3em] flex items-center justify-center gap-4 hover:bg-[#064E3B] transition-all group">
              <Globe2 className="text-[#BEF264] group-hover:rotate-45 transition-transform" size={20} />
              Commit Manifest
            </motion.button>
              <motion.button onClick={() => setRouteSimOpen(true)} whileTap={{ scale: 0.95 }} whileHover={{ y: -2 }} className="w-full mt-3 bg-white text-[#064E3B] p-4 rounded-[2rem] font-black text-xs uppercase tracking-[0.3em] border border-slate-100">Simulate Route</motion.button>
        </div>

      </section>

      {/* Manifest Drawer (replaces modal) */}
      <ManifestDrawer open={manifestOpen} onClose={() => setManifestOpen(false)} onCommit={(sig) => { setLogs(prev => [...prev, 'Manifest committed — signature: ' + (sig || '—')]); }} />

      {/* Route Simulation Modal */}
      <RouteSimulationModal open={routeSimOpen} onClose={() => setRouteSimOpen(false)} />

      {/* Vessel Specs Grid */}
      <div className="max-w-[1500px] mx-auto mt-6">
        <VesselSpecsGrid specs={specs} />
      </div>
    </main>
  );
}