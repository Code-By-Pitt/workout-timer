import { useState } from "react";
import type { WorkoutConfig, Section, SpotifyPlaylistRef } from "../types/timer";
import { createDefaultSection } from "../types/timer";
import { SectionEditor } from "./SectionEditor";
import { parseSpotifyLink } from "../utils/spotify";
import { SpotifyConnectButton } from "./SpotifyConnectButton";
import { SpotifyPlaylistPicker } from "./SpotifyPlaylistPicker";
import { useSpotify } from "../hooks/useSpotify";
import { saveOAuthReturnState } from "../utils/oauthReturnState";

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
  const [collapsedSections, setCollapsedSections] = useState<Set<number>>(
    new Set()
  );
  const { loggedIn, isPremium } = useSpotify();
  const canPickPlaylist = loggedIn && isPremium;

  const showCollapseToggle = workout.sections.length > 1;

  function toggleCollapsed(index: number) {
    setCollapsedSections((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  }

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
    // Drop the removed index and shift down indices > removed
    setCollapsedSections((prev) => {
      const next = new Set<number>();
      prev.forEach((i) => {
        if (i < index) next.add(i);
        else if (i > index) next.add(i - 1);
      });
      return next;
    });
  }

  function addSection() {
    setWorkout({
      ...workout,
      sections: [...workout.sections, createDefaultSection()],
    });
    // New section is added at the end and stays expanded by default
  }

  function handleStartWorkout() {
    onConfigChange(workout);
  }

  function handleSave() {
    onSave(workout, editingId);
  }

  return (
    <div className="flex min-h-dvh flex-col bg-slate-800 text-white">
      {/* Sticky header */}
      <div className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-white/10 bg-slate-800/95 px-4 py-3 backdrop-blur">
        <button
          onClick={onBack}
          className="text-sm text-white/60 hover:text-white"
        >
          ← Back
        </button>
        <h2 className="text-base font-semibold text-white">
          {editingId ? "Edit Workout" : "New Workout"}
        </h2>
        <button
          onClick={handleSave}
          className="rounded-lg bg-emerald-600 px-4 py-1.5 text-sm font-semibold text-white active:bg-emerald-700"
        >
          {editingId ? "Save" : "Save"}
        </button>
      </div>

      {/* Scrollable form */}
      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto flex w-full max-w-md flex-col gap-5 px-4 py-6 pb-32">
          {/* Workout Name */}
          <input
            type="text"
            value={workout.name}
            onChange={(e) => setWorkout({ ...workout, name: e.target.value })}
            placeholder="Workout name (e.g. Upper Body)"
            className="rounded-xl bg-white/10 px-4 py-3 text-white placeholder-white/30 outline-none focus:ring-2 focus:ring-white/40"
          />

          {/* Prep time */}
          <div className="flex items-center justify-between rounded-xl bg-white/10 px-4 py-3">
            <div className="flex flex-col">
              <span className="text-xs font-medium text-white/60">
                Prep time
              </span>
              <span className="text-[10px] text-white/40">
                Yellow countdown before workout starts
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              {[0, 5, 10, 15, 20, 30].map((s) => {
                const current = workout.prepareSeconds ?? 5;
                const active = current === s;
                return (
                  <button
                    key={s}
                    onClick={() =>
                      setWorkout({ ...workout, prepareSeconds: s })
                    }
                    className={`min-w-[2rem] rounded-md px-1.5 py-1 text-xs font-medium ${
                      active
                        ? "bg-white text-slate-800"
                        : "bg-white/10 text-white/70 hover:bg-white/20"
                    }`}
                  >
                    {s === 0 ? "Off" : `${s}s`}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Music / Spotify */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-medium text-white/60">
              Music (optional)
            </label>
            <SpotifyConnectButton
              onBeforeConnect={() =>
                saveOAuthReturnState({ editorConfig: workout, editingId })
              }
            />

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

            {canPickPlaylist && !workout.spotifyPlaylist && (
              <button
                onClick={() => setPickerOpen(true)}
                className="rounded-xl bg-white/10 px-4 py-3 text-sm font-medium text-white hover:bg-white/20"
              >
                🎵 Select a Spotify Playlist
              </button>
            )}

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
                    <p className="text-xs text-red-400">
                      Not a valid Spotify link
                    </p>
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
          <div className="flex flex-col gap-4">
            {workout.sections.map((section, i) => (
              <SectionEditor
                key={i}
                index={i}
                section={section}
                onChange={(s) => updateSection(i, s)}
                onRemove={
                  workout.sections.length > 1 ? () => removeSection(i) : null
                }
                collapsed={collapsedSections.has(i)}
                onToggleCollapse={
                  showCollapseToggle ? () => toggleCollapsed(i) : null
                }
              />
            ))}
          </div>

          <button
            onClick={addSection}
            className="rounded-xl bg-white/10 py-3 text-sm font-medium text-white hover:bg-white/20"
          >
            + Add Section
          </button>
        </div>
      </div>

      {/* Sticky Start Workout */}
      <div className="sticky bottom-0 z-10 border-t border-white/10 bg-slate-800/95 px-4 py-3 backdrop-blur">
        <div className="mx-auto w-full max-w-md">
          <button
            onClick={handleStartWorkout}
            className="w-full rounded-2xl bg-white py-4 text-xl font-bold text-slate-800 active:bg-white/90"
          >
            Start Workout
          </button>
        </div>
      </div>
    </div>
  );
}
