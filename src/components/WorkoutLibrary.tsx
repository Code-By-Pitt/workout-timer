import type { SavedWorkout, WorkoutConfig } from "../types/timer";
import { formatTime } from "../utils/formatTime";

interface WorkoutLibraryProps {
  workouts: SavedWorkout[];
  onSelect: (workout: SavedWorkout) => void;
  onNew: () => void;
  onDelete: (id: string) => void;
}

function summarize(config: WorkoutConfig): string {
  const totalSections = config.sections.length;
  const totalRounds = config.sections.reduce((sum, s) => sum + s.rounds.length, 0);
  const totalTime = config.sections.reduce(
    (sum, s) => sum + s.rounds.reduce((rs, r) => rs + r.workoutSeconds + r.restSeconds, 0),
    0
  );
  return `${totalSections} section${totalSections !== 1 ? "s" : ""} · ${totalRounds} round${totalRounds !== 1 ? "s" : ""} · ${formatTime(totalTime)}`;
}

export function WorkoutLibrary({ workouts, onSelect, onNew, onDelete }: WorkoutLibraryProps) {
  return (
    <div className="flex min-h-dvh flex-col items-center bg-slate-800 px-4 py-10 text-white">
      <h1 className="mb-2 text-2xl font-bold sm:text-3xl">My Workouts</h1>
      <p className="mb-8 text-sm text-white/50">
        Select a workout or create a new one
      </p>

      <div className="flex w-full max-w-md flex-col gap-3">
        <button
          onClick={onNew}
          className="rounded-2xl bg-emerald-600 py-4 text-lg font-bold active:bg-emerald-700"
        >
          + Create New Workout
        </button>

        {workouts.length === 0 && (
          <p className="py-8 text-center text-sm text-white/40">
            No saved workouts yet. Create one to get started.
          </p>
        )}

        {workouts.map((w) => (
          <div
            key={w.id}
            className="flex items-center gap-3 rounded-2xl bg-white/10 p-4"
          >
            <button
              onClick={() => onSelect(w)}
              className="flex flex-1 flex-col gap-1 text-left"
            >
              <span className="text-lg font-semibold">
                {w.config.name || "Untitled Workout"}
              </span>
              <span className="flex items-center gap-1.5 text-xs text-white/50">
                {summarize(w.config)}
                {w.config.spotifyUrl && (
                  <span title="Has Spotify playlist" className="text-emerald-400">
                    🎵
                  </span>
                )}
              </span>
              <span className="text-xs text-white/30">
                Last edited {new Date(w.updatedAt).toLocaleDateString()}
              </span>
            </button>
            <button
              onClick={() => onDelete(w.id)}
              className="rounded-xl px-3 py-2 text-xs text-white/40 hover:bg-white/10 hover:text-white/70"
            >
              Delete
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
