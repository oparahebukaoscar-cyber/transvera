"use client";
import React, { useRef } from "react";
import { motion, useScroll, useTransform, MotionValue } from "framer-motion";

const events = [
  { year: 1992, title: 'The Blueprint', img: 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&q=80&w=1600', desc: 'Founded as a private maritime logistics firm focusing on resilient corridors.' },
  { year: 2004, title: 'Aero-Expansion', img: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&q=80&w=1600', desc: 'Expanded into high-velocity air freight and integrated early telemetry.' },
  { year: 2018, title: 'Digital Hardening', img: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&q=80&w=1600', desc: 'Moved manifests onto an immutable ledger and enhanced auditability.' },
  { year: 2026, title: 'Quantum Integration', img: 'https://images.unsplash.com/photo-1526778548025-fa2f459cd5c1?auto=format&fit=crop&q=80&w=1600', desc: 'Deploying post-quantum safe channels and HSM-backed keying across nodes.' }
];

function EventSection({
  e,
  index,
  length,
  scrollYProgress,
}: {
  e: (typeof events)[number];
  index: number;
  length: number;
  scrollYProgress: MotionValue<number>;
}) {
  const start = index / length;
  const end = (index + 1) / length;
  const progress = useTransform(scrollYProgress, [start, end], [0, 1]);
  const scale = useTransform(progress, [0, 1], [1, 1.12]);

  return (
    <section className="relative h-screen flex items-center justify-center overflow-hidden">
      <motion.img src={e.img} alt={`${e.year}`} className="absolute inset-0 w-full h-full object-cover" style={{ scale }} />
      <div className="relative z-10 max-w-3xl p-8 bg-white/40 backdrop-blur-sm rounded-lg">
        <div className="text-xs font-black text-[#064E3B] mb-2">{e.year}</div>
        <h2 className="text-4xl font-black mb-4">{e.title}</h2>
        <p className="text-sm text-slate-700 max-w-2xl leading-relaxed">{e.desc}</p>
      </div>
    </section>
  );
}

export default function ScrollTimeline() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const { scrollYProgress } = useScroll({ target: containerRef });

  return (
    <div ref={containerRef} className="w-full">
      {events.map((e, i) => (
        <EventSection key={e.year} e={e} index={i} length={events.length} scrollYProgress={scrollYProgress} />
      ))}
    </div>
  );
}
