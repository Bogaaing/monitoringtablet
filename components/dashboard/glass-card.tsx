import React from "react";

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  glowColor?: "indigo" | "emerald" | "amber" | "rose" | "violet" | "sky";
}

export function GlassCard({
  children,
  className = "",
  glowColor = "indigo",
}: GlassCardProps) {
  const glowStyles = {
    indigo: "hover:border-indigo-500/40 hover:shadow-indigo-500/10",
    emerald: "hover:border-emerald-500/40 hover:shadow-emerald-500/10",
    amber: "hover:border-amber-500/40 hover:shadow-amber-500/10",
    rose: "hover:border-rose-500/40 hover:shadow-rose-500/10",
    violet: "hover:border-violet-500/40 hover:shadow-violet-500/10",
    sky: "hover:border-sky-500/40 hover:shadow-sky-500/10",
  };

  return (
    <div
      className={`bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800/80 rounded-3xl shadow-xl transition-all duration-300 hover:-translate-y-1 ${glowStyles[glowColor]} ${className}`}
    >
      {children}
    </div>
  );
}
