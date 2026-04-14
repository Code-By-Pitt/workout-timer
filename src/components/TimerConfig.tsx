import { useState } from "react";
import type { WorkoutConfig, Section, SpotifyPlaylistRef } from "../types/timer";
import { createDefaultSection } from "../types/timer";
import { SectionEditor } from "./SectionEditor";
import { parseSpotifyLink } from "../utils/spotify";
import { SpotifyConnectButton } from "./SpotifyConnectButton";
import { SpotifyPlaylistPicker } from "./SpotifyPlaylistPicker";
import { useSpotify } from "../hooks/useSpotify";

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
  onSave,
  onBack,
}: TimerConfigProps) {
  const [workout, setWorkout] = useState<WorkoutConfig>(config);
  const [pickerOpen, setPickerOpen] = useState(false);
  const { loggedIn, isPremium } = useSpotify();
  const canPickPlaylist = loggedIn && isPremium;

  function pickPlaylist(ref: SpotifyPlaylistRef) {
    setWorkout({ ...workout, spotifyPlaylist: ref, spotifyUrl: undefined });
    setPickerOpen(false);
  }

  function clearPlaylist() {
    setWorkout({ ...workout, spotifyPlaylist: undefined });
  }

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
    // Parent's onConfigChange (handleStartFromEditor) handles both
    // applying the config and starting the timer.
    onConfigChange(workout);
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

        {/* Music / Spotify */}
        <div className="flex flex-col gap-2">
          <label className="text-xs font-medium text-white/60">
            Music (optional)
          </label>
          <SpotifyConnectButton />

          {/* Picked playlist card */}
          {canPickPlaylist && workout.spotifyPlaylist && (
            <div className="flex items-center gap-3 rounded-xl bg-white/10 p-2">
              {workout.spotifyPlaylist.imageUrl ? (
                <img
                  src={workout.spotifyPlaylist.imageUrl}
                  alt=""
                  className="h-12 w-12 rounded object-cover"
                />
              ) : (
                <div className="flex h-12 w-12 items-center justify-center rounded bg-white/10 text-lg">
                  🎵
                </div>
              )}
              <div className="flex min-w-0 flex-1 flex-col">
                <span className="truncate text-sm font-medium text-white">
                  {workout.spotifyPlaylist.name}
                </span>
                {typeof workout.spotifyPlaylist.trackCount === "number" && (
                  <span className="text-xs text-white/50">
                    {workout.spotifyPlaylist.trackCount} tracks
                  </span>
                )}
              </div>
              <button
                onClick={() => setPickerOpen(true)}
                className="rounded-lg px-2 py-1 text-xs text-white/60 hover:bg-white/10"
              >
                Change
              </button>
              <button
                onClick={clearPlaylist}
                className="rounded-lg px-2 py-1 text-xs text-white/40 hover:bg-white/10"
              >
                Clear
              </button>
            </div>
          )}

          {/* Pick playlist button (Premium, logged in, no playlist picked yet) */}
          {canPickPlaylist && !workout.spotifyPlaylist && (
            <button
              onClick={() => setPickerOpen(true)}
              className="rounded-xl bg-white/10 px-4 py-3 text-sm font-medium text-white hover:bg-white/20"
            >
              🎵 Select a Spotify Playlist
            </button>
          )}

          {/* Fallback: paste URL (shown when no playlist picked) */}
          {!workout.spotifyPlaylist && (
            <>
              {canPickPlaylist && (
                <p className="text-center text-[10px] uppercase tracking-wider text-white/30">
                  or paste a link
                </p>
              )}
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
            </>
          )}
        </div>

        {pickerOpen && (
          <SpotifyPlaylistPicker
            onSelect={pickPlaylist}
            onClose={() => setPickerOpen(false)}
          />
        )}

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
