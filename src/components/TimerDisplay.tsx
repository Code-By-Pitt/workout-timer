import type { Phase } from "../types/timer";
import { formatTime } from "../utils/formatTime";

interface TimerDisplayProps {
  secondsRemaining: number;
  phase: Phase;
  /** When true, digits gently pulse (final 5 seconds of work) */
  pulse?: boolean;
}

const phaseLabel: Record<Phase, string> = {
  prepare: "GET READY",
  workout: "WORK",
  rest: "REST",
  section_rest: "SECTION REST",
  idle: "READY",
};

export function TimerDisplay({
  secondsRemaining,
  phase,
  pulse = false,
}: TimerDisplayProps) {
  return (
    <div className="flex flex-col items-center gap-1">
      <p
        className="text-xl font-bold uppercase tracking-widest opacity-80 sm:text-2xl"
        aria-live="assertive"
      >
        {phaseLabel[phase]}
      </p>
      <p
        className={
          "font-mono font-bold leading-none tabular-nums " +
          "text-[clamp(4rem,18vw,9rem)] " +
          (pulse ? "animate-timer-pulse" : "")
        }
        aria-label={`${secondsRemaining} seconds remaining, ${phase} phase`}
      >
        {formatTime(secondsRemaining)}
      </p>
    </div>
  );
}
