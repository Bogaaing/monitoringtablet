import React from "react";
import { LucideIcon } from "lucide-react";

interface StatGradientCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon: LucideIcon;
  gradient?: "indigo" | "emerald" | "amber" | "rose" | "violet" | "sky";
  badgeText?: string;
}

export function StatGradientCard({
  title,
  value,
  description,
  icon: Icon,
  gradient = "indigo",
  badgeText,
}: StatGradientCardProps) {
  const solidStyles = {
    indigo: {
      border: "border-indigo-200 dark:border-indigo-900/60",
      iconBg: "bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400",
      badge: "bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800",
      value: "text-indigo-600 dark:text-indigo-400",
    },
    emerald: {
      border: "border-emerald-200 dark:border-emerald-900/60",
      iconBg: "bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400",
      badge: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800",
      value: "text-emerald-600 dark:text-emerald-400",
    },
    amber: {
      border: "border-amber-200 dark:border-amber-900/60",
      iconBg: "bg-amber-50 text-amber-600 dark:bg-amber-950 dark:text-amber-400",
      badge: "bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300 border-amber-200 dark:border-amber-800",
      value: "text-amber-600 dark:text-amber-400",
    },
    rose: {
      border: "border-rose-200 dark:border-rose-900/60",
      iconBg: "bg-rose-50 text-rose-600 dark:bg-rose-950 dark:text-rose-400",
      badge: "bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-300 border-rose-200 dark:border-rose-800",
      value: "text-rose-600 dark:text-rose-400",
    },
    violet: {
      border: "border-violet-200 dark:border-violet-900/60",
      iconBg: "bg-violet-50 text-violet-600 dark:bg-violet-950 dark:text-violet-400",
      badge: "bg-violet-50 text-violet-700 dark:bg-violet-950 dark:text-violet-300 border-violet-200 dark:border-violet-800",
      value: "text-violet-600 dark:text-violet-400",
    },
    sky: {
      border: "border-sky-200 dark:border-sky-900/60",
      iconBg: "bg-sky-50 text-sky-600 dark:bg-sky-950 dark:text-sky-400",
      badge: "bg-sky-50 text-sky-700 dark:bg-sky-950 dark:text-sky-300 border-sky-200 dark:border-sky-800",
      value: "text-sky-600 dark:text-sky-400",
    },
  };

  const current = solidStyles[gradient] || solidStyles.indigo;

  return (
    <div
      className={`relative overflow-hidden rounded-3xl p-6 bg-white dark:bg-slate-900 border ${current.border} shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md`}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          {title}
        </span>
        <div className={`p-2.5 rounded-2xl ${current.iconBg}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>

      <div className="mt-4 flex items-baseline justify-between">
        <h3 className={`text-3xl font-black tracking-tight ${current.value}`}>
          {value}
        </h3>
        {badgeText && (
          <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${current.badge}`}>
            {badgeText}
          </span>
        )}
      </div>

      {description && (
        <p className="mt-2 text-xs text-slate-500 dark:text-slate-400 truncate">
          {description}
        </p>
      )}
    </div>
  );
}
