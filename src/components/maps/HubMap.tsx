"use client";
import React from "react";
import { motion } from "framer-motion";

type Props = { selectedHub: string };

const cities = [
  { id: "Singapore", x: 480, y: 260, label: "Singapore" },
  { id: "Rotterdam", x: 120, y: 80, label: "Rotterdam" },
  { id: "Dubai", x: 370, y: 150, label: "Dubai" },
  { id: "NewYork", x: 40, y: 220, label: "New York" },
  { id: "Tokyo", x: 560, y: 120, label: "Tokyo" },
];

export default function HubMap({ selectedHub }: Props) {
  const selected = cities.find((c) => c.id === selectedHub) || cities[0];

  return (
    <div className="w-full h-full rounded-2xl overflow-hidden relative">
      <div style={{ perspective: 900 }} className="w-full h-full">
        <div style={{ transform: "rotateX(12deg)" }} className="w-full h-full">
          <svg viewBox="0 0 620 320" className="w-full h-full" preserveAspectRatio="xMidYMid slice">
            <defs>
              <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
                <feDropShadow dx="0" dy="6" stdDeviation="12" floodColor="#0f766e" floodOpacity="0.08" />
              </filter>
            </defs>

            {/* lines from selected to others */}
            {cities
              .filter((c) => c.id !== selected.id)
              .map((c, i) => (
                <motion.path
                  key={c.id}
                  d={`M ${selected.x} ${selected.y} L ${c.x} ${c.y}`}
                  stroke="#BEF264"
                  strokeWidth={2}
                  fill="none"
                  strokeLinecap="round"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 0.9, delay: 0.08 * i }}
                  style={{ filter: "url(#shadow)" }}
                />
              ))}

            {/* city nodes */}
            {cities.map((c) => (
              <g key={c.id} transform={`translate(${c.x}, ${c.y})`} className="cursor-pointer">
                <circle r={12} fill={c.id === selected.id ? "#064E3B" : "#ffffff"} stroke="#064E3B" strokeWidth={2} />
                <circle r={6} fill={c.id === selected.id ? "#BEF264" : "#064E3B"} />
                <text x={18} y={6} fontSize={12} fill="#0f172a" fontWeight={700} className="uppercase">
                  {c.label}
                </text>
              </g>
            ))}
          </svg>
        </div>
      </div>
    </div>
  );
}
