"use client";
import Link from "next/link";
import { Activity, Globe2, Truck, Zap } from "lucide-react";
import React from "react";

type MarqueeItem = {
  text: string;
  href?: string;
  icon?: React.ReactNode;
  // pill background: 'green' | 'white' (used to alternate visuals)
  bg?: "green" | "white";
};

export default function Marquee({ items }: { items?: MarqueeItem[] }) {
  const defaultItems: MarqueeItem[] = [
    { text: "Live Vessels: 1,204", icon: <Activity size={14} className="inline-block mr-2 text-[#064E3B]" />, bg: "green" },
    { text: "Terminal Status: Green", icon: <Globe2 size={14} className="inline-block mr-2 text-[#064E3B]" />, bg: "white" },
    { text: "New Route: Singapore → Rotterdam", icon: <Truck size={14} className="inline-block mr-2 text-[#064E3B]" />, bg: "green" },
    { text: "System Uptime: 99.99%", icon: <Zap size={14} className="inline-block mr-2 text-[#064E3B]" />, bg: "white" },
  ];

  const list = items && items.length ? items : defaultItems;

  return (
    <div className="ticker-wrap mt-20 z-40 border-b border-slate-100 bg-white/70">
      <div className="marquee-animate">
        <div className="marquee px-6 py-2 text-sm text-neutral-700 font-semibold flex gap-6">
          {list.map((it, i) => {
            const pillBg = it.bg === "green" ? "bg-[#BEF264]/20 text-[#064E3B]" : "bg-white text-[#064E3B]";
            return (
              <span key={i} className={`flex items-center whitespace-nowrap px-3 py-1 rounded-full ${pillBg} border border-white/30` }>
                {it.icon}
                {it.href ? (
                  <Link href={it.href} className="flex items-center gap-2">
                    <span>{it.text}</span>
                    <span className="ml-2 inline-block w-2 h-2 bg-[#064E3B] rounded-full animate-pulse" />
                  </Link>
                ) : (
                  <span>{it.text}</span>
                )}
              </span>
            );
          })}

          {/* duplicate for seamless animation */}
          {list.map((it, i) => {
            const pillBg = it.bg === "green" ? "bg-[#BEF264]/20 text-[#064E3B]" : "bg-white text-[#064E3B]";
            return (
              <span key={`dup-${i}`} className={`flex items-center whitespace-nowrap px-3 py-1 rounded-full ${pillBg} border border-white/30` }>
                {it.icon}
                {it.href ? (
                  <Link href={it.href} className="flex items-center gap-2">
                    <span>{it.text}</span>
                    <span className="ml-2 inline-block w-2 h-2 bg-[#064E3B] rounded-full animate-pulse" />
                  </Link>
                ) : (
                  <span>{it.text}</span>
                )}
              </span>
            );
          })}
        </div>
      </div>
    </div>
  );
}
