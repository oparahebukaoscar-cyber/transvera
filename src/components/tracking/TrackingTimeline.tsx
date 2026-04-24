"use client";
import { motion } from "framer-motion";
import { Check, Package, Truck, Home } from "lucide-react";

const steps = [
  { status: "Package Received", date: "Oct 24, 10:00 AM", icon: Package, done: true },
  { status: "In Transit", date: "Oct 25, 02:30 PM", icon: Truck, done: true },
  { status: "Out for Delivery", date: "Oct 26, 08:00 AM", icon: Home, done: false },
];

export default function TrackingTimeline() {
  return (
    <div className="space-y-8 relative">
      {/* The Connecting Line */}
      <div className="absolute left-6 top-2 bottom-2 w-0.5 bg-neutral-200" />
      
      {steps.map((step, index) => (
        <motion.div 
          key={index}
          initial={{ opacity: 0, x: -20 }}
          whileInView={{ opacity: 1, x: 0 }}
          transition={{ delay: index * 0.2 }}
          className="flex items-start gap-6 relative z-10"
        >
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm ${
            step.done ? "bg-accent text-white" : "bg-white text-neutral-400 border border-neutral-100"
          }`}>
            {step.done ? <Check size={20} /> : <step.icon size={20} />}
          </div>
          <div>
            <h4 className="font-bold text-lg leading-none">{step.status}</h4>
            <p className="text-sm text-neutral-400 mt-2 font-medium">{step.date}</p>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
