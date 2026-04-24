"use client";
import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

type Props = { open: boolean; onClose: () => void };

export default function RouteSimulationModal({ open, onClose }: Props) {
  const [steps, setSteps] = useState<number>(0);
  const [results, setResults] = useState<Array<{cost:number,co2:number}>>([]);

  useEffect(() => {
    if (!open) return;
    setSteps(0);
    setResults([]);
    const interval = setInterval(() => {
      setSteps(s => {
        const next = s + 1;
        setResults(r => [...r, { cost: Math.round(2000 + Math.random()*2000), co2: Math.round(100 + Math.random()*400) }]);
        if (next >= 5) {
          clearInterval(interval);
        }
        return next;
      });
    }, 600);
    return () => clearInterval(interval);
  }, [open]);

  const best = results.reduce((acc, cur) => (cur.cost + cur.co2 < acc.cost + acc.co2 ? cur : acc), results[0] || {cost:99999,co2:99999});

  return (
    <AnimatePresence>
      {open && (
        <motion.div className="fixed inset-0 z-70 flex items-center justify-center p-6">
          <motion.div className="absolute inset-0 bg-black/50" onClick={onClose} />
          <motion.div className="bg-white rounded-2xl p-6 z-80 w-full max-w-2xl" initial={{ scale: 0.95, opacity:0 }} animate={{ scale:1, opacity:1 }} exit={{ scale:0.95, opacity:0 }}>
            <div className="flex justify-between items-center mb-4">
              <h4 className="font-black">Route Simulation</h4>
              <button onClick={onClose} className="px-3 py-1 rounded bg-slate-100">Close</button>
            </div>

            <div className="space-y-3">
              <div className="text-xs text-slate-500">Evaluations</div>
              <div className="grid grid-cols-5 gap-2">
                {Array.from({length:5}).map((_,i)=> (
                  <div key={i} className={`p-3 rounded border ${i < results.length ? 'bg-[#EFFFEE]' : 'bg-slate-50'}`}>
                    <div className="text-sm font-black">Run {i+1}</div>
                    <div className="text-xs text-slate-400">{results[i] ? `Cost ${results[i].cost}` : '—'}</div>
                    <div className="text-xs text-slate-400">{results[i] ? `CO₂ ${results[i].co2}` : '—'}</div>
                  </div>
                ))}
              </div>
              <div className="pt-4 border-t flex items-center justify-between">
                <div>
                  <div className="text-xs text-slate-500">Selected</div>
                  <div className="font-black text-[#064E3B]">Cost {best.cost} — CO₂ {best.co2}</div>
                </div>
                <button onClick={onClose} className="px-4 py-2 rounded bg-[#064E3B] text-white">Apply Route</button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
