import { formatTime } from "../utils/formatTime";

interface DurationStepperProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
}

export function DurationStepper({
  label,
  value,
  onChange,
  min = 5,
  max = 300,
  step = 5,
}: DurationStepperProps) {
  return (
    <div className="flex items-center gap-2">
      <span className="w-12 text-xs text-white/60">{label}</span>
      <button
        onClick={() => onChange(Math.max(min, value - step))}
        disabled={value <= min}
        className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/10 text-lg font-bold text-white disabled:opacity-30"
      >
        −
      </button>
      <span className="w-12 text-center font-mono text-sm text-white">
        {formatTime(value)}
      </span>
      <button
        onClick={() => onChange(Math.min(max, value + step))}
        disabled={value >= max}
        className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/10 text-lg font-bold text-white disabled:opacity-30"
      >
        +
      </button>
    </div>
  );
}
