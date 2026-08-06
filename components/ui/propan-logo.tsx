import React from "react";

interface PropanLogoProps {
  className?: string;
  height?: number | string;
  color?: string;
  showWordmark?: boolean;
}

export function PropanLogo({
  className = "h-9 w-auto",
  height,
  color = "#4F46E5",
  showWordmark = true,
}: PropanLogoProps) {
  const style = height
    ? { height: typeof height === "number" ? `${height}px` : height }
    : undefined;

  return (
    <div className={`inline-flex items-center gap-2 ${className}`} style={style}>
      <svg
        viewBox="0 0 512 512"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="h-full w-auto aspect-square shrink-0"
      >
        <defs>
          <linearGradient id="tabMonGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#4F46E5" />
            <stop offset="100%" stopColor="#6D5DFE" />
          </linearGradient>
        </defs>
        <rect width="512" height="512" rx="128" fill="url(#tabMonGrad)" />
        <g transform="translate(144, 136) scale(9.5)" stroke="#FFFFFF" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none">
          <rect x="4" y="2" width="16" height="20" rx="2" ry="2" />
          <line x1="12" y1="18" x2="12.01" y2="18" strokeWidth="2.5" />
        </g>
      </svg>
      {showWordmark && (
        <span className="font-extrabold tracking-tight leading-none text-base">
          <span className="text-slate-800">Tab</span>
          <span className="text-[#4F46E5]">Monitor</span>
        </span>
      )}
    </div>
  );
}
