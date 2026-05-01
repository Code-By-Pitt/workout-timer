import type { ReactNode } from "react";

interface ProgressRingProps {
  /** 0 to 1 */
  progress: number;
  /** Diameter in px */
  size: number;
  strokeWidth?: number;
  /** Tailwind color for the active arc, e.g. "stroke-emerald-300" */
  activeColorClass?: string;
  children: ReactNode;
}

export function ProgressRing({
  progress,
  size,
  strokeWidth = 10,
  activeColorClass = "stroke-white",
  children,
}: ProgressRingProps) {
  const clamped = Math.min(1, Math.max(0, progress));
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - clamped);

  return (
    <div
      className="relative flex items-center justify-center"
      style={{ width: size, height: size }}
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="absolute inset-0 -rotate-90 transform"
      >
        {/* Track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          className="stroke-white/20"
        />
        {/* Active arc */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className={`${activeColorClass} transition-[stroke-dashoffset] duration-1000 ease-linear`}
        />
      </svg>
      <div className="relative flex flex-col items-center justify-center">
        {children}
      </div>
    </div>
  );
}
