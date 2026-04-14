import { useState } from "react";
import type { WorkoutConfig, Section } from "../types/timer";
import { createDefaultSection } from "../types/timer";
import { SectionEditor } from "./SectionEditor";
import { parseSpotifyLink } from "../utils/spotify";

interface TimerConfigProps {
  config: WorkoutConfig;
  editingId?: string;
  onConfigChange: (config: WorkoutConfig) => void;
  onStart: () => void;
  onSave: (config: WorkoutConfig, existingId?: string) => void;
  onBack: () => void;
}

export function TimerConfig({
  config,
  editingId,
  onConfigChange,
  onStart,
  onSave,
  onBack,
}: TimerConfigProps) {
  const [workout, setWorkout] = useState<WorkoutConfig>(config);

  function updateSection(index: number, section: Section) {
    const sections = [...workout.sections];
    sections[index] = section;
    setWorkout({ ...workout, sections });
  }

  function removeSection(index: number) {
    setWorkout({
      ...workout,
      sections: workout.sections.filter((_, i) => i !== index),
    });
  }

  function addSection() {
    setWorkout({
      ...workout,
      sections: [...workout.sections, createDefaultSection()],
    });
  }

  function handleStartWorkout() {
    onConfigChange(workout);
    onStart();
  }

  function handleSave() {
    onSave(workout, editingId);
  }

  return (
    <div className="flex min-h-dvh flex-col items-center bg-slate-800 px-4 py-10 text-white">
      <div className="flex w-full max-w-md flex-col gap-5">
        {/* Back button */}
        <button
          onClick={onBack}
          className="self-start text-sm text-white/50 hover:text-white/80"
        >
          ← Back to Workouts
        </button>

        <h2 className="text-center text-2xl font-bold text-white">
          {editingId ? "Edit Workout" : "New Workout"}
        </h2>

        {/* Workout Name */}
        <input
          type="text"
          value={workout.name}
          onChange={(e) => setWorkout({ ...workout, name: e.target.value })}
          placeholder="Workout name (e.g. Upper Body)"
          className="rounded-xl bg-white/10 px-4 py-3 text-white placeholder-white/30 outline-none focus:ring-2 focus:ring-white/40"
        />

        {/* Spotify URL */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-white/60">
            Music (optional)
          </label>
          <input
            type="text"
            value={workout.spotifyUrl ?? ""}
            onChange={(e) =>
              setWorkout({ ...workout, spotifyUrl: e.target.value })
            }
            placeholder="Paste Spotify link (playlist, album, track)"
            className="rounded-xl bg-white/10 px-4 py-3 text-white placeholder-white/30 outline-none focus:ring-2 focus:ring-white/40"
            autoCapitalize="none"
            autoCorrect="off"
          />
          {(() => {
            const value = workout.spotifyUrl?.trim() ?? "";
            if (!value) return null;
            const parsed = parseSpotifyLink(value);
            if (parsed) {
              return (
                <p className="text-xs text-emerald-400">
                  ✓ Ready — opens when you start the workout
                </p>
              );
            }
            return (
              <p className="text-xs text-red-400">Not a valid Spotify link</p>
            );
          })()}
        </div>

        {/* Sections */}
        <div className="flex max-h-[50vh] flex-col gap-4 overflow-y-auto pr-1">
          {workout.sections.map((section, i) => (
            <SectionEditor
              key={i}
              index={i}
              section={section}
              onChange={(s) => updateSection(i, s)}
              onRemove={workout.sections.length > 1 ? () => removeSection(i) : null}
            />
          ))}
        </div>

        <button
          onClick={addSection}
          className="rounded-xl bg-white/10 py-3 text-sm font-medium text-white hover:bg-white/20"
        >
          + Add Section
        </button>

        {/* Action Buttons */}
        <div className="flex flex-col gap-3">
          <button
            onClick={handleStartWorkout}
            className="rounded-2xl bg-white py-4 text-xl font-bold text-slate-800 active:bg-white/90"
          >
            Start Workout
          </button>
          <button
            onClick={handleSave}
            className="rounded-2xl bg-emerald-600 py-3 text-lg font-bold text-white active:bg-emerald-700"
          >
            {editingId ? "Save Changes" : "Save Workout"}
          </button>
        </div>
      </div>
    </div>
  );
}
