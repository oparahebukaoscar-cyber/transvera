"use client";
import React from "react";
import { motion, AnimatePresence } from "framer-motion";

type Props = {
  open: boolean;
  onClose: () => void;
  onCommit?: (signature: string) => void;
};

const makeRows = () => {
  return new Array(15).fill(0).map((_, i) => ({
    id: i + 1,
    hs: `HS-${1000 + i}`,
    seal: Math.random().toString(36).slice(2, 10).toUpperCase(),
    un: `UN ${3000 + i}`,
    qty: Math.floor(Math.random() * 200) + 1,
    weight: `${Math.floor(Math.random() * 1200) + 10} kg`
  }));
};

export default function ManifestDrawer({ open, onClose, onCommit }: Props) {
  const rows = React.useMemo(makeRows, []);
  const [signature, setSignature] = React.useState("");

  return (
    <AnimatePresence>
      {open && (
        <motion.aside className="fixed inset-0 z-60 flex items-end">
          <motion.div className="absolute inset-0 bg-black/40" onClick={onClose} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} />
          <motion.div className="w-full md:w-3/5 bg-white rounded-t-2xl p-6 shadow-2xl mx-auto" initial={{ y: '40%' }} animate={{ y: 0 }} exit={{ y: '40%' }}>
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-lg font-black">Asset Manifest — Review</h4>
              <button onClick={onClose} className="text-sm px-3 py-1 rounded bg-slate-100">Close</button>
            </div>

            <div className="overflow-x-auto max-h-72">
              <table className="w-full text-sm text-left border-collapse">
                <thead>
                  <tr className="text-xs text-slate-500">
                    <th className="p-2">#</th>
                    <th className="p-2">HS Code</th>
                    <th className="p-2">Seal Hash</th>
                    <th className="p-2">UN Class</th>
                    <th className="p-2">Qty</th>
                    <th className="p-2">Weight</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map(r => (
                    <tr key={r.id} className="border-t">
                      <td className="p-2 font-black">{r.id}</td>
                      <td className="p-2">{r.hs}</td>
                      <td className="p-2 font-mono text-xs">{r.seal}</td>
                      <td className="p-2">{r.un}</td>
                      <td className="p-2">{r.qty}</td>
                      <td className="p-2">{r.weight}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-4 flex items-center gap-3">
              <input value={signature} onChange={(e) => setSignature(e.target.value)} placeholder="Digital signature" className="flex-1 p-2 border rounded" />
              <button onClick={() => { onCommit?.(signature); onClose(); }} className="px-4 py-2 rounded bg-[#064E3B] text-white font-black">Commit</button>
            </div>
          </motion.div>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}
