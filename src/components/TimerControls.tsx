interface TimerControlsProps {
  isRunning: boolean;
  isIdle: boolean;
  onStart: () => void;
  onPause: () => void;
  onReset: () => void;
  onRestartSection: () => void;
  onPreviousRound: () => void;
  onNextRound: () => void;
}

export function TimerControls({
  isRunning,
  isIdle,
  onStart,
  onPause,
  onReset,
  onRestartSection,
  onPreviousRound,
  onNextRound,
}: TimerControlsProps) {
  // While idle, only show the big Start button. Skip controls don't make
  // sense before the workout begins.
  if (isIdle) {
    return (
      <div className="flex w-full max-w-sm flex-col gap-3">
        <button
          onClick={onStart}
          className="rounded-2xl bg-white/20 py-4 text-xl font-bold text-white active:bg-white/30 sm:text-2xl"
        >
          Start
        </button>
      </div>
    );
  }

  return (
    <div className="flex w-full max-w-sm flex-col gap-3">
      {/* Music-player row: prev | pause/resume | next */}
      <div className="flex items-center justify-center gap-3">
        <button
          onClick={onPreviousRound}
          aria-label="Previous round"
          className="flex h-14 w-14 items-center justify-center rounded-full bg-white/10 text-2xl text-white/80 active:bg-white/20"
        >
          ⏮
        </button>
        {isRunning ? (
          <button
            onClick={onPause}
            aria-label="Pause"
            className="flex h-20 w-20 items-center justify-center rounded-full bg-white text-3xl text-slate-800 active:bg-white/90"
          >
            ⏸
          </button>
        ) : (
          <button
            onClick={onStart}
            aria-label="Resume"
            className="flex h-20 w-20 items-center justify-center rounded-full bg-white text-3xl text-slate-800 active:bg-white/90"
          >
            ▶
          </button>
        )}
        <button
          onClick={onNextRound}
          aria-label="Next round"
          className="flex h-14 w-14 items-center justify-center rounded-full bg-white/10 text-2xl text-white/80 active:bg-white/20"
        >
          ⏭
        </button>
      </div>

      <div className="flex gap-3">
        <button
          onClick={onRestartSection}
          className="flex-1 rounded-2xl bg-white/10 py-3 text-sm font-medium text-white/70 active:bg-white/20"
        >
          Restart Section
        </button>
        <button
          onClick={onReset}
          className="flex-1 rounded-2xl bg-white/10 py-3 text-sm font-medium text-white/70 active:bg-white/20"
        >
          Reset
        </button>
      </div>
    </div>
  );
}
