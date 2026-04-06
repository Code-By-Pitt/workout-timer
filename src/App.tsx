import { useEffect, useRef, useState } from "react";
import { useTimer } from "./hooks/useTimer";
import { useWakeLock } from "./hooks/useWakeLock";
import { useWorkoutStorage } from "./hooks/useWorkoutStorage";
import { TimerDisplay } from "./components/TimerDisplay";
import { TimerControls } from "./components/TimerControls";
import { TimerConfig } from "./components/TimerConfig";
import { RepetitionCounter } from "./components/RepetitionCounter";
import { WorkoutLibrary } from "./components/WorkoutLibrary";
import { playSound, preloadSound } from "./utils/playSound";
import type { Phase, WorkoutConfig, SavedWorkout } from "./types/timer";
import { TRANSITION_SOUNDS, createDefaultWorkout } from "./types/timer";

const ALARM_SOUND = "/sounds/alarm.wav";
const CLAP_SOUND = "/sounds/clap.wav";
const COUNTDOWN_SECONDS = 10;

const bgColor: Record<Phase, string> = {
  workout: "bg-emerald-600",
  rest: "bg-amber-500",
  section_rest: "bg-blue-600",
  idle: "bg-slate-800",
};

type View = "library" | "editor" | "timer";

function App() {
  const { state, start, pause, reset, restartSection, setConfig, phaseChanged, previousPhase } =
    useTimer();
  const { workouts, save, remove } = useWorkoutStorage();
  const audioPrewarmed = useRef(false);

  const [view, setView] = useState<View>("library");
  const [editingId, setEditingId] = useState<string | undefined>();
  const [editorConfig, setEditorConfig] = useState<WorkoutConfig>(createDefaultWorkout);

  useWakeLock(state.isRunning);

  const currentSection = state.config.sections[state.currentSectionIndex];
  const currentRound = currentSection?.rounds[state.currentRoundIndex];
  const transitionSoundPath = currentSection
    ? `/sounds/${currentSection.transitionSound}.wav`
    : `/sounds/beep.wav`;

  function prewarmAudio() {
    if (!audioPrewarmed.current) {
      for (const s of TRANSITION_SOUNDS) {
        preloadSound(`/sounds/${s.id}.wav`);
      }
      preloadSound(ALARM_SOUND);
      preloadSound(CLAP_SOUND);
      audioPrewarmed.current = true;
    }
  }

  function handleStart() {
    prewarmAudio();
    start();
  }

  function handleNewWorkout() {
    setEditorConfig(createDefaultWorkout());
    setEditingId(undefined);
    setView("editor");
  }

  function handleSelectWorkout(saved: SavedWorkout) {
    setEditorConfig(saved.config);
    setEditingId(saved.id);
    setView("editor");
  }

  function handleSave(config: WorkoutConfig, existingId?: string) {
    save(config, existingId);
    if (!existingId) {
      // After saving a new workout, go back to library so they can see it
      setView("library");
    }
  }

  function handleStartFromEditor(config: WorkoutConfig) {
    setConfig(config);
    setView("timer");
    // start() needs to fire after setConfig processes
    setTimeout(() => {
      prewarmAudio();
      start();
    }, 0);
  }

  function handleResetToLibrary() {
    reset();
    setView("library");
  }

  // Play sounds on phase transitions
  useEffect(() => {
    if (!phaseChanged) return;
    if (state.phase === "workout" && previousPhase !== "idle") {
      playSound(transitionSoundPath);
    } else if (state.phase === "rest") {
      playSound(transitionSoundPath);
    } else if (state.phase === "idle" && previousPhase !== "idle") {
      playSound(ALARM_SOUND);
    }
  }, [state.phase, phaseChanged, previousPhase, transitionSoundPath]);

  // Clap at 10 seconds remaining in work phase
  useEffect(() => {
    if (
      state.phase === "workout" &&
      state.isRunning &&
      state.secondsRemaining === COUNTDOWN_SECONDS
    ) {
      playSound(CLAP_SOUND);
    }
  }, [state.phase, state.isRunning, state.secondsRemaining]);

  // When timer finishes (goes idle while in timer view), stay on timer view
  // so the user sees the controls

  // --- Library View ---
  if (view === "library") {
    return (
      <WorkoutLibrary
        workouts={workouts}
        onSelect={handleSelectWorkout}
        onNew={handleNewWorkout}
        onDelete={remove}
      />
    );
  }

  // --- Editor View ---
  if (view === "editor") {
    return (
      <TimerConfig
        config={editorConfig}
        editingId={editingId}
        onConfigChange={(config) => handleStartFromEditor(config)}
        onStart={handleStart}
        onSave={handleSave}
        onBack={() => setView("library")}
      />
    );
  }

  // --- Timer View ---
  const isIdle = state.phase === "idle";
  const totalSections = state.config.sections.length;
  const totalRoundsInSection = currentSection?.rounds.length ?? 0;
  const headerName = state.config.name || "WORKOUT TIMER";

  return (
    <div
      className={`flex min-h-dvh flex-col items-center justify-center gap-6 px-4 text-white transition-colors duration-500 ${bgColor[state.phase]}`}
    >
      <h1 className="text-lg font-semibold tracking-wider opacity-70 sm:text-xl">
        {headerName.toUpperCase()}
      </h1>

      {/* Section rest — show upcoming section name */}
      {state.phase === "section_rest" && (() => {
        const nextSection = state.config.sections[state.currentSectionIndex + 1];
        return nextSection?.name ? (
          <p className="text-base font-medium opacity-70 sm:text-lg">
            Up next: {nextSection.name}
          </p>
        ) : null;
      })()}

      {/* Section name when running */}
      {!isIdle && state.phase !== "section_rest" && currentSection?.name && (
        <p className="text-base font-medium opacity-60 sm:text-lg">
          {currentSection.name}
          {totalSections > 1 && (
            <span className="ml-2 text-sm opacity-60">
              (Section {state.currentSectionIndex + 1}/{totalSections})
            </span>
          )}
        </p>
      )}

      {/* Round label / exercise name */}
      {!isIdle && state.phase !== "section_rest" && currentRound?.label && (
        <p className="text-2xl font-bold sm:text-3xl">{currentRound.label}</p>
      )}

      <TimerDisplay
        secondsRemaining={state.secondsRemaining}
        phase={state.phase}
      />

      {!isIdle && (
        <RepetitionCounter
          currentRound={state.currentRoundIndex + 1}
          totalRounds={totalRoundsInSection}
        />
      )}

      <TimerControls
        isRunning={state.isRunning}
        isIdle={isIdle}
        onStart={handleStart}
        onPause={pause}
        onReset={reset}
        onRestartSection={restartSection}
      />

      {/* Back to library when idle */}
      {isIdle && (
        <button
          onClick={handleResetToLibrary}
          className="mt-4 text-sm text-white/50 hover:text-white/80"
        >
          ← Back to Workouts
        </button>
      )}
    </div>
  );
}

export default App;
