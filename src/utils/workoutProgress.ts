import type { TimerState } from "../types/timer";
import { computeTotalSeconds } from "./workoutSummary";

export interface WorkoutProgress {
  elapsedSeconds: number;
  remainingSeconds: number;
  totalSeconds: number;
}

/**
 * Compute how many seconds have elapsed in the workout overall and how
 * many remain. Returns null when the workout hasn't started running yet
 * (idle phase).
 */
export function computeWorkoutProgress(state: TimerState): WorkoutProgress | null {
  if (state.phase === "idle") return null;

  const { config, currentSectionIndex, currentRoundIndex, phase, secondsRemaining } = state;
  const totalSeconds = computeTotalSeconds(config);

  // Sum of all phases that have fully completed before the current one
  let completed = 0;

  // Prepare phase: only counts as completed if we're past it
  const prep = config.prepareSeconds ?? 5;
  if (phase !== "prepare") completed += prep;

  // All earlier sections in full
  for (let s = 0; s < currentSectionIndex; s++) {
    const section = config.sections[s];
    for (const round of section.rounds) {
      completed += round.workoutSeconds + round.restSeconds;
    }
    completed += section.restBetweenSections;
  }

  const currentSection = config.sections[currentSectionIndex];

  // Prior rounds in the current section
  if (currentSection) {
    for (let r = 0; r < currentRoundIndex; r++) {
      const round = currentSection.rounds[r];
      completed += round.workoutSeconds + round.restSeconds;
    }
  }

  // Current round's work portion if we're in rest
  const currentRound = currentSection?.rounds[currentRoundIndex];
  if (phase === "rest" && currentRound) {
    completed += currentRound.workoutSeconds;
  }

  // Phase duration of the current phase
  let currentPhaseDuration = 0;
  if (phase === "prepare") currentPhaseDuration = prep;
  else if (phase === "workout") currentPhaseDuration = currentRound?.workoutSeconds ?? 0;
  else if (phase === "rest") currentPhaseDuration = currentRound?.restSeconds ?? 0;
  else if (phase === "section_rest")
    currentPhaseDuration = currentSection?.restBetweenSections ?? 0;

  const currentPhaseElapsed = Math.max(
    0,
    currentPhaseDuration - secondsRemaining
  );

  const elapsedSeconds = completed + currentPhaseElapsed;
  const remainingSeconds = Math.max(0, totalSeconds - elapsedSeconds);

  return { elapsedSeconds, remainingSeconds, totalSeconds };
}
