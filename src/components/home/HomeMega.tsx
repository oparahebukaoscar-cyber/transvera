"use client";
import React, { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence, useInView } from "framer-motion";
import dynamic from "next/dynamic";
import useCounter from "../../hooks/useCounter";
import HubMap from "../maps/HubMap";
import { fetchWeatherAlertForCoords } from "../../lib/weather";
import Link from "next/link";
import {
  ArrowRight,
  Activity,
  Globe2,
  AlertTriangle,
  Terminal,
  Plane,
  Ship,
  Truck,
  ChevronRight,
  MapPin,
  Navigation,
  Cpu,
  ShieldCheck,
  Leaf,
  BarChart3,
  FileText,
  Database,
  ShieldAlert,
  Layers,
} from "lucide-react";

// --- Advanced Motion Variants ---
const fader = {
  hidden: { opacity: 0, y: 20 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] },
  },
};
const staggerContainer = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1 } },
};

// Small inline subcomponent
const StatusBadge = ({ label, color = "bg-[#BEF264]" }: { label: string; color?: string }) => (
  <div className="flex items-center gap-2">
    <div className={`w-2 h-2 rounded-full animate-pulse ${color}`} />
    <div className="text-sm font-black uppercase tracking-tight text-slate-500">{label}</div>
  </div>
);

// --- Telemetry Hero Helpers & In-File Components ---
// Keeping these helpers in this file intentionally (structure-first):
// TrafficGauge, SecurityProtocolList, TerminalFeed, TechnicalSidebar, VerificationSequence

// TrafficGauge: semicircle SVG gauge driven by `value` (0-100)
const TrafficGauge = ({ value }: { value: number }) => {
  // radius used to approximate semi-circle arc length
  const radius = 80;
  const arcLength = Math.PI * radius; // semicircle arc length ~ pi * r
  const dash = React.useMemo(() => arcLength * (value / 100), [arcLength, value]);
  const gap = React.useMemo(() => Math.max(0, arcLength - dash), [arcLength, dash]);

  return (
    <div className="relative w-full flex items-center justify-center">
      <svg viewBox="0 0 200 110" className="w-full h-36">
        <path d="M10 100 A90 90 0 0 1 190 100" stroke="rgba(2,6,23,0.08)" strokeWidth="10" fill="none" strokeLinecap="round" />
        <path
          d="M10 100 A90 90 0 0 1 190 100"
          stroke="#BEF264"
          strokeWidth="10"
          fill="none"
          strokeLinecap="round"
          strokeDasharray={`${dash} ${gap}`}
          style={{ transition: 'stroke-dasharray 600ms ease' }}
        />
      </svg>
      <div className="absolute text-sm font-black">{Math.round(value)}%</div>
    </div>
  );
};

// SecurityProtocolList: 5 checklist items (all shown as success by default)
const SecurityProtocolList = ({ items }: { items?: string[] }) => {
  const list = React.useMemo(() => items ?? [
    'HSM Root Key',
    'TLS 1.3 Channel',
    'Manifest Signatures',
    'Biometric Sync',
    'SLA Heartbeat'
  ], [items]);

  return (
    <div className="space-y-3">
      {list.map((it, i) => (
        <div key={i} className="flex items-center gap-3 text-[12px] font-bold">
          <div className="w-6 h-6 bg-[#064E3B] text-[#BEF264] rounded-full flex items-center justify-center">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M20 6L9 17l-5-5" stroke="#BEF264" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </div>
          <div className="text-xs text-slate-700 dark:text-white/90">{it} <span className="text-[10px] text-slate-400 ml-2">Success</span></div>
        </div>
      ))}
    </div>
  );
};

// Terminal feed is rendered client-only to avoid SSR hydration mismatches.
const TerminalFeedClient = dynamic(() => import("../TerminalFeedClient"), { ssr: false });

// TechnicalSidebar: groups TrafficGauge, SecurityProtocolList, TerminalFeed
const TechnicalSidebar = ({ throughput }: { throughput: number }) => {
  return (
    <div className="flex flex-col h-full gap-4">
      <div className="bg-white p-3 rounded-lg">
        <div className="text-[10px] font-black uppercase text-slate-400 mb-2">Throughput Gauge</div>
        <TrafficGauge value={throughput} />
      </div>

      <div className="bg-white p-3 rounded-lg">
        <div className="text-[10px] font-black uppercase text-slate-400 mb-2">Security Protocols</div>
        <SecurityProtocolList />
      </div>

      <div className="bg-[#0b1220] p-3 rounded-lg flex-1 overflow-hidden">
        <div className="text-[10px] font-black uppercase text-slate-400 mb-2 text-white/60">Terminal Feed</div>
        <div className="h-full overflow-auto">
          <TerminalFeedClient />
        </div>
      </div>
    </div>
  );
};

// VerificationSequence modal: 5 automatic phases that advance with useEffect
const VerificationSequence = ({ open, onClose }: { open: boolean; onClose: () => void }) => {
  const steps = React.useMemo(() => [
    'Connecting to SGP-Node...',
    'Rotating TLS 1.3 Keys...',
    'Syncing Asset Manifests...',
    'Biometric Handshake...',
    'System Access Granted.'
  ], []);

  const [index, setIndex] = React.useState(0);
  const [done, setDone] = React.useState(false);

  React.useEffect(() => {
    if (!open) { setIndex(0); setDone(false); return; }
    setIndex(0); setDone(false);
    const id = setInterval(() => {
      setIndex(prev => {
        if (prev >= steps.length - 1) {
          clearInterval(id); setDone(true); return prev;
        }
        return prev + 1;
      });
    }, 1200);
    return () => clearInterval(id);
  }, [open, steps.length]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="bg-white rounded-2xl p-8 w-[480px]">
        <h3 className="text-lg font-black mb-4">Verification Sequence</h3>
        <div className="space-y-2 mb-6">
          {steps.map((s, i) => (
            <div key={i} className={`flex items-center gap-3 ${i === index ? 'text-[#064E3B] font-black' : 'text-slate-400'}`}>
              <div className={`w-4 h-4 rounded-full ${i < index || done ? 'bg-[#BEF264]' : 'bg-white border border-slate-200'}`} />
              <div className="text-sm">{s}</div>
            </div>
          ))}
        </div>
        <div className="flex justify-end gap-3">
          {done ? (
            <button onClick={onClose} className="px-6 py-3 bg-[#064E3B] text-white rounded-lg font-black">Close</button>
          ) : (
            <div className="px-6 py-3 bg-slate-100 rounded-lg text-sm">Processing…</div>
          )}
        </div>
      </div>
    </div>
  );
};

// --- ESG, Fleet and Hardware components (in-file, structure-first) ---
// CarbonEmissionSimulator: produces a live-updating SVG line chart and a simulated PDF generation flow
const CarbonEmissionSimulator = () => {
  const width = 700;
  const height = 140;
  const maxPoints = 60;
  // deterministic initial waveform (no Math.random here to keep server/client markup consistent)
  const [points, setPoints] = React.useState<number[]>(() => Array.from({ length: maxPoints }).map((_, i) => 50 + Math.sin(i / 8) * 6));
  const [pdfGenerating, setPdfGenerating] = React.useState(false);
  const [pdfProgress, setPdfProgress] = React.useState(0);

  // Simulate incoming data stream
  React.useEffect(() => {
    const id = setInterval(() => {
      setPoints(prev => {
        const last = prev[prev.length - 1] ?? 50;
        const noise = (Math.random() - 0.5) * 6;
        const trend = Math.sin(Date.now() / 8000) * 2;
        const next = Math.max(0, Math.min(100, last + noise + trend));
        return [...prev.slice(1), next];
      });
    }, 900);
    return () => clearInterval(id);
  }, []);

  const pathD = React.useMemo(() => {
    const step = width / (maxPoints - 1);
    const y = (v: number) => height - (v / 100) * height;
    return points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${Math.round(i * step)} ${Math.round(y(p))}`).join(' ');
  }, [points]);

  const areaD = React.useMemo(() => `${pathD} L ${width} ${height} L 0 ${height} Z`, [pathD]);

  // Simulated PDF generation
  const startPdf = () => {
    if (pdfGenerating) return;
    setPdfProgress(0);
    setPdfGenerating(true);
    const id = setInterval(() => {
      setPdfProgress(p => {
        const nxt = Math.min(100, p + Math.floor(Math.random() * 18) + 5);
        if (nxt >= 100) {
          clearInterval(id);
          setTimeout(() => setPdfGenerating(false), 500);
        }
        return nxt;
      });
    }, 420);
  };

  return (
    <div>
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-40 rounded-lg overflow-visible">
        <defs>
          <linearGradient id="esgGrad" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#BEF264" stopOpacity="0.28" />
            <stop offset="100%" stopColor="#BEF264" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={areaD} fill="url(#esgGrad)" />
        <path d={pathD} stroke="#BEF264" strokeWidth={2} fill="none" strokeLinejoin="round" strokeLinecap="round" />
      </svg>

      <div className="mt-3 flex items-center justify-between text-sm text-slate-300">
        <div>Real-time Offset Volatility</div>
        <div className="font-mono">{points[points.length - 1].toFixed(2)} kgCO2e</div>
      </div>

      <div className="mt-4 flex items-center gap-4">
        <button onClick={startPdf} className="px-4 py-2 bg-[#064E3B] text-[#BEF264] rounded-md font-black">Download ESG Report</button>
        {pdfGenerating && (
          <div className="flex-1 bg-white/10 rounded-full h-3 overflow-hidden">
            <div className="h-full bg-[#BEF264] transition-all" style={{ width: `${pdfProgress}%` }} />
          </div>
        )}
      </div>
    </div>
  );
};

// FleetStatusTable: lists 15 mock assets to increase code density and provide state
const FleetStatusTable = () => {
  // deterministic values derived from index to avoid server/client mismatch
  const data = React.useMemo(() => Array.from({ length: 15 }).map((_, i) => ({
    id: `ASSET-${1000 + i}`,
    vectorId: `V-${String(i + 1).padStart(3, '0')}`,
    cargoIntegrity: 70 + Math.round(Math.abs(Math.sin(i * 0.73)) * 30),
    fuelOptimization: 40 + Math.round(Math.abs(Math.cos(i * 0.41)) * 60),
    heading: `${(i * 137) % 360}°`
  })), []);

  return (
    <div className="mt-12 bg-white rounded-2xl p-6 border border-slate-100 overflow-auto">
      <div className="text-xl font-black mb-4">Global Asset Fleet Status</div>
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-xs text-slate-500 uppercase border-b border-slate-100">
            <th className="py-2">Vector ID</th>
            <th>Cargo Integrity</th>
            <th>Fuel Optimization</th>
            <th>Current Heading</th>
          </tr>
        </thead>
        <tbody>
          {data.map((r, idx) => (
            <tr key={r.id} className={`${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'}`}>
              <td className="py-3 font-mono font-bold">{r.vectorId}</td>
              <td>
                <div className="w-40 bg-black/5 rounded-full h-3 overflow-hidden">
                  <div className="h-3 bg-[#BEF264]" style={{ width: `${r.cargoIntegrity}%` }} />
                </div>
                <div className="text-[10px] text-slate-400 mt-1">{r.cargoIntegrity}%</div>
              </td>
              <td className="font-bold">{r.fuelOptimization}%</td>
              <td className="font-mono">{r.heading}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

// Hardware layer small components
const ServerNode = ({ name = 'Node-A' }: { name?: string }) => {
  // start with deterministic baseline values to avoid hydration mismatches;
  // introduce variability after mount via the effect below.
  const [temp, setTemp] = React.useState(32);
  const [cpu, setCpu] = React.useState(20);
  React.useEffect(() => {
    const id = setInterval(() => {
      setTemp(t => Math.round((t + (Math.random() - 0.5) * 0.8) * 10) / 10);
      setCpu(c => Math.min(100, Math.max(0, Math.round((c + (Math.random() - 0.5) * 4) * 10) / 10)));
    }, 2200);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="bg-white p-4 rounded-lg border border-slate-100">
      <div className="text-sm font-black mb-2">{name}</div>
      <div className="text-[12px] text-slate-500 mb-2">Liquid Cooling Temp</div>
      <div className="w-full bg-black/5 h-3 rounded-full overflow-hidden mb-2">
        <div className="h-3 bg-[#BEF264]" style={{ width: `${Math.min(100, (temp - 10) * 2)}%` }} />
      </div>
      <div className="text-xs font-mono mb-4">{temp}°C</div>

      <div className="text-[12px] text-slate-500 mb-2">CPU Load</div>
      <div className="w-full bg-black/5 h-3 rounded-full overflow-hidden">
        <div className="h-3 bg-[#064E3B]" style={{ width: `${cpu}%` }} />
      </div>
      <div className="text-xs font-mono mt-2">{cpu}%</div>
    </div>
  );
};

const SatelliteLink = ({ name = 'SAT-1', initialAlt = 35786 }: { name?: string; initialAlt?: number }) => {
  const [alt, setAlt] = React.useState(initialAlt);
  React.useEffect(() => {
    const id = setInterval(() => setAlt(a => Math.max(160, Math.round(a + (Math.random() - 0.5) * 120))), 3000);
    return () => clearInterval(id);
  }, []);
  const attenuation = React.useMemo(() => {
    // simple illustrative attenuation math (not physical exactness)
    const meters = alt * 1000;
    return (20 * Math.log10(meters) - 200).toFixed(2);
  }, [alt]);

  return (
    <div className="bg-white p-4 rounded-lg border border-slate-100">
      <div className="text-sm font-black mb-2">{name}</div>
      <div className="text-xs text-slate-400 mb-2">Orbital Altitude (km)</div>
      <div className="text-lg font-mono mb-2">{alt} km</div>
      <div className="text-xs text-slate-400">Signal Attenuation</div>
      <div className="text-lg font-mono text-[#BEF264]">{attenuation} dB</div>
    </div>
  );
};

const BiometricTerminal = ({ id = 'BT-1' }: { id?: string }) => {
  return (
    <div className="bg-white p-4 rounded-lg border border-slate-100 flex flex-col items-center gap-3">
      <div className="text-sm font-black">{id} Biometric</div>
      <div className="w-28 h-28 bg-slate-50 rounded-full flex items-center justify-center relative overflow-hidden">
        <motion.div animate={{ y: [-18, 18, -18] }} transition={{ duration: 1.2, repeat: Infinity }} className="absolute left-0 right-0 h-1 bg-[#064E3B]/40" />
        <svg width="60" height="60" viewBox="0 0 24 24" className="relative z-10"><path d="M12 2C8 2 5 5 5 9v6a3 3 0 0 0 3 3h8a3 3 0 0 0 3-3V9c0-4-3-7-7-7z" stroke="#064E3B" strokeWidth="1.2" fill="none" /></svg>
      </div>
      <div className="text-xs text-slate-500">Place finger or gaze on sensor</div>
    </div>
  );
};

// Technical Documentation snippet (rendered as a code block)
const TechnicalDocumentation = () => {
  const cfg = React.useMemo(() => ({
    protocol: 'GLHP',
    version: '1.0',
    nodes: ['SGP-1', 'RTM-2', 'DXB-3'],
    handshake: { method: 'ECDH', cipher: 'AES-512-HYBRID' },
    telemetry: { interval_ms: 900, format: 'json' }
  }), []);

  return (
    <div className="mt-12 bg-slate-900 text-white p-6 rounded-2xl overflow-auto">
      <div className="text-lg font-black mb-4">Technical Documentation</div>
      <pre className="text-xs font-mono">{JSON.stringify(cfg, null, 2)}</pre>
    </div>
  );
};

// Corporate Footer (in-file)
const CorporateFooter = () => {
  const nodeEnv = typeof process !== 'undefined' && process.env && process.env.NODE_ENV ? process.env.NODE_ENV : 'development';
  return (
    <footer className="mt-12 bg-slate-900 text-white">
      <div className="max-w-[1600px] mx-auto px-8 py-12 grid grid-cols-1 md:grid-cols-5 gap-6">
        <div>
          <h5 className="font-black mb-4">Operations</h5>
          <ul className="space-y-2 text-sm text-slate-300"><li>Logistics</li><li>Manifest</li><li>Track</li></ul>
        </div>
        <div>
          <h5 className="font-black mb-4">Network</h5>
          <ul className="space-y-2 text-sm text-slate-300"><li>Topology</li><li>Telemetry</li><li>Incidents</li></ul>
        </div>
        <div>
          <h5 className="font-black mb-4">Legal</h5>
          <ul className="space-y-2 text-sm text-slate-300"><li>Terms</li><li>Privacy</li><li>Compliance</li></ul>
        </div>
        <div>
          <h5 className="font-black mb-4">Resources</h5>
          <ul className="space-y-2 text-sm text-slate-300"><li>API</li><li>Docs</li><li>Support</li></ul>
        </div>
        <div>
          <h5 className="font-black mb-4">Company</h5>
          <ul className="space-y-2 text-sm text-slate-300"><li>About</li><li>Careers</li><li>Contact</li></ul>
        </div>
      </div>

      <div className="border-t border-slate-800 py-3">
        <div className="max-w-[1600px] mx-auto px-8 text-xs text-slate-400 flex justify-between items-center">
          <div>NODE_ENV: <span className="font-mono text-white">{nodeEnv}</span> &nbsp; | &nbsp; L3_ENCRYPTION_STATUS: <span className="font-mono text-white">ACTIVE</span></div>
          <div>REDUNDANCY_RATIO: <span className="font-mono text-white">3:1</span></div>
        </div>
      </div>
    </footer>
  );
};

export default function TransveraGlobal() {
  const [trackingId, setTrackingId] = useState("");
  const [isTracking, setIsTracking] = useState(false);
  const [activeRouteTab, setActiveRouteTab] = useState("Air");
  const [selectedHub, setSelectedHub] = useState("Singapore");
  const [verifying, setVerifying] = useState(false);
  // refs for in-view counters
  const hubCardRef = useRef<HTMLDivElement | null>(null);
  const hubCardInView = useInView(hubCardRef, { once: true, margin: "-120px" });

  const capacityRef = useRef<HTMLDivElement | null>(null);
  const capacityInView = useInView(capacityRef, { once: true, margin: "-120px" });

  // Mock Hub Data
  const hubs = {
    Singapore: { status: "Optimal", latency: "12ms", throughput: "98%", coords: "1.3521° N" },
    Rotterdam: { status: "Congested", latency: "45ms", throughput: "82%", coords: "51.9225° N" },
    Dubai: { status: "Optimal", latency: "18ms", throughput: "95%", coords: "25.2048° N" },
    NewYork: { status: "Optimal", latency: "22ms", throughput: "91%", coords: "40.7128° N" },
  };

  // mock weather alerts for telemetry
  const [weatherAlerts, setWeatherAlerts] = useState<Record<string, string | null>>({});

  const hubCoords: Record<string, { lat: number; lon: number }> = {
    Singapore: { lat: 1.3521, lon: 103.8198 },
    Rotterdam: { lat: 51.9225, lon: 4.47917 },
    Dubai: { lat: 25.2048, lon: 55.2708 },
    NewYork: { lat: 40.7128, lon: -74.0060 },
  };

  const _telemetryHubs = Object.entries(hubCoords).map(([k, v]) => ({ id: k, lat: `${v.lat}`, long: `${v.lon}` }));
  const _activeHubObj = {
    id: selectedHub,
    lat: hubCoords[selectedHub as keyof typeof hubCoords]?.lat?.toFixed?.(4) ?? "",
    long: hubCoords[selectedHub as keyof typeof hubCoords]?.lon?.toFixed?.(4) ?? "",
  };

  const telemetryLocations: Record<string, string> = {
    "Port of Singapore (SGP)": "Singapore",
    "North Sea Transit": "Rotterdam",
  };

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      const entries = Object.entries(telemetryLocations);
      const next: Record<string, string | null> = {};
      for (const [label, hubKey] of entries) {
        const coords = hubCoords[hubKey as keyof typeof hubCoords];
        if (!coords) {
          next[label] = null;
          continue;
        }
        const msg = await fetchWeatherAlertForCoords(coords.lat, coords.lon);
        if (!mounted) return;
        next[label] = msg;
      }
      if (mounted) setWeatherAlerts(next);
    };
    load();
    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedHub]);

  // numeric counters (parse percent strings)
  const selectedThroughput = parseInt(hubs[selectedHub as keyof typeof hubs].throughput || "0");
  const throughputValue = useCounter(selectedThroughput, hubCardInView);

  const capacityTarget = 84.2;
  const capacityValue = useCounter(capacityTarget, capacityInView);

  return (
    <main className="min-h-screen bg-[#F8FAFB] text-[#064E3B] selection:bg-[#BEF264] font-sans">
      
      {/* 01. NAVIGATION: ENTERPRISE STANDARD */}
      <nav className="fixed top-0 w-full z-[100] bg-white/80 backdrop-blur-xl border-b border-slate-100">
        <div className="max-w-[1600px] mx-auto px-4 md:px-12 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3 group cursor-pointer">
            <div className="w-10 h-10 bg-[#064E3B] rounded-xl flex items-center justify-center text-[#BEF264] transition-all group-hover:shadow-[0_0_20px_rgba(190,242,100,0.3)]">
              <Navigation size={22} fill="currentColor" />
            </div>
            <div className="flex flex-col">
              <span className="font-black text-xl tracking-tighter uppercase leading-none">Transvera</span>
              <span className="text-[9px] font-bold tracking-[0.3em] text-slate-400 uppercase">Global Logistics</span>
            </div>
          </div>
          
          <div className="hidden lg:flex items-center gap-12 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
            <a href="/intermodal" className="hover:text-[#064E3B] transition-colors relative group">Intermodal<span className="absolute -bottom-1 left-0 w-0 h-[2px] bg-[#BEF264] transition-all group-hover:w-full" /></a>
            <a href="/network" className="hover:text-[#064E3B] transition-colors relative group">Network<span className="absolute -bottom-1 left-0 w-0 h-[2px] bg-[#BEF264] transition-all group-hover:w-full" /></a>
            <a href="/about" className="hover:text-[#064E3B] transition-colors relative group">About<span className="absolute -bottom-1 left-0 w-0 h-[2px] bg-[#BEF264] transition-all group-hover:w-full" /></a>
          </div>

            <div className="flex items-center gap-4">
            <div className="hidden xl:block text-right mr-4">
              <div className="text-[9px] font-bold text-slate-400 uppercase">System Time</div>
              <div className="text-xs font-mono font-bold">21:04:12 UTC</div>
            </div>
            {/* Admin access removed from public UI */}
          </div>
        </div>
      </nav>

      {/* 02. HERO: MISSION CRITICAL TRACKING */}
      <section className="pt-48 pb-32 px-8 relative overflow-hidden bg-white">
        <div className="absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:32px_32px] [mask-image:radial-gradient(ellipse_50%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-40" />
        
        <div className="max-w-[1600px] mx-auto grid lg:grid-cols-12 gap-16 relative z-10 items-start">
          <motion.div initial="hidden" animate="show" variants={staggerContainer} className="lg:col-span-7">
            <motion.div variants={fader}>
              <StatusBadge label="Intermodal Network: Operational" />
            </motion.div>
            
            <motion.h1 variants={fader} className="text-7xl md:text-9xl font-black leading-[0.85] tracking-[ -0.06em] mt-8 mb-10 text-slate-900">
              Precision <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#064E3B] to-slate-400 italic font-light">Telemetry.</span>
            </motion.h1>
            
            <motion.p variants={fader} className="text-xl text-slate-500 max-w-xl mb-12 leading-relaxed font-medium">
              Enterprise-grade infrastructure for moving high-value assets across global vectors with sub-meter accuracy.
            </motion.p>

            <motion.div variants={fader} className="flex flex-col sm:flex-row gap-4 mb-6">
              <div className="flex gap-4 w-full sm:w-auto flex-wrap">
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex items-center gap-3">
                  <div className="p-2 bg-white/5 rounded-lg">
                    <Globe2 className="text-[#064E3B]" />
                  </div>
                  <div>
                    <div className="text-[10px] font-black uppercase text-slate-400">Global Hubs</div>
                    <div className="font-bold text-[#064E3B]">120+</div>
                  </div>
                </div>

                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex items-center gap-3">
                  <div className="p-2 bg-white/5 rounded-lg">
                    <BarChart3 className="text-[#064E3B]" />
                  </div>
                  <div>
                    <div className="text-[10px] font-black uppercase text-slate-400">Avg Transit</div>
                    <div className="font-bold text-[#064E3B]">6.8 days</div>
                  </div>
                </div>

                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex items-center gap-3">
                  <div className="p-2 bg-white/5 rounded-lg">
                    <ShieldCheck className="text-[#064E3B]" />
                  </div>
                  <div>
                    <div className="text-[10px] font-black uppercase text-slate-400">Security Grade</div>
                    <div className="font-bold text-[#064E3B]">T-1</div>
                  </div>
                </div>
              </div>
            </motion.div>

            <motion.div variants={fader} className="flex flex-wrap gap-4">
              <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 flex-1 min-w-[300px]">
                <div className="text-[10px] font-black uppercase text-slate-400 mb-4 tracking-widest flex justify-between">
                  Track Consignment <Cpu size={14} />
                </div>
                <div className="flex gap-2">
                  <input 
                    value={trackingId}
                    onChange={(e) => setTrackingId(e.target.value)}
                    placeholder="Enter ID (e.g. TRV-992-QX)"
                    className="bg-transparent border-b-2 border-slate-200 w-full py-2 font-mono text-xl outline-none focus:border-[#064E3B] transition-colors"
                  />
                  {trackingId ? (
                    <Link href={`/track/${encodeURIComponent(trackingId)}`} className="bg-[#064E3B] text-[#BEF264] p-4 rounded-xl hover:scale-105 transition-transform inline-flex items-center justify-center">
                      <ArrowRight />
                    </Link>
                  ) : (
                    <button 
                      onClick={() => setIsTracking(true)}
                      className="bg-[#064E3B] text-[#BEF264] p-4 rounded-xl hover:scale-105 transition-transform"
                    >
                      <ArrowRight />
                    </button>
                  )}
                </div>
              </div>
            </motion.div>

            {/* Interactive panel (aligned under the search bar, approx width of telemetry card) */}
            <motion.div variants={fader} className="w-full lg:w-[41.666667%] ml-auto">
              <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-black text-slate-500 uppercase">Quick Actions</div>
                  <div className="text-xs text-slate-400">Live</div>
                </div>

                <div className="flex gap-2 flex-wrap">
                  <Link href="/track/TRV-992-ROTTERDAM" className="px-4 py-2 bg-[#064E3B] text-[#BEF264] rounded-xl font-bold">Simulate Tracking</Link>
                  <button onClick={() => { setTrackingId(''); setIsTracking(false); }} className="px-4 py-2 bg-white border border-slate-100 rounded-xl">Reset</button>
                  <Link href="/intermodal" className="px-4 py-2 bg-white border border-slate-100 rounded-xl">Set Sea</Link>
                </div>

                <div className="pt-2 border-t border-slate-100">
                  <div className="text-[10px] font-black uppercase text-slate-400 mb-2">Recent IDs</div>
                  <div className="flex gap-2 flex-wrap">
                    {['TRV-992-ROTTERDAM','TRV-425-DXB','TRV-721-NYC'].map((idItem) => (
                      <Link key={idItem} href={`/track/${encodeURIComponent(idItem)}`} className="px-3 py-2 bg-slate-50 rounded-lg border border-slate-100 text-sm font-bold">{idItem}</Link>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>

          {/* DYNAMIC TELEMETRY CARD */}
          <motion.div initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} className="lg:col-span-5">
            <div className="bg-white text-[#064E3B] rounded-[2.5rem] p-10 shadow-2xl relative overflow-hidden group border border-slate-100">
              
              
              <AnimatePresence mode="wait">
                {isTracking ? (
                  <motion.div key="active" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="relative z-10">
                    <div className="flex justify-between items-start mb-16">
                      <div>
                        <div className="text-[10px] font-black text-[#BEF264] tracking-widest uppercase mb-1">Live Asset Data</div>
                        <div className="text-4xl font-mono font-bold">{trackingId || "TRV-000-00"}</div>
                      </div>
                      <div className="bg-white/10 p-4 rounded-2xl backdrop-blur-md">
                        <Activity className="text-[#BEF264]" size={24} />
                      </div>
                    </div>

                    <div className="space-y-12 relative">
                      <div className="absolute left-[9px] top-2 bottom-2 w-px bg-white/10" />
                      <div className="flex gap-6 items-start relative">
                        <div className="w-5 h-5 rounded-full bg-[#BEF264] ring-8 ring-[#BEF264]/10 z-10" />
                        <div>
                          <div className="text-sm font-bold uppercase tracking-tight">Port of Singapore (SGP)</div>
                          <div className="text-xs text-slate-400 mt-1 italic font-mono">Cleared Customs • 14:02 UTC</div>
                        </div>
                      </div>
                      <div className="flex gap-6 items-start relative opacity-30">
                        <div className="w-5 h-5 rounded-full bg-white/20 z-10" />
                        <div>
                              <div className="flex items-center gap-2">
                                <div className="text-sm font-bold uppercase tracking-tight">North Sea Transit</div>
                                {weatherAlerts["North Sea Transit"] && (
                                  <span title={weatherAlerts["North Sea Transit"]} className="text-amber-300">
                                    <AlertTriangle />
                                  </span>
                                )}
                              </div>
                              <div className="text-xs text-slate-400 mt-1 font-mono italic">ETA: +48.2 Hours</div>
                        </div>
                      </div>
                    </div>

                    <div className="mt-16 grid grid-cols-2 gap-4">
                      <div className="bg-white/5 p-4 rounded-xl border border-white/5">
                        <div className="text-[9px] font-black uppercase text-slate-400 mb-1">Environment</div>
                        <div className="text-xs font-bold text-[#BEF264]">Temperature Controlled</div>
                      </div>
                      <div className="bg-white/5 p-4 rounded-xl border border-white/5">
                        <div className="text-[9px] font-black uppercase text-slate-400 mb-1">Risk Level</div>
                        <div className="text-xs font-bold">L1: Minimal</div>
                      </div>
                    </div>
                  </motion.div>
                ) : (
                  <div className="w-full">
                    <div className="w-full h-48 md:h-56 lg:h-64 overflow-hidden rounded-xl mb-4 bg-slate-50 border border-slate-100">
                      <HubMap selectedHub={selectedHub} />
                    </div>

                    <div className="flex flex-col items-center justify-center text-center py-4">
                      <div className="w-20 h-20 bg-white/5 rounded-3xl flex items-center justify-center mb-4 animate-pulse">
                        <Terminal size={40} className="text-slate-500" />
                      </div>
                      <h3 className="text-2xl font-black mb-2 italic">Awaiting Telemetry</h3>
                      <p className="text-sm text-slate-400 max-w-[300px]">System ready for secure manifest verification.</p>
                    </div>
                  </div>
                )}
              </AnimatePresence>

              <div className="mt-8 bg-white rounded-2xl overflow-hidden p-4">
                <div className="grid grid-cols-3 gap-4 items-start">
                  <div className="col-span-2">
                    <div className="p-4 bg-slate-50 rounded-lg border border-slate-100">
                      <p className="text-sm text-slate-500">Telemetry overview will appear here when active.</p>
                    </div>
                      <div className="mt-4 flex justify-end gap-3">
                      <button onClick={() => setVerifying(true)} className="px-6 py-3 bg-[#064E3B] text-[#BEF264] rounded-xl font-black">System Ready</button>
                      <Link href="/resources" className="px-6 py-3 bg-white rounded-xl border border-slate-100 inline-block text-center">Details</Link>
                    </div>
                  </div>

                  <div className="col-span-1">
                    <TechnicalSidebar throughput={Math.min(100, Math.round(throughputValue))} />
                  </div>
                </div>
              </div>

              <VerificationSequence open={verifying} onClose={() => setVerifying(false)} />

            </div>
          </motion.div>
        </div>
      </section>

      {/* 03. LIVE NETWORK FEED TICKER */}
      <div className="bg-white border-y border-slate-100 py-6 overflow-hidden">
        <div className="flex whitespace-nowrap gap-16 animate-[marquee_40s_linear_infinite]">
          {[1,2,3,4,5,6].map((i) => (
            <div key={i} className="flex items-center gap-6 text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">
              <span className="text-[#064E3B]">Hub-Singapore: Active</span>
              <span className="text-[#BEF264] flex items-center gap-2"><Ship size={12}/> VSL-992-ROTTERDAM</span>
              <span className="text-slate-200">|</span>
              <span className="text-[#064E3B]">Hub-Dubai: Optimal</span>
              <span className="text-[#BEF264] flex items-center gap-2"><Plane size={12}/> FLT-TX-202</span>
            </div>
          ))}
        </div>
      </div>

      {/* 04. INTERACTIVE ROUTE OPTIMIZER */}
      <section className="py-32 px-8 bg-slate-50" id="intermodal">
        <div className="max-w-[1600px] mx-auto">
          <div className="grid lg:grid-cols-3 gap-12">
            <div className="lg:col-span-1">
              <h2 className="text-4xl font-black tracking-tighter mb-6 uppercase">Vector <br />Optimization.</h2>
              <p className="text-slate-500 mb-10 leading-relaxed font-medium">Select a transport modality to view real-time network throughput and capacity metrics.</p>
              
              <div className="space-y-4">
                {["Air", "Sea", "Land"].map((mode) => (
                  <button 
                    key={mode}
                    onClick={() => setActiveRouteTab(mode)}
                    className={`w-full p-6 rounded-2xl flex items-center justify-between border transition-all ${activeRouteTab === mode ? "bg-[#064E3B] text-white border-[#064E3B] shadow-2xl" : "bg-white border-slate-200 hover:border-[#BEF264]"}`}
                  >
                    <div className="flex items-center gap-4">
                      {mode === "Air" && <Plane />}
                      {mode === "Sea" && <Ship />}
                      {mode === "Land" && <Truck />}
                      <span className="font-black uppercase tracking-widest text-xs">{mode} Freight</span>
                    </div>
                    <ChevronRight size={16} />
                  </button>
                ))}
              </div>
            </div>

            <div className="lg:col-span-2 grid md:grid-cols-2 gap-8">
              <div ref={capacityRef} className="bg-white p-10 rounded-[2.5rem] border border-slate-100 flex flex-col justify-between group">
                <div>
                      <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-8">Capacity Analytics</div>
                      <h3 className="text-5xl font-black mb-4 tracking-tighter">{capacityValue.toFixed(1)}%</h3>
                      <p className="text-sm text-slate-500 mb-8 font-medium">Current active utilization across the {activeRouteTab} network vector.</p>
                </div>
                <div className="h-32 flex items-end gap-1">
                   {[40, 70, 45, 90, 65, 80, 50, 84].map((h, i) => (
                     <motion.div 
                       key={i} 
                       initial={{ height: 0 }} animate={{ height: `${h}%` }}
                       className={`flex-1 rounded-t-lg transition-colors ${i === 7 ? "bg-[#BEF264]" : "bg-slate-100 group-hover:bg-slate-200"}`} 
                     />
                   ))}
                </div>
              </div>

              <div className="bg-[#BEF264]/10 p-10 rounded-[2.5rem] border border-[#BEF264]/20">
                <div className="text-[10px] font-black text-[#064E3B] uppercase tracking-widest mb-8">Mode Specifications</div>
                <ul className="space-y-6">
                  {[
                    { l: "Transit Time", v: activeRouteTab === "Air" ? "24-48 Hours" : "12-24 Days" },
                    { l: "Payload Max", v: activeRouteTab === "Air" ? "120,000 kg" : "24,000 TEU" },
                    { l: "Security Grade", v: "T-1 Encryption" },
                    { l: "Carbon Rating", v: activeRouteTab === "Air" ? "High" : "Optimal" },
                  ].map((spec, i) => (
                    <li key={i} className="flex justify-between border-b border-[#064E3B]/10 pb-4">
                      <span className="text-[10px] font-black uppercase text-slate-500">{spec.l}</span>
                      <span className="text-xs font-black text-[#064E3B]">{spec.v}</span>
                    </li>
                  ))}
                </ul>
                <Link href="/generate-tracking" className="w-full mt-10 inline-block text-center bg-[#064E3B] text-white py-4 rounded-xl text-[10px] font-black uppercase tracking-widest hover:shadow-xl transition-all">
                  Generate Route Quote
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 05. GLOBAL INFRASTRUCTURE GRID (BENTO) */}
      <section className="py-32 px-8 bg-white" id="network hubs">
        <div className="max-w-[1600px] mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-end mb-16">
            <div className="max-w-2xl">
              <h2 className="text-5xl font-black tracking-tighter uppercase mb-4">Strategic <br />Network Nodes.</h2>
              <p className="text-slate-500 font-medium">Monitoring throughput and latency across our primary intermodal exchange points.</p>
            </div>
            <div className="flex gap-2 bg-slate-50 p-2 rounded-2xl border border-slate-100">
               {Object.keys(hubs).map(hub => (
                 <button 
                  key={hub} 
                  onClick={() => setSelectedHub(hub)}
                  className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${selectedHub === hub ? "bg-white shadow-sm text-[#064E3B]" : "text-slate-400"}`}
                 >
                   {hub}
                 </button>
               ))}
            </div>
          </div>

          <div className="grid lg:grid-cols-4 gap-8">
            {/* interactive map */}
            <div className="lg:col-span-4 mb-6">
              <div className="w-full overflow-hidden rounded-2xl p-1 bg-slate-100 border border-slate-100 max-h-[450px]">
                <div className="aspect-video h-full w-full overflow-hidden rounded-xl">
                  <HubMap selectedHub={selectedHub} />
                </div>
              </div>
            </div>

            {/* HUB STATUS CARD */}
            <div ref={hubCardRef} className="lg:col-span-2 bg-slate-900 text-white rounded-[3rem] p-12 relative overflow-hidden">
               <div className="absolute top-0 right-0 p-12 opacity-10"><Globe2 size={180} /></div>
               <div className="relative z-10">
                 <div className="flex items-center gap-3 mb-12">
                   <div className={`w-3 h-3 rounded-full animate-pulse ${hubs[selectedHub as keyof typeof hubs].status === "Optimal" ? "bg-[#BEF264]" : "bg-amber-400"}`} />
                   <span className="text-xs font-black uppercase tracking-[0.2em]">Live Hub Status: {selectedHub}</span>
                 </div>
                 <div className="grid grid-cols-2 gap-12">
                   <div>
                     <div className="text-[9px] font-black uppercase text-slate-500 mb-2">Throughput</div>
                     <div className="text-5xl font-black text-[#BEF264]">{Math.round(throughputValue)}%</div>
                   </div>
                   <div>
                     <div className="text-[9px] font-black uppercase text-slate-500 mb-2">Network Latency</div>
                     <div className="text-5xl font-black">{hubs[selectedHub as keyof typeof hubs].latency}</div>
                   </div>
                 </div>
                 <div className="mt-16 flex items-center gap-4 text-xs font-mono opacity-50 uppercase tracking-widest">
                   <MapPin size={14} /> Coordinates: {hubs[selectedHub as keyof typeof hubs].coords}
                 </div>
               </div>
            </div>

            {/* SECURITY PROTOCOL CARD */}
            <div className="bg-slate-50 rounded-[3rem] p-10 border border-slate-100 flex flex-col justify-between">
              <div className="w-16 h-16 bg-white rounded-2xl shadow-sm flex items-center justify-center text-[#064E3B]">
                <ShieldCheck size={32} />
              </div>
              <div>
                <h4 className="text-xl font-black mb-2 uppercase">L3 Security.</h4>
                <p className="text-sm text-slate-500 font-medium">All consignments are processed via biometric verification and AI-threat detection protocols.</p>
              </div>
              <Link href="/security" className="text-xs font-black uppercase tracking-widest border-b-2 border-[#BEF264] pb-1 w-fit mt-6 inline-block">Review Security Docs</Link>
            </div>

            {/* SYSTEM UPTIME */}
            <div className="bg-[#064E3B] text-white rounded-[3rem] p-10 flex flex-col justify-between relative overflow-hidden">
              <div className="relative z-10">
                <h4 className="text-xl font-black mb-2 uppercase">Global Uptime.</h4>
                <div className="text-6xl font-black text-[#BEF264] tracking-tighter mt-4">99.99<span className="text-2xl text-white">%</span></div>
              </div>
              <div className="flex gap-1 mt-12 relative z-10">
                {Array.from({ length: 24 }).map((_, i) => (
                  <div key={i} className="h-8 flex-1 bg-[#BEF264]/20 rounded-sm overflow-hidden">
                    <div className="h-full bg-[#BEF264]" style={{ width: '100%' }} />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 06. SUSTAINABILITY & ESG DASHBOARD */}
      <section className="py-32 px-8 bg-slate-900 text-white relative" id="sustainability">
        <div className="max-w-[1600px] mx-auto">
          <div className="grid lg:grid-cols-2 gap-20 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded bg-[#BEF264]/10 text-[#BEF264] text-[10px] font-black uppercase tracking-widest mb-8">
                <Leaf size={14} /> ESG Verification Level: AAA
              </div>
              <h2 className="text-5xl font-black tracking-tight mb-8 leading-none uppercase">Sustainable <br />Global Transit.</h2>
              <p className="text-slate-400 text-lg mb-12 leading-relaxed">
                Transvera is committed to carbon-neutral intermodal logistics. We utilize AI to optimize routes and reduce idle time by 42% across all maritime vectors.
              </p>
              
              <div className="grid sm:grid-cols-2 gap-8">
                <div className="bg-white/5 p-8 rounded-3xl border border-white/10">
                  <div className="text-4xl font-black text-[#BEF264] mb-2">12.4k</div>
                  <div className="text-[10px] font-black uppercase tracking-widest text-slate-500">Tons CO2 Offset YTD</div>
                </div>
                <div className="bg-white/5 p-8 rounded-3xl border border-white/10">
                  <div className="text-4xl font-black text-[#BEF264] mb-2">100%</div>
                  <div className="text-[10px] font-black uppercase tracking-widest text-slate-500">Renewable Hub Energy</div>
                </div>
              </div>
            </div>

            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-[#BEF264] to-emerald-500 rounded-[3rem] blur opacity-20 group-hover:opacity-40 transition duration-1000"></div>
              <div className="relative bg-slate-800 rounded-[3rem] p-12 border border-white/10">
                <div className="flex justify-between items-start mb-12">
                  <h4 className="text-xl font-black uppercase tracking-tighter italic text-[#BEF264]">Eco-Routing Visualizer</h4>
                  <BarChart3 className="text-slate-500" />
                </div>
                <div className="space-y-8">
                  {[
                    { l: "Vessel Hybrid Tech", p: "88%" },
                    { l: "Bio-Fuel Aviation", p: "62%" },
                    { l: "Electric Ground Fleet", p: "94%" },
                  ].map((stat, i) => (
                    <div key={i}>
                      <div className="flex justify-between text-[10px] font-black uppercase mb-3 tracking-widest">
                        <span>{stat.l}</span>
                        <span className="text-[#BEF264]">{stat.p}</span>
                      </div>
                      <div className="h-1.5 w-full bg-slate-700 rounded-full overflow-hidden">
                        <motion.div 
                          initial={{ width: 0 }} whileInView={{ width: stat.p }}
                          className="h-full bg-gradient-to-r from-[#BEF264] to-emerald-400" 
                        />
                      </div>
                    </div>
                  ))}
                </div>
                <Link href="/resources" className="w-full mt-12 border border-white/20 py-4 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-white hover:text-black transition-all inline-block text-center">
                  Download ESG Report 2026
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 06b. ENTERPRISE FINALIZATION - ESG, Fleet, Hardware, Docs, Footer */}
      <section className="py-20 px-8 bg-white" id="enterprise-final">
        <div className="max-w-[1600px] mx-auto">
          <div className="grid lg:grid-cols-3 gap-8 items-start">
            <div className="lg:col-span-1">
              <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
                <h3 className="text-xl font-black mb-4">ESG Simulator</h3>
                <CarbonEmissionSimulator />
              </div>
              <div className="mt-6">
                <h4 className="text-sm font-black uppercase text-slate-500 mb-3">Quick Actions</h4>
                <div className="flex gap-3">
                  <Link href="/analyze" className="px-4 py-2 bg-[#064E3B] text-[#BEF264] rounded-md font-black inline-block text-center">Analyze</Link>
                  <Link href="/export" className="px-4 py-2 bg-white border border-slate-100 rounded-md inline-block text-center">Export</Link>
                </div>
              </div>
            </div>

            <div className="lg:col-span-2">
              <div className="bg-white p-6 rounded-2xl border border-slate-100">
                <h3 className="text-xl font-black mb-4">Fleet Overview</h3>
                <FleetStatusTable />
              </div>

              <div className="mt-8 grid sm:grid-cols-3 gap-6">
                <ServerNode name="Node-Alpha" />
                <SatelliteLink name="LEO-Carrier" initialAlt={1200} />
                <BiometricTerminal id="Dock-BT" />
              </div>

              <div className="mt-8">
                <TechnicalDocumentation />
              </div>
            </div>
          </div>
        </div>
      </section>

      <CorporateFooter />

      {/* 07. COMPLIANCE & DOCUMENT CENTER */}
      <section className="py-32 px-8 bg-white" id="api">
        <div className="max-w-[1600px] mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-5xl font-black tracking-tighter uppercase mb-6">Compliance Terminal.</h2>
            <p className="text-slate-500 max-w-2xl mx-auto font-medium">Access required customs documentation and enterprise API integration keys for automated logistics management.</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { icon: FileText, t: "Manifest Templates", d: "Standardized consignment forms for 190+ jurisdictions." },
              { icon: Database, t: "API Integration", d: "JSON-based telemetry feeds for enterprise ERP systems." },
              { icon: ShieldAlert, t: "Customs Clearance", d: "Automated VAT and import duty calculation protocols." },
              { icon: Layers, t: "Route Archives", d: "Historical transit data and intermodal performance logs." },
            ].map((item, idx) => (
              <div key={idx} className="bg-slate-50 p-10 rounded-[2.5rem] border border-slate-100 hover:border-[#BEF264] transition-colors group cursor-pointer">
                <div className="w-14 h-14 bg-white rounded-2xl shadow-sm flex items-center justify-center text-[#064E3B] mb-8 group-hover:bg-[#064E3B] group-hover:text-white transition-all">
                  <item.icon size={24} />
                </div>
                <h5 className="font-black uppercase tracking-widest text-sm mb-4">{item.t}</h5>
                <p className="text-xs text-slate-500 leading-relaxed">{item.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer removed — use shared Footer from layout.tsx to avoid duplication */}
    </main>
  );
}