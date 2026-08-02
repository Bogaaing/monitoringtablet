import React from "react";
import { LucideIcon } from "lucide-react";

interface FeatureCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
}

export function FeatureCard({ icon: Icon, title, description }: FeatureCardProps) {
  return (
    <div className="flex flex-col items-center text-center group cursor-pointer">
      <div className="w-12 h-12 rounded-2xl bg-indigo-50/80 border border-indigo-100 text-indigo-600 flex items-center justify-center mb-2.5 group-hover:bg-indigo-600 group-hover:text-white transition-all duration-300 shadow-sm">
        <Icon className="w-6 h-6 stroke-current fill-none transition-colors" />
      </div>
      <h3 className="text-xs font-bold text-slate-900 mb-0.5">{title}</h3>
      <p className="text-[11px] text-slate-400 font-medium leading-tight">{description}</p>
    </div>
  );
}
