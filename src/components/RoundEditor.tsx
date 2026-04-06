import type { Round } from "../types/timer";
import { DurationStepper } from "./DurationStepper";

interface RoundEditorProps {
  index: number;
  round: Round;
  onChange: (round: Round) => void;
  onRemove: (() => void) | null;
}

export function RoundEditor({ index, round, onChange, onRemove }: RoundEditorProps) {
  return (
    <div className="flex flex-col gap-2 rounded-xl bg-white/5 p-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-white/50">Round {index + 1}</span>
        {onRemove && (
          <button
            onClick={onRemove}
            className="text-xs text-white/40 hover:text-white/70"
          >
            Remove
          </button>
        )}
      </div>

      <input
        type="text"
        value={round.label}
        onChange={(e) => onChange({ ...round, label: e.target.value })}
        placeholder={`Round ${index + 1} exercise (optional)`}
        className="rounded-lg bg-white/10 px-3 py-2 text-sm text-white placeholder-white/30 outline-none focus:ring-2 focus:ring-white/40"
      />

      <div className="flex flex-wrap items-center gap-4">
        <DurationStepper
          label="Work"
          value={round.workoutSeconds}
          onChange={(v) => onChange({ ...round, workoutSeconds: v })}
          min={5}
          max={300}
          step={5}
        />
        <DurationStepper
          label="Rest"
          value={round.restSeconds}
          onChange={(v) => onChange({ ...round, restSeconds: v })}
          min={0}
          max={300}
          step={5}
        />
      </div>
    </div>
  );
}
