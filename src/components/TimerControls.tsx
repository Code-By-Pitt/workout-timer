interface TimerControlsProps {
  isRunning: boolean;
  isIdle: boolean;
  onStart: () => void;
  onPause: () => void;
  onReset: () => void;
  onRestartSection: () => void;
}

export function TimerControls({
  isRunning,
  isIdle,
  onStart,
  onPause,
  onReset,
  onRestartSection,
}: TimerControlsProps) {
  return (
    <div className="flex w-full max-w-sm flex-col gap-3">
      <div className="flex gap-3">
        {isRunning ? (
          <button
            onClick={onPause}
            className="flex-1 rounded-2xl bg-white/20 py-4 text-xl font-bold text-white active:bg-white/30 sm:text-2xl"
          >
            Pause
          </button>
        ) : (
          <button
            onClick={onStart}
            className="flex-1 rounded-2xl bg-white/20 py-4 text-xl font-bold text-white active:bg-white/30 sm:text-2xl"
          >
            {isIdle ? "Start" : "Resume"}
          </button>
        )}
        {!isIdle && (
          <button
            onClick={onReset}
            className="rounded-2xl bg-white/10 px-6 py-4 text-xl font-bold text-white/70 active:bg-white/20 sm:text-2xl"
          >
            Reset
          </button>
        )}
      </div>
      {!isIdle && (
        <button
          onClick={onRestartSection}
          className="w-full rounded-2xl bg-white/10 py-3 text-base font-medium text-white/60 active:bg-white/20"
        >
          Restart Section
        </button>
      )}
    </div>
  );
}
