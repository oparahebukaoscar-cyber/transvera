"use client";
import React from 'react';
import Link from 'next/link';
import { useSooner } from '@/components/notifications/Sooner';

export default function GenerateTrackingPage() {
  const { show } = useSooner();

  return (
    <main className="min-h-screen bg-[#F8FAFB] pt-32 px-8">
      <div className="max-w-[1000px] mx-auto">
        <h1 className="text-4xl font-black mb-4">Generate Route Quote</h1>
        <p className="text-slate-600 mb-6">This page will provide advanced quoting and route generation tools. For now it's a placeholder.</p>

        <div className="flex gap-3">
          <button onClick={() => show('Route quote generation coming soon.')} className="px-6 py-3 bg-[#064E3B] text-[#BEF264] rounded-lg">Request Quote</button>
          <Link href="/" className="px-6 py-3 bg-white border border-slate-100 rounded-lg">Return Home</Link>
        </div>
      </div>
    </main>
  );
}
