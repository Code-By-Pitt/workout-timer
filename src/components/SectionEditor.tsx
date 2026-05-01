import type { Section, Round, TransitionSound } from "../types/timer";
import { TRANSITION_SOUNDS, createDefaultRound } from "../types/timer";
import { RoundEditor } from "./RoundEditor";
import { DurationStepper } from "./DurationStepper";
import { playSound } from "../utils/playSound";
import { formatTime } from "../utils/formatTime";

interface SectionEditorProps {
  index: number;
  section: Section;
  onChange: (section: Section) => void;
  onRemove: (() => void) | null;
  /** When true, render only the collapsed header */
  collapsed?: boolean;
  /** Tap header to toggle. If null, no toggle is shown (single-section workouts). */
  onToggleCollapse?: (() => void) | null;
}

function sectionSummary(section: Section): string {
  const rounds = section.rounds.length;
  const totalSeconds = section.rounds.reduce(
    (sum, r) => sum + r.workoutSeconds + r.restSeconds,
    0
  );
  return `${rounds} round${rounds !== 1 ? "s" : ""} · ${formatTime(totalSeconds)}`;
}

export function SectionEditor({
  index,
  section,
  onChange,
  onRemove,
  collapsed = false,
  onToggleCollapse = null,
}: SectionEditorProps) {
  function updateRound(roundIndex: number, round: Round) {
    const rounds = [...section.rounds];
    rounds[roundIndex] = round;
    onChange({ ...section, rounds });
  }

  function removeRound(roundIndex: number) {
    onChange({ ...section, rounds: section.rounds.filter((_, i) => i !== roundIndex) });
  }

  function addRound() {
    const last = section.rounds[section.rounds.length - 1];
    const newRound = last
      ? createDefaultRound(last.workoutSeconds, last.restSeconds)
      : createDefaultRound();
    onChange({ ...section, rounds: [...section.rounds, newRound] });
  }

  function duplicateRounds(count: number) {
    const last = section.rounds[section.rounds.length - 1];
    const template = last
      ? { workoutSeconds: last.workoutSeconds, restSeconds: last.restSeconds }
      : { workoutSeconds: 40, restSeconds: 20 };
    const newRounds = Array.from({ length: count }, () =>
      createDefaultRound(template.workoutSeconds, template.restSeconds)
    );
    onChange({ ...section, rounds: [...section.rounds, ...newRounds] });
  }

  function handleSoundChange(s: TransitionSound) {
    onChange({ ...section, transitionSound: s });
    playSound(`/sounds/${s}.wav`);
  }

  // Header — always shown
  const Header = (
    <div className="flex items-center justify-between gap-2">
      {onToggleCollapse ? (
        <button
          onClick={onToggleCollapse}
          className="flex flex-1 items-center gap-2 text-left"
          aria-expanded={!collapsed}
        >
          <span
            className="inline-block text-xs text-white/50 transition-transform"
            style={{ transform: collapsed ? "rotate(-90deg)" : "rotate(0deg)" }}
          >
            ▼
          </span>
          <h3 className="flex flex-1 flex-col text-sm font-bold uppercase tracking-wider text-white/60">
            <span>
              Section {index + 1}
              {section.name && (
                <span className="ml-2 normal-case tracking-normal text-white/80">
                  {section.name}
                </span>
              )}
            </span>
            {collapsed && (
              <span className="text-[10px] font-normal normal-case tracking-normal text-white/40">
                {sectionSummary(section)}
              </span>
            )}
          </h3>
        </button>
      ) : (
        <h3 className="flex-1 text-sm font-bold uppercase tracking-wider text-white/60">
          Section {index + 1}
        </h3>
      )}
      {onRemove && (
        <button
          onClick={onRemove}
          className="text-xs text-white/40 hover:text-white/70"
        >
          Remove
        </button>
      )}
    </div>
  );

  if (collapsed) {
    return (
      <div className="rounded-2xl bg-white/10 p-4 backdrop-blur-sm">{Header}</div>
    );
  }

  return (
    <div className="flex flex-col gap-4 rounded-2xl bg-white/10 p-4 backdrop-blur-sm">
      {Header}

      {/* Section Name */}
      <input
        type="text"
        value={section.name}
        onChange={(e) => onChange({ ...section, name: e.target.value })}
        placeholder="Section name (e.g. Upper Body)"
        className="rounded-xl bg-white/10 px-4 py-3 text-white placeholder-white/30 outline-none focus:ring-2 focus:ring-white/40"
      />

      {/* Transition Sound */}
      <div className="flex flex-col gap-2">
        <label className="text-xs font-medium text-white/60">
          Transition Sound
        </label>
        <div className="grid grid-cols-4 gap-1.5">
          {TRANSITION_SOUNDS.map((s) => (
            <button
              key={s.id}
              onClick={() => handleSoundChange(s.id)}
              className={`rounded-lg px-2 py-2 text-xs font-medium transition-colors ${
                section.transitionSound === s.id
                  ? "bg-white text-slate-800"
                  : "bg-white/10 text-white hover:bg-white/20"
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Rest After Section */}
      <div className="flex flex-col gap-2">
        <label className="text-xs font-medium text-white/60">
          Rest After Section
        </label>
        <DurationStepper
          label=""
          value={section.restBetweenSections}
          onChange={(v) => onChange({ ...section, restBetweenSections: v })}
          min={0}
          max={300}
          step={15}
        />
      </div>

      {/* Rounds */}
      <div className="flex flex-col gap-2">
        <label className="text-xs font-medium text-white/60">
          Rounds ({section.rounds.length})
        </label>
        <div className="flex max-h-72 flex-col gap-2 overflow-y-auto pr-1">
          {section.rounds.map((round, i) => (
            <RoundEditor
              key={i}
              index={i}
              round={round}
              onChange={(r) => updateRound(i, r)}
              onRemove={section.rounds.length > 1 ? () => removeRound(i) : null}
            />
          ))}
        </div>
        <div className="flex gap-2">
          <button
            onClick={addRound}
            className="flex-1 rounded-xl bg-white/10 py-2.5 text-sm font-medium text-white hover:bg-white/20"
          >
            + Add Round
          </button>
          {section.rounds.length < 3 && (
            <button
              onClick={() => duplicateRounds(4)}
              className="rounded-xl bg-white/10 px-4 py-2.5 text-sm font-medium text-white hover:bg-white/20"
            >
              + Add 4
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
