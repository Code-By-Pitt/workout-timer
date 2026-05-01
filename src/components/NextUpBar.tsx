import type { TimerState } from "../types/timer";
import { computeNext } from "../utils/computeNext";
import { formatTime } from "../utils/formatTime";

const phaseLabel: Record<string, string> = {
  workout: "WORK",
  rest: "REST",
  section_rest: "SECTION REST",
};

interface NextUpBarProps {
  state: TimerState;
}

export function NextUpBar({ state }: NextUpBarProps) {
  const next = computeNext(state);
  if (!next) {
    if (state.phase !== "idle") {
      return (
        <div className="rounded-full bg-white/10 px-4 py-1.5 text-xs font-medium uppercase tracking-wider text-white/80">
          Final interval
        </div>
      );
    }
    return null;
  }

  const parts: string[] = [phaseLabel[next.phase] ?? next.phase.toUpperCase()];
  if (next.label) parts.push(next.label);
  parts.push(formatTime(next.seconds));

  return (
    <div className="rounded-full bg-white/10 px-4 py-1.5 text-xs font-medium uppercase tracking-wider text-white/80">
      Next: {parts.join(" · ")}
    </div>
  );
}
