"use client";
import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Activity, Package, Globe, ChevronLeft, 
  MapPin, Info, User, Box, Phone, ShieldCheck,
  Terminal
} from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';

export default function TrackingPage() {
  const { id } = useParams();
  const router = useRouter();
  const [data, setData] = useState(null);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const { data: asset, error: assetError } = await supabase
        .from('assets')
        .select('*')
        .eq('serial_number', id)
        .single();

      if (assetError || !asset) {
        setLoading(false);
        return;
      }

      const { data: telemetry } = await supabase
        .from('telemetry_logs')
        .select('*')
        .eq('asset_id', asset.id)
        .order('created_at', { ascending: false })
        .limit(6);

      setData(asset);
      setLogs(telemetry || []);
      setLoading(false);
    };

    fetchData();

    const channel = supabase
      .channel(`tracking-${id}`)
      .on('postgres_changes', 
        { event: 'UPDATE', schema: 'public', table: 'assets', filter: `serial_number=eq.${id}` }, 
        (payload) => setData(payload.new)
      )
      .on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'telemetry_logs' }, 
        (payload) => {
          if (payload.new.asset_id === data?.id) {
            setLogs(prev => [payload.new, ...prev.slice(0, 5)]);
          }
        }
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [id, data?.id]);

  if (loading) return (
    <div className="h-screen flex items-center justify-center bg-white font-mono text-[10px] tracking-[0.4em] text-slate-400">
      <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1.5 }}>
        CONNECTING TO TRANSVERA CORE...
      </motion.div>
    </div>
  );

  if (!data) return (
    <div className="h-screen flex flex-col items-center justify-center bg-white p-6 text-center">
      <h2 className="text-2xl font-black tracking-tighter mb-4 uppercase">Link Severed</h2>
      <button onClick={() => router.push('/')} className="bg-slate-900 text-white px-8 py-3 rounded-full font-bold text-xs tracking-widest hover:bg-blue-600 transition-all">BACK TO TERMINAL</button>
    </div>
  );

  // UPDATED LOGIC: Lamborghini Aventador S Roadster & Revised Valuations
  const meta = typeof data.metadata === 'string' ? JSON.parse(data.metadata) : data.metadata || {};
  
  const lamboImg = "https://res.cloudinary.com/datw6p2gh/image/upload/v1777210576/Avantador_LP_740_S_Roadstar_1_ae5zjq.jpg";
  const watchImg = "https://res.cloudinary.com/datw6p2gh/image/upload/v1776946884/download_-_2026-04-23T131705.533_o71frf.jpg";

  const items = [
    { name: "Lamborghini Aventador S Roadster", quantity: 1, value_usd: 247000, image: lamboImg },
    { name: "Rolex Luxury Timepieces", quantity: 2, value_usd: 75000, image: watchImg }
  ];

  const recipientName = meta.recipient?.name || meta.recipient_name || "Paola Varese";
  const recipientPhone = meta.recipient?.phone || meta.recipient_phone || "+39 338 394 3397";
  const status = (data.tracking_status || data.current_status || 'In Transit').toUpperCase();
  const gallery = [lamboImg, watchImg];
  const activeStep = status.includes('ARRIVED') || status.includes('DELIVERED') ? 3 : 2;

  return (
    <div className="min-h-screen bg-[#FDFDFD] text-slate-900 font-sans selection:bg-blue-50 pb-20">
      
      {/* NAVIGATION */}
      <nav className="sticky top-0 z-50 bg-white/70 backdrop-blur-xl border-b border-slate-100 px-8 h-20 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <button onClick={() => router.back()} className="p-2 hover:bg-slate-100 rounded-full transition-all">
            <ChevronLeft size={20} />
          </button>
          <span className="font-black tracking-tighter text-2xl text-blue-600 leading-none">TRANSVERA</span>
        </div>
        <div className="hidden md:flex items-center gap-2 bg-slate-50 px-4 py-2 rounded-full border border-slate-100">
          <ShieldCheck size={14} className="text-blue-500" />
          <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">Live Secure Link</span>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto p-6 md:p-12">
        
        {/* HEADER AREA */}
        <header className="mb-12 flex flex-col lg:flex-row justify-between items-start lg:items-end gap-10">
          <div className="space-y-6">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.3em] mb-1">Serial Number</p>
              <h1 className="text-4xl md:text-5xl font-black tracking-tighter text-slate-900">{id}</h1>
            </div>
            
            <div className="flex flex-wrap gap-10 items-center">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 shadow-sm">
                  <User size={20} />
                </div>
                <div>
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Recipient</p>
                  <p className="text-base font-black text-slate-900">{recipientName}</p>
                </div>
              </div>
              <div className="flex items-center gap-4 border-l border-slate-100 pl-10">
                <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400">
                  <Phone size={20} />
                </div>
                <div>
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Contact</p>
                  <p className="text-base font-bold text-slate-900 font-mono tracking-tight">{recipientPhone}</p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="bg-slate-900 text-white p-6 rounded-[2rem] shadow-xl flex items-center gap-5 min-w-[240px]">
            <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white">
              <Activity size={20} className="animate-pulse" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Status</p>
              <p className="text-xl font-black tracking-tight uppercase italic text-blue-400">{status}</p>
            </div>
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          
          {/* 1. ROUTE MAP */}
          <div className="md:col-span-8 bg-white rounded-[3rem] border border-slate-100 p-10 relative overflow-hidden flex flex-col justify-between min-h-[420px] shadow-sm">
             <div className="absolute inset-0 opacity-[0.02] pointer-events-none" 
                 style={{ backgroundImage: `radial-gradient(#000 1px, transparent 1px)`, backgroundSize: '24px 24px' }} />
            
            <div className="flex justify-between items-start relative z-10">
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Origin</p>
                <h3 className="text-3xl font-black tracking-tight">{data.origin || 'New York, USA'}</h3>
              </div>
              <div className="text-right space-y-1">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Destination</p>
                <h3 className="text-3xl font-black tracking-tight">{data.destination || 'Quarna Sopra, Italy'}</h3>
              </div>
            </div>

            <div className="relative h-40 flex items-center px-12">
              <div className="w-full h-[1px] bg-slate-100 absolute left-0" />
              <motion.div 
                initial={{ width: 0 }} 
                animate={{ width: `${(activeStep/3)*100}%` }} 
                transition={{ duration: 2.5, ease: "easeOut" }}
                className="h-[2px] bg-blue-600 absolute left-0 shadow-[0_0_20px_rgba(37,99,235,0.4)]" 
              />
              <MapPin className="text-blue-600 absolute left-0 -translate-x-1/2 bg-white p-1 rounded-full shadow-md" size={32} />
              <Package className="text-white absolute right-0 translate-x-1/2 bg-blue-600 p-3 rounded-2xl shadow-xl shadow-blue-100" size={48} />
            </div>

            <div className="flex items-center gap-3 text-[10px] font-mono text-slate-300 uppercase tracking-[0.3em] border-t border-slate-50 pt-8">
              <Globe size={14} className="text-blue-500" />
              TRANSVERA NETWORK: SECURE
            </div>
          </div>

          {/* 2. TELEMETRY */}
          <div className="md:col-span-4 bg-slate-950 rounded-[3rem] p-8 overflow-hidden flex flex-col shadow-2xl h-[420px] relative">
             <div className="flex items-center justify-between mb-8 border-b border-slate-800/50 pb-4">
               <div className="flex items-center gap-3 text-blue-500">
                 <Terminal size={14} />
                 <span className="text-[10px] font-bold uppercase tracking-widest">System Telemetry</span>
               </div>
               <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
             </div>
             
             <div className="space-y-5 overflow-y-auto pr-2 scrollbar-hide flex-1">
               <AnimatePresence>
                 {(logs.length > 0 ? logs : [
                    { id: 'f1', created_at: new Date(), sensor_payload: { msg: 'Establishing Handshake...' } },
                    { id: 'f2', created_at: new Date(), sensor_payload: { msg: 'Scanning Node Integrity' } },
                    { id: 'f3', created_at: new Date(), sensor_payload: { msg: 'Data Path Encrypted' } }
                 ]).map((log, index) => (
                   <motion.div 
                    initial={{ opacity: 0, x: 5 }} animate={{ opacity: 1, x: 0 }} 
                    key={log.id} 
                    className={`text-[11px] font-mono border-l pl-5 py-1 ${index === 0 ? 'border-blue-500 text-slate-100' : 'border-slate-800 text-slate-600'}`}
                   >
                     <div className="flex justify-between mb-1 opacity-40 uppercase text-[8px] tracking-widest">
                       <span>{new Date(log.created_at).toLocaleTimeString()}</span>
                     </div>
                     <div className="leading-relaxed font-bold uppercase tracking-tight">
                       {typeof log.sensor_payload === 'string' 
                         ? (() => { try { return JSON.parse(log.sensor_payload).msg } catch { return log.sensor_payload } })() 
                         : log.sensor_payload?.msg || 'Signal Verified'}
                     </div>
                   </motion.div>
                 ))}
               </AnimatePresence>
             </div>
          </div>

          {/* 3. IMAGES & MANIFEST */}
          <div className="md:col-span-12 grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-[3rem] border border-slate-100 p-10 shadow-sm space-y-8">
              <div className="flex items-center gap-3 text-slate-400">
                <Box size={20} />
                <span className="text-[10px] font-black uppercase tracking-widest">Manifest Details</span>
              </div>
              <div className="space-y-6">
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">High-Value Product</p>
                  <p className="text-2xl font-black tracking-tight text-slate-900">Lamborghini Aventador S Roadster</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Transit Note</p>
                  <p className="text-sm text-slate-500 italic border-l-2 border-blue-100 pl-4">
                    &quot;Consignment contains 1 Lamborghini Aventador S Roadster (Value: $247,000) and Rolex Luxury Timepieces (Value: $75,000 each). Total Consignment Value: $397,000.&quot;
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-slate-50 rounded-[3rem] p-8 border border-slate-100">
               <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-6">Verification Visuals</p>
               <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                 {gallery.map((img, i) => (
                   <div key={i} className="aspect-square rounded-[2rem] overflow-hidden border-[10px] border-white shadow-2xl bg-white">
                      <img src={img} alt="Cargo" className="w-full h-full object-cover" />
                   </div>
                 ))}
               </div>
            </div>
          </div>

          {/* 4. ITEM LEDGER */}
          <div className="md:col-span-12 bg-white rounded-[3rem] border border-slate-100 p-10 shadow-sm">
            <div className="flex items-center gap-3 text-slate-400 mb-8">
              <Info size={18} />
              <span className="text-[10px] font-black uppercase tracking-widest">Itemized Audit</span>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {items.map((item, i) => (
                <div key={i} className="flex items-center justify-between p-5 bg-slate-50 rounded-2xl border border-slate-100 hover:border-blue-100 transition-all">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-xs font-black text-white">
                      {item.quantity}
                    </div>
                    <div>
                      <p className="text-[11px] font-black text-slate-900 uppercase leading-tight">{item.name}</p>
                      <p className="text-[10px] font-mono text-slate-400 mt-1">${Number(item.value_usd).toLocaleString()}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}