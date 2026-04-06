import type { Phase } from "../types/timer";
import { formatTime } from "../utils/formatTime";

interface TimerDisplayProps {
  secondsRemaining: number;
  phase: Phase;
}

const phaseLabel: Record<Phase, string> = {
  workout: "WORK",
  rest: "REST",
  section_rest: "SECTION REST",
  idle: "READY",
};

export function TimerDisplay({ secondsRemaining, phase }: TimerDisplayProps) {
  return (
    <div className="flex flex-col items-center gap-2">
      <p
        className="text-2xl font-bold uppercase tracking-widest opacity-80 sm:text-3xl"
        aria-live="assertive"
      >
        {phaseLabel[phase]}
      </p>
      <p
        className="font-mono text-[22vw] font-bold leading-none tabular-nums sm:text-[18vw] md:text-9xl"
        aria-label={`${secondsRemaining} seconds remaining, ${phase} phase`}
      >
        {formatTime(secondsRemaining)}
      </p>
    </div>
  );
}
