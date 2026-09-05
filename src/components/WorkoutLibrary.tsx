import type { SavedWorkout, WorkoutConfig } from "../types/timer";
import { formatTime } from "../utils/formatTime";
import { computeTotalSeconds } from "../utils/workoutSummary";
import { useAuth } from "../hooks/useAuth";

interface WorkoutLibraryProps {
  workouts: SavedWorkout[];
  onSelect: (workout: SavedWorkout) => void;
  onQuickStart: (workout: SavedWorkout) => void;
  onNew: () => void;
  onDelete: (id: string) => void;
}

function summarize(config: WorkoutConfig): string {
  const totalSections = config.sections.length;
  const totalRounds = config.sections.reduce((sum, s) => sum + s.rounds.length, 0);
  const totalTime = computeTotalSeconds(config);
  return `${totalSections} section${totalSections !== 1 ? "s" : ""} · ${totalRounds} round${totalRounds !== 1 ? "s" : ""} · ${formatTime(totalTime)}`;
}

export function WorkoutLibrary({
  workouts,
  onSelect,
  onQuickStart,
  onNew,
  onDelete,
}: WorkoutLibraryProps) {
  const { user, signOut } = useAuth();

  return (
    <div className="flex min-h-dvh flex-col items-center bg-slate-800 px-4 py-10 text-white">
      {/* Header with sign out */}
      <div className="mb-6 flex w-full max-w-md items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold sm:text-3xl">My Workouts</h1>
          <p className="text-xs text-white/40">{user?.email}</p>
        </div>
        <button
          onClick={signOut}
          className="rounded-lg px-3 py-1.5 text-sm text-white/50 hover:bg-white/10 hover:text-white/80"
        >
          Sign Out
        </button>
      </div>

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
            className="flex items-center gap-3 rounded-2xl bg-white/10 p-3"
          >
            {/* Quick-start button */}
            <button
              onClick={() => onQuickStart(w)}
              title="Start workout"
              aria-label="Start workout"
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-lg font-bold text-white hover:bg-emerald-700 active:bg-emerald-800"
            >
              ▶
            </button>

            {/* Card body — opens editor */}
            <button
              onClick={() => onSelect(w)}
              className="flex flex-1 flex-col gap-1 text-left"
            >
              <span className="text-lg font-semibold">
                {w.config.name || "Untitled Workout"}
              </span>
              <span className="flex items-center gap-1.5 text-xs text-white/50">
                {summarize(w.config)}
                {(w.config.spotifyPlaylist || w.config.spotifyUrl) && (
                  <span title="Has Spotify music" className="text-emerald-400">
                    🎵
                  </span>
                )}
              </span>
              <span className="text-xs text-white/30">
                Last edited {new Date(w.updatedAt).toLocaleDateString()}
              </span>
            </button>

            {/* Delete */}
            <button
              onClick={() => onDelete(w.id)}
              title="Delete workout"
              aria-label="Delete workout"
              className="shrink-0 rounded-lg px-2.5 py-2 text-xs text-white/40 hover:bg-white/10 hover:text-white/70"
            >
              Delete
            </button>
          </div>
        ))}
      </div>

      <footer className="mt-8 w-full max-w-md text-center">
        <a
          href="/privacy"
          className="text-xs text-white/30 underline hover:text-white/60"
        >
          Privacy Policy
        </a>
      </footer>
    </div>
  );
}
