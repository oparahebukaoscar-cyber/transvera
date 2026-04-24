"use client";
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence, useScroll, useTransform } from "framer-motion";
import {
  ShieldCheck, Fingerprint, Key, Lock, 
  Cpu, Award, Milestone, Globe, 
  ChevronRight, Database, Eye, Zap,
  Server, HardDrive, BarChart3, Binary
} from "lucide-react";
import QuantumEncryptionFlow from "@/components/QuantumEncryptionFlow";
import ScrollTimeline from "@/components/ScrollTimeline";
import GlobalComplianceGrid from "@/components/GlobalComplianceGrid";
import HardwareHardening from "@/components/HardwareHardening";
import AwardGallery from "@/components/AwardGallery";
import FeaturePreviewTiles from "@/components/FeaturePreviewTiles";

// --- Sophisticated Sub-Components ---

const AchievementCard = ({ year, title, desc }) => (
  <div className="relative pl-8 border-l border-slate-200 pb-12 group">
    <div className="absolute -left-1.5 top-0 w-3 h-3 rounded-full bg-slate-200 group-hover:bg-[#BEF264] transition-colors" />
    <div className="text-[10px] font-black text-[#064E3B] mb-1 font-mono">{year}</div>
    <h4 className="text-lg font-black uppercase tracking-tighter mb-2">{title}</h4>
    <p className="text-xs text-slate-500 leading-relaxed max-w-sm">{desc}</p>
  </div>
);

const SecurityMetric = ({ label, value, sub }) => (
  <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm flex flex-col justify-between hover:shadow-xl transition-all">
    <div className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 mb-6">{label}</div>
    <div className="text-5xl font-black text-[#064E3B] tracking-tighter mb-2">{value}</div>
    <div className="text-[10px] font-bold text-[#BEF264] px-2 py-1 bg-[#064E3B] w-fit rounded uppercase">{sub}</div>
  </div>
);

export default function AboutPage() {
  const [activeTab, setActiveTab] = useState("Heritage");
  const [authSequence, setAuthSequence] = useState(0);

  // Security Pulse Simulation
  useEffect(() => {
    const interval = setInterval(() => {
      setAuthSequence(prev => (prev + 1) % 100);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <main className="min-h-screen bg-[#F9FBFA] pt-32 pb-20 px-8 relative overflow-hidden">
      {/* Background Decorative Element */}
      <div className="absolute top-0 right-0 w-1/2 h-screen bg-[#064E3B]/[0.02] -skew-x-12 pointer-events-none" />

      <section className="max-w-[1400px] mx-auto relative z-10">
        
        {/* HEADER SECTION */}
        <div className="grid lg:grid-cols-2 gap-20 items-end mb-24">
          <div>
            <div className="flex items-center gap-3 mb-6">
              <span className="h-[1px] w-12 bg-[#064E3B]" />
              <span className="text-[10px] font-black uppercase tracking-[0.4em] text-[#064E3B]">Transvera Global Infrastructure</span>
            </div>
            <h1 className="text-7xl md:text-9xl font-black uppercase tracking-tighter leading-[0.8] mb-8">
              Legacy <br /> <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#064E3B] to-slate-400">Secured.</span>
            </h1>
            <p className="text-slate-500 text-lg font-medium max-w-md leading-relaxed">
              Orchestrating the world's most sensitive supply chains through quantum-resistant encryption and historical operational excellence.
            </p>
          </div>

          <FeaturePreviewTiles activeTab={activeTab} setActiveTab={setActiveTab} />
        </div>

        <AnimatePresence mode="wait">
          {activeTab === "Heritage" && (
            <motion.div 
              key="heritage"
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
              className="space-y-12"
            >
              <div className="bg-white rounded-2xl overflow-hidden border border-slate-100">
                <ScrollTimeline />
              </div>

              <div className="grid lg:grid-cols-12 gap-12">
                <div className="lg:col-span-4 bg-white p-12 rounded-[3rem] border border-slate-100 shadow-sm">
                  <h2 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-12 flex items-center gap-2">
                    <Milestone size={14} /> Operational Evolution
                  </h2>
                  <div className="space-y-2">
                    <AchievementCard year="1992" title="The Blueprint" desc="Founded as a private maritime logistics firm focused on the Singapore-Rotterdam vector." />
                    <AchievementCard year="2004" title="Aero-Expansion" desc="Inaugurated the first high-velocity air-freight hub in Dubai International." />
                    <AchievementCard year="2018" title="Digital Hardening" desc="Implementation of the first blockchain-backed manifest system for global trade." />
                    <AchievementCard year="2026" title="Quantum Integration" desc="Transvera OS goes live with post-quantum encryption across all intermodal nodes." />
                  </div>
                </div>

                <div className="lg:col-span-8 grid md:grid-cols-2 gap-8">
                  <div className="bg-[#064E3B] rounded-[3rem] p-12 text-white flex flex-col justify-between group overflow-hidden relative">
                     <Award className="absolute -right-8 -bottom-8 w-64 h-64 text-white/5 rotate-12" />
                     <div className="relative z-10">
                      <h3 className="text-4xl font-black uppercase tracking-tighter leading-none mb-6 italic">World Logistics <br /> Award 2025</h3>
                      <p className="text-white/60 text-sm leading-relaxed max-w-xs">Recognized for "Unrivaled Technical Innovation in Global Supply Chain Security."</p>
                     </div>
                     <div className="mt-12 flex items-center gap-4 text-[10px] font-black uppercase tracking-widest text-[#BEF264]">
                       <span>View Certificate</span>
                       <ChevronRight size={14} />
                     </div>
                  </div>

                  <div className="grid grid-rows-2 gap-8">
                    <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 flex items-center gap-8">
                      <div className="w-16 h-16 rounded-2xl bg-slate-50 flex items-center justify-center text-[#064E3B]"><Globe size={32} /></div>
                      <div>
                        <div className="text-3xl font-black">142</div>
                        <div className="text-[10px] font-black uppercase text-slate-400">Global Strategic Nodes</div>
                      </div>
                    </div>
                    <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 flex items-center gap-8">
                      <div className="w-16 h-16 rounded-2xl bg-slate-50 flex items-center justify-center text-[#064E3B]"><Zap size={32} /></div>
                      <div>
                        <div className="text-3xl font-black">0.4ms</div>
                        <div className="text-[10px] font-black uppercase text-slate-400">Network Latency Avg</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <AwardGallery />
              </div>
            </motion.div>
          )}

          {activeTab === "Security" && (
            <motion.div 
              key="security"
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              className="space-y-12"
            >
              {/* ENCRYPTION VISUALIZER */}
              <div className="bg-slate-900 rounded-[3rem] p-12 border border-slate-800 relative overflow-hidden">
                <div className="grid lg:grid-cols-2 gap-12 items-center">
                  <div>
                    <h2 className="text-[10px] font-black uppercase tracking-widest text-[#BEF264] mb-8 flex items-center gap-2">
                      <Binary size={14} /> Cryptographic Infrastructure
                    </h2>
                    <h3 className="text-4xl text-white font-black uppercase tracking-tighter mb-6">AES-512 Quantum-Hybrid <br /> Tunneling.</h3>
                    <p className="text-white/40 text-sm leading-relaxed mb-8 max-w-md">
                      Our proprietary security stack ensures that every manifest is signed with a hardware-rooted key, making asset interference mathematically impossible.
                    </p>
                    <div className="flex gap-4">
                      <div className="bg-white/5 p-4 rounded-xl border border-white/10 flex flex-col gap-2">
                        <Lock className="text-[#BEF264]" size={20} />
                        <span className="text-[10px] font-mono text-white/60">SHA-3 Integrity</span>
                      </div>
                      <div className="bg-white/5 p-4 rounded-xl border border-white/10 flex flex-col gap-2">
                        <Fingerprint className="text-[#BEF264]" size={20} />
                        <span className="text-[10px] font-mono text-white/60">Biometric Sync</span>
                      </div>
                    </div>
                  </div>

                  <div className="relative w-full">
                    <QuantumEncryptionFlow />
                  </div>
                </div>
              </div>

              {/* SECURITY METRICS */}
              <div className="grid md:grid-cols-3 gap-8">
                <SecurityMetric label="Uptime Reliability" value="99.99%" sub="Enterprise Grade" />
                <SecurityMetric label="Data Hardening" value="Tier 4" sub="Gov-Standard" />
                <SecurityMetric label="Breach History" value="ZERO" sub="Since Inception" />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* COMPLIANCE GRID (BOTTOM SECTION) */}
        <div className="mt-24 pt-12 border-t border-slate-100 grid md:grid-cols-4 gap-8">
           <div>
              <h4 className="text-[10px] font-black uppercase text-slate-400 mb-6 tracking-widest">Compliance Standards</h4>
              <div className="space-y-4">
                 <div className="flex items-center gap-3 text-xs font-bold"><ShieldCheck size={14} className="text-[#064E3B]" /> ISO 27001 Certified</div>
                 <div className="flex items-center gap-3 text-xs font-bold"><ShieldCheck size={14} className="text-[#064E3B]" /> GDP Compliant Transit</div>
                 <div className="flex items-center gap-3 text-xs font-bold"><ShieldCheck size={14} className="text-[#064E3B]" /> C-TPAT Tier 3</div>
              </div>
           </div>
           <div className="md:col-span-3 bg-white p-10 rounded-[2.5rem] border border-slate-50 flex flex-col md:flex-row justify-between items-center gap-8">
              <div className="flex items-center gap-8">
                 <div className="w-16 h-16 rounded-full border-4 border-[#BEF264] border-t-[#064E3B] animate-spin flex items-center justify-center">
                    <Database size={20} className="text-[#064E3B]" />
                 </div>
                 <div>
                    <h4 className="text-xl font-black uppercase tracking-tighter">Real-Time Audit Ledger</h4>
                    <p className="text-xs text-slate-400 font-medium">Immutable event tracking for every asset movement in the Transvera network.</p>
                 </div>
              </div>
              <button className="px-10 py-5 bg-[#064E3B] text-white rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-black transition-all">
                 Request Access
              </button>
           </div>
        </div>

      </section>
    </main>
  );
}

