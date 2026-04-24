"use client";
import React from 'react';
import { useSooner } from '@/components/notifications/Sooner';

export default function GenerateIdPage() {
  const { show } = useSooner();

  return (
    <main className="min-h-screen bg-[#F8FAFB] pt-32 px-8">
      <div className="max-w-[800px] mx-auto">
        <h1 className="text-4xl font-black mb-4">Generate Tracking ID</h1>
        <p className="text-slate-600 mb-6">Tool to generate standardized tracking identifiers. Placeholder for now.</p>
        <div className="flex gap-3">
          <button onClick={() => show('ID generator is coming soon.')} className="px-6 py-3 bg-[#064E3B] text-[#BEF264] rounded-lg">Generate ID</button>
          {/* Admin link removed from public UI */}
        </div>
      </div>
    </main>
  );
}
