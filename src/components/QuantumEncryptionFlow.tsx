"use client";
import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Key, Lock } from "lucide-react";

const gates = [
  { id: 'G1', name: 'Input Gate', algo: 'AES-512 Block Chaining', explanation: 'AES-512 Block Chaining is a layered block cipher construction used here as a conceptual, quantum-resistant transport layer. Keys are wrapped inside an HSM-backed envelope and chained with integrity MACs, allowing post-quantum mixing before HSM unwrapping at the destination.' },
  { id: 'G2', name: 'Quantum Mixer', algo: 'Phase-Scramble ECC', explanation: 'Phase-scramble combines reversible mixing operations with classical forward-error-correction to preserve throughput while adding entropy that is hard to predict without the mixer state.' },
  { id: 'G3', name: 'Output Gate', algo: 'HSM Wrap + MAC', explanation: 'Final key-wrapping and MAC verification takes place inside a certified HSM. The resulting packet is authenticated and marked with an immutable ledger entry before release.' }
];

export default function QuantumEncryptionFlow() {
  const [openGate, setOpenGate] = useState<string | null>(null);

  return (
    <div className="bg-gradient-to-b from-[#061617] to-[#081018] p-6 rounded-2xl relative overflow-hidden border border-white/5">
      <div className="flex items-center justify-between mb-6">
        <h4 className="text-sm font-black text-[#BEF264]">Vault-Grade Encryption Visualizer</h4>
        <div className="text-xs text-slate-400">Quantum-Hybrid Transport — Live</div>
      </div>

      <div className="flex gap-6 items-stretch">
        {gates.map((g, idx) => (
          <div key={g.id} className="flex-1 flex flex-col items-center">
            <div onClick={() => setOpenGate(g.id)} className="cursor-pointer w-full h-64 bg-[#071014] rounded-xl border border-white/3 p-4 relative">
              <div className="absolute left-1/2 -translate-x-1/2 top-6 bottom-6 w-2 bg-gradient-to-b from-[#0b3a2d] to-[#052a1f] rounded" />

              <div className="absolute left-1/2 -translate-x-1/2 top-20 w-24 h-8 bg-[#062b21] rounded-md text-xs flex items-center justify-center text-white/80 border">ENCRYPTION GATE</div>

              {[0,1,2].map(k => (
                <motion.div key={k}
                  initial={{ y: -40 }}
                  animate={{ y: 360 }}
                  transition={{ repeat: Infinity, duration: 2.4 + k * 0.6, delay: k * 0.3, ease: 'linear' }}
                  className="absolute left-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-[#BEF264] flex items-center justify-center text-[#064E3B] shadow-md"
                  style={{ top: -40 - k * 18 }}
                >
                  <Key size={14} />
                </motion.div>
              ))}

              <div className="absolute bottom-4 left-4 text-xs text-slate-400">Packets/sec: {Math.floor(1200 + Math.random()*800)}</div>
              <div className="absolute bottom-4 right-4 text-xs text-slate-400">Latency: {Math.floor(8 + Math.random()*10)} ms</div>
            </div>

            <div className="mt-4 text-sm font-black text-slate-200">{g.name}</div>
            <div className="text-xs text-slate-400 mt-1">{g.algo}</div>
          </div>
        ))}
      </div>

      <AnimatePresence>
        {openGate && (
          <motion.div className="fixed inset-0 z-60 flex items-center justify-center p-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="absolute inset-0 bg-black/50" onClick={() => setOpenGate(null)} />
            <motion.div className="bg-white rounded-2xl p-6 z-70 max-w-2xl" initial={{ y: 20 }} animate={{ y: 0 }} exit={{ y: 20 }}>
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h4 className="font-black text-lg">{gates.find(x => x.id === openGate)?.name}</h4>
                  <div className="text-xs text-slate-500">{gates.find(x => x.id === openGate)?.algo}</div>
                </div>
                <button onClick={() => setOpenGate(null)} className="px-3 py-1 rounded bg-slate-100">Close</button>
              </div>

              <div className="text-sm text-slate-700 leading-relaxed">
                {gates.find(x => x.id === openGate)?.explanation}
              </div>

              <div className="mt-4 text-xs text-slate-500">
                <strong>Technical note:</strong> keys are HSM-wrapped, chained, and ledger-anchored for tamper-evident proof. AES-512 here represents a conceptual extended-block mode used with post-quantum mixing layers.
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
