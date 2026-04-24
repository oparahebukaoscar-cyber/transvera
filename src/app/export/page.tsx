"use client";
import React, { useEffect } from 'react';
import Link from 'next/link';
import { useSooner } from '@/components/notifications/Sooner';

export default function ExportPage() {
  const { show } = useSooner();
  useEffect(() => { show('Export feature coming soon.'); }, [show]);

  return (
    <main className="min-h-screen bg-[#F8FAFB] pt-32 px-8">
      <div className="max-w-[900px] mx-auto">
        <h1 className="text-4xl font-black mb-4">Export</h1>
        <p className="text-slate-600 mb-6">Export pipelines are being prepared. This is a placeholder page.</p>
        <div className="flex gap-3">
          <button onClick={() => show('Export coming soon.')} className="px-6 py-3 bg-[#064E3B] text-[#BEF264] rounded-lg">Start Export</button>
          <Link href="/" className="px-6 py-3 bg-white border border-slate-100 rounded-lg">Return Home</Link>
        </div>
      </div>
    </main>
  );
}
