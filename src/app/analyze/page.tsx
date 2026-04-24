"use client";
import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSooner } from "@/components/notifications/Sooner";

function sparklinePath(values: number[], w = 120, h = 30) {
  if (!values || values.length === 0) return "";
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  return values
    .map((v, i) => {
      const x = (i / (values.length - 1 || 1)) * w;
      const y = h - ((v - min) / range) * h;
      return `${i === 0 ? "M" : "L"}${x.toFixed(2)},${y.toFixed(2)}`;
    })
    .join(" ");
}

function formatNumber(n: number) {
  return Intl.NumberFormat("en-US").format(Math.round(n));
}

export default function AnalyzePage() {
  const { show } = useSooner();
  const [range, setRange] = useState("24h");
  const [data, setData] = useState<number[]>([]);

  // Generate demo data
  useEffect(() => {
    function makeDemoPoints(points = 24, seed = Math.random()) {
      const out: number[] = [];
      let v = 5000 + seed * 4000;
      for (let i = 0; i < points; i++) {
        v += (Math.random() - 0.45) * 800;
        out.push(Math.max(0, Math.round(v)));
      }
      return out;
    }

    if (range === "24h") setData(makeDemoPoints(24));
    if (range === "7d") setData(makeDemoPoints(7));
    if (range === "30d") setData(makeDemoPoints(30));
  }, [range]);

  const total = useMemo(() => data.reduce((s, v) => s + v, 0), [data]);
  const avg = useMemo(() => (data.length ? total / data.length : 0), [total, data]);

  function runDemo() {
    show("Running demo analysis — generated sample metrics.");
    setData((d) => {
      const extra = Array.from({ length: 6 }).map(() => Math.round(2000 + Math.random() * 8000));
      return [...d.slice(-24), ...extra];
    });
  }

  function downloadCSV() {
    const rows = ["timestamp,value"];
    const now = Date.now();
    const step = Math.floor((60 * 60 * 1000 * 24) / Math.max(1, data.length));
    data.forEach((v, i) => rows.push(new Date(now - (data.length - i) * step).toISOString() + "," + v));
    const blob = new Blob([rows.join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "analyze-data.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <main className="min-h-screen bg-[#F8FAFB] pt-24 px-6 md:px-12">
      <div className="max-w-[1200px] mx-auto">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl md:text-4xl font-black">Analyze</h1>
            <p className="text-slate-600">Interactive analytics — demo data shown. Connect your DB to enable live metrics.</p>
          </div>
          <div className="flex items-center gap-3">
            <select className="px-3 py-2 rounded-md border" value={range} onChange={(e) => setRange(e.target.value)}>
              <option value="24h">Last 24 hours</option>
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
            </select>
            <button onClick={runDemo} className="px-4 py-2 bg-accent text-white rounded-md">Run Demo</button>
            <button onClick={downloadCSV} className="px-4 py-2 bg-white border rounded-md">Export CSV</button>
            <Link href="/" className="px-4 py-2 bg-white border rounded-md">Home</Link>
          </div>
        </div>

        <section className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white p-4 rounded-2xl shadow-soft">
            <div className="text-xs text-slate-400 uppercase font-black mb-2">Total Events</div>
            <div className="text-2xl font-extrabold">{formatNumber(total)}</div>
            <div className="text-sm text-slate-500">Sum over selected range</div>
          </div>
          <div className="bg-white p-4 rounded-2xl shadow-soft">
            <div className="text-xs text-slate-400 uppercase font-black mb-2">Avg / Interval</div>
            <div className="text-2xl font-extrabold">{formatNumber(avg)}</div>
            <div className="text-sm text-slate-500">Average per sample</div>
          </div>
          <div className="bg-white p-4 rounded-2xl shadow-soft flex flex-col justify-between">
            <div>
              <div className="text-xs text-slate-400 uppercase font-black mb-2">Realtime Throughput</div>
              <div className="flex items-center gap-3">
                <div className="w-28 h-10">
                  <svg width="120" height="30" viewBox="0 0 120 30" xmlns="http://www.w3.org/2000/svg">
                    <path d={sparklinePath(data.slice(-20), 120, 30)} fill="none" stroke="#064E3B" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <div className="text-2xl font-bold">{data.length ? formatNumber(data[data.length - 1]) : "—"}</div>
              </div>
            </div>
            <div className="text-sm text-slate-400 mt-3">Live sample simulated every time you run demo</div>
          </div>
        </section>

        <section className="bg-white p-4 rounded-2xl shadow-soft">
          <h3 className="font-bold mb-3">Event Timeline</h3>
          <div className="w-full overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="text-xs text-slate-500">
                  <th className="py-2 pr-4">Timestamp</th>
                  <th className="py-2">Value</th>
                </tr>
              </thead>
              <tbody>
                {data.slice().reverse().map((v, i) => (
                  <tr key={i} className="border-t">
                    <td className="py-2 text-sm text-slate-600">{new Date(Date.now() - i * 3600 * 1000).toLocaleString()}</td>
                    <td className="py-2 text-sm font-mono">{v}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </main>
  );
}
