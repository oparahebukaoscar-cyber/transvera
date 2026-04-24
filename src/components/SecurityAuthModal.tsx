"use client";
import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

type Props = { open: boolean; onClose: ()=>void; onAuthorize: ()=>void };

export default function SecurityAuthModal({ open, onClose, onAuthorize }: Props){
  const [stage, setStage] = useState<'dial'|'bio'|'done'>('dial');
  const [angle, setAngle] = useState(0);
  const [target, setTarget] = useState(0);

  useEffect(()=>{
    if(open){ setStage('dial'); setAngle(0); setTarget(Math.floor((Math.random()*300)-150)); }
  },[open]);

  useEffect(()=>{
    if(stage==='bio'){
      const id = setTimeout(()=>{ setStage('done'); onAuthorize(); }, 2200);
      return ()=>clearTimeout(id);
    }
  },[stage, onAuthorize]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div className="fixed inset-0 z-80 flex items-center justify-center p-6" initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}>
          <motion.div className="absolute inset-0 bg-black/40" onClick={onClose} />
          <motion.div className="bg-white rounded-2xl p-6 z-90 w-full max-w-md" initial={{ y:20 }} animate={{ y:0 }} exit={{ y:20 }}>
            <h4 className="font-black mb-3">Emergency Override — Security Protocol</h4>
            {stage === 'dial' && (
              <div className="flex flex-col items-center gap-4">
                <div className="text-xs text-slate-400">Rotate dial to match passcode</div>
                <div className="w-48 h-48 rounded-full border flex items-center justify-center relative">
                  <motion.div drag="x" dragConstraints={{ left: -80, right: 80 }} onDrag={(e,info)=>{ setAngle(Math.round(info.point.x*1.5)); }} className="w-6 h-24 bg-[#064E3B] rounded-md origin-bottom" style={{ transform: `rotate(${angle}deg)` }} />
                  <div className="absolute bottom-3 text-xs">Target: {target}°</div>
                </div>
                <div>
                  <button onClick={()=>{ if(Math.abs(angle - target) < 12){ setStage('bio'); } }} className="px-4 py-2 rounded bg-[#064E3B] text-white">Lock</button>
                </div>
              </div>
            )}

            {stage === 'bio' && (
              <div className="flex flex-col items-center gap-4">
                <div className="text-xs text-slate-400">Biometric Scan — place finger</div>
                <div className="w-36 h-24 bg-slate-100 rounded-xl overflow-hidden relative">
                  <motion.div initial={{ x: '-100%' }} animate={{ x: '120%' }} transition={{ duration: 1.2 }} className="absolute inset-0 bg-gradient-to-r from-transparent via-[#BEF264] to-transparent opacity-60" />
                </div>
              </div>
            )}

            {stage === 'done' && (
              <div className="text-center">
                <div className="text-lg font-black text-[#064E3B] mb-2">Authorized</div>
                <div className="text-xs text-slate-500">Applying emergency protocols...</div>
              </div>
            )}

            <div className="mt-4 flex justify-end gap-3">
              <button onClick={onClose} className="px-4 py-2 rounded bg-slate-100">Close</button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
