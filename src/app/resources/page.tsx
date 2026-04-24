import Link from 'next/link';

export default function ResourcesPage() {
  return (
    <main className="min-h-screen bg-[#F8FAFB] pt-32 px-8">
      <div className="max-w-[1000px] mx-auto">
        <h1 className="text-4xl font-black mb-4">Resources</h1>
        <p className="text-slate-600 mb-6">Documentation, APIs, and guides will be published here.</p>
        <div className="flex gap-3">
          <Link href="/" className="px-6 py-3 bg-white border border-slate-100 rounded-lg">Return Home</Link>
        </div>
      </div>
    </main>
  );
}
