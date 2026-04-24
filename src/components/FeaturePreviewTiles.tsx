"use client";
import React, { useState } from "react";
import dynamic from "next/dynamic";

type Props = {
  activeTab: string;
  setActiveTab: (tab: string) => void;
};

const QuantumPreview = dynamic(() => import("@/components/QuantumEncryptionFlow"), { ssr: false });
const CompliancePreview = dynamic(() => import("@/components/GlobalComplianceGrid"), { ssr: false });
const TimelinePreview = dynamic(() => import("@/components/ScrollTimeline"), { ssr: false });

export default function FeaturePreviewTiles({ activeTab, setActiveTab }: Props) {
  const tiles = [
    { key: "Heritage", title: "Heritage", subtitle: "Timeline & Milestones", preview: "timeline" },
    { key: "Security", title: "Security", subtitle: "Encryption Visualizer", preview: "quantum" },
    { key: "Compliance", title: "Compliance", subtitle: "Audits & Standards", preview: "compliance" },
  ];

  const [hoverKey, setHoverKey] = useState<string | null>(null);
  const [loadedKeys, setLoadedKeys] = useState<Record<string, boolean>>({});

  const onEnter = (k: string) => {
    setHoverKey(k);
    setLoadedKeys((p) => ({ ...p, [k]: true }));
  };
  const onLeave = () => setHoverKey(null);

  return (
    <div className="flex gap-4 border-b border-slate-100 pb-4">
      <div className="flex flex-col gap-3">
        <div className="flex gap-3">
          {tiles.map((t) => (
            <div key={t.key} className="relative">
              <button
                onClick={() => setActiveTab(t.key)}
                onMouseEnter={() => onEnter(t.key)}
                onMouseLeave={onLeave}
                className={`px-6 py-4 text-[10px] font-black uppercase tracking-widest transition-all bg-white rounded-2xl ${
                  activeTab === t.key ? "text-[#064E3B] border-b-2 border-[#BEF264]" : "text-slate-400 border border-slate-100"
                }`}
              >
                <div className="text-xs font-black">{t.title}</div>
                <div className="text-[10px] text-slate-400">{t.subtitle}</div>
              </button>

              {hoverKey === t.key && (
                <div className="absolute -left-56 top-0 w-56 h-36 bg-white rounded-lg shadow-xl overflow-hidden z-50 p-2">
                  <div className="w-full h-full">
                    {loadedKeys[t.key] ? (
                      t.preview === "quantum" ? (
                        <div className="w-full h-full scale-[0.85] origin-top-left pointer-events-none overflow-hidden"><QuantumPreview /></div>
                      ) : t.preview === "compliance" ? (
                        <div className="w-full h-full scale-[0.9] origin-top-left pointer-events-none overflow-hidden"><CompliancePreview /></div>
                      ) : (
                        <div className="w-full h-full scale-[0.8] origin-top-left pointer-events-none overflow-hidden"><TimelinePreview /></div>
                      )
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-xs text-slate-400">Loading preview…</div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
