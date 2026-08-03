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
  color = "#2E2A7B",
  showWordmark = true,
}: PropanLogoProps) {
  const style = height
    ? { height: typeof height === "number" ? `${height}px` : height }
    : undefined;

  return (
    <svg
      viewBox="0 0 200 230"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={style}
    >
      <g fill={color}>
        {/* Top Circle */}
        <circle cx="100" cy="50" r="42" fill={color} />
        <circle cx="100" cy="50" r="15" fill="#FFFFFF" />
        <line x1="100" y1="65" x2="100" y2="92" stroke="#FFFFFF" strokeWidth="5.5" />
        <line x1="89" y1="59" x2="65" y2="79" stroke="#FFFFFF" strokeWidth="5.5" />
        <line x1="111" y1="59" x2="135" y2="79" stroke="#FFFFFF" strokeWidth="5.5" />

        {/* Bottom-Left Circle */}
        <circle cx="52" cy="132" r="42" fill={color} />
        <circle cx="52" cy="132" r="15" fill="#FFFFFF" />
        <line x1="52" y1="117" x2="52" y2="90" stroke="#FFFFFF" strokeWidth="5.5" />
        <line x1="63" y1="139" x2="87" y2="155" stroke="#FFFFFF" strokeWidth="5.5" />
        <line x1="63" y1="125" x2="88" y2="110" stroke="#FFFFFF" strokeWidth="5.5" />

        {/* Bottom-Right Circle */}
        <circle cx="148" cy="132" r="42" fill={color} />
        <circle cx="148" cy="132" r="15" fill="#FFFFFF" />
        <line x1="148" y1="117" x2="148" y2="90" stroke="#FFFFFF" strokeWidth="5.5" />
        <line x1="137" y1="139" x2="113" y2="155" stroke="#FFFFFF" strokeWidth="5.5" />
        <line x1="137" y1="125" x2="112" y2="110" stroke="#FFFFFF" strokeWidth="5.5" />

        {/* Wordmark "propan" */}
        {showWordmark && (
          <text
            x="100"
            y="222"
            textAnchor="middle"
            fontFamily="'Inter', 'Montserrat', 'Helvetica Neue', Arial, sans-serif"
            fontWeight="900"
            fontSize="36"
            letterSpacing="-1px"
            fill={color}
          >
            propan
          </text>
        )}
      </g>
    </svg>
  );
}
