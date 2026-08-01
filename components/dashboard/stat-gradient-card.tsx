import React from "react";
import { LucideIcon } from "lucide-react";

interface StatGradientCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon: LucideIcon;
  gradient: "indigo" | "emerald" | "amber" | "rose" | "violet" | "sky";
  badgeText?: string;
}

export function StatGradientCard({
  title,
  value,
  description,
  icon: Icon,
  gradient,
  badgeText,
}: StatGradientCardProps) {
  const gradientStyles = {
    indigo: {
      bg: "from-indigo-600 to-violet-600",
      iconBg: "bg-indigo-500/20 text-indigo-200 border-indigo-400/30",
      glow: "shadow-indigo-500/20",
    },
    emerald: {
      bg: "from-emerald-600 to-teal-600",
      iconBg: "bg-emerald-500/20 text-emerald-200 border-emerald-400/30",
      glow: "shadow-emerald-500/20",
    },
    amber: {
      bg: "from-amber-500 to-orange-600",
      iconBg: "bg-amber-500/20 text-amber-100 border-amber-400/30",
      glow: "shadow-amber-500/20",
    },
    rose: {
      bg: "from-rose-600 to-pink-600",
      iconBg: "bg-rose-500/20 text-rose-200 border-rose-400/30",
      glow: "shadow-rose-500/20",
    },
    violet: {
      bg: "from-purple-600 to-indigo-600",
      iconBg: "bg-purple-500/20 text-purple-200 border-purple-400/30",
      glow: "shadow-purple-500/20",
    },
    sky: {
      bg: "from-sky-600 to-indigo-600",
      iconBg: "bg-sky-500/20 text-sky-200 border-sky-400/30",
      glow: "shadow-sky-500/20",
    },
  };

  const current = gradientStyles[gradient];

  return (
    <div
      className={`relative overflow-hidden rounded-3xl p-6 bg-gradient-to-br ${current.bg} text-white shadow-xl ${current.glow} transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl group`}
    >
      {/* Subtle Background Glow Circle */}
      <div className="absolute -right-6 -bottom-6 w-24 h-24 rounded-full bg-white/10 blur-xl group-hover:scale-150 transition-transform duration-500 pointer-events-none" />

      <div className="flex items-center justify-between relative z-10">
        <span className="text-xs font-semibold uppercase tracking-wider text-white/80">
          {title}
        </span>
        <div className={`p-2.5 rounded-2xl border ${current.iconBg} shadow-sm backdrop-blur-md`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>

      <div className="mt-4 flex items-baseline justify-between relative z-10">
        <h3 className="text-3xl font-extrabold tracking-tight text-white">
          {value}
        </h3>
        {badgeText && (
          <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-white/20 backdrop-blur-md text-white border border-white/30">
            {badgeText}
          </span>
        )}
      </div>

      {description && (
        <p className="mt-2 text-xs text-white/70 relative z-10 truncate">
          {description}
        </p>
      )}
    </div>
  );
}
