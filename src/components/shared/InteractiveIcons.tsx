"use client";
import Link from "next/link";
import { ArrowUpRight, MapPin, Box } from "lucide-react";

export default function InteractiveIcons() {
  return (
    <div className="hidden sm:flex flex-col gap-3 fixed right-6 bottom-8 z-60">
      <Link href="/ship" className="group">
        <div className="w-12 h-12 bg-white rounded-full shadow-lg flex items-center justify-center hover:scale-105 transition">
          <ArrowUpRight className="text-[#064E3B] group-hover:text-accent" />
        </div>
      </Link>
      <Link href="/track" className="group">
        <div className="w-12 h-12 bg-white rounded-full shadow-lg flex items-center justify-center hover:scale-105 transition">
          <MapPin className="text-[#064E3B] group-hover:text-accent" />
        </div>
      </Link>
      <Link href="/resources" className="group">
        <div className="w-12 h-12 bg-white rounded-full shadow-lg flex items-center justify-center hover:scale-105 transition">
          <Box className="text-[#064E3B] group-hover:text-accent" />
        </div>
      </Link>
    </div>
  );
}
