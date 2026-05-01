import type { Phase, TimerState, WorkoutConfig } from "../types/timer";

export interface NextInterval {
  phase: Phase;
  label?: string;     // exercise name when next is a workout
  seconds: number;    // duration of the next interval
  sectionName?: string;
}

/**
 * Given the current timer state, compute what happens after the
 * current interval ends. Returns null if this is the final interval
 * of the workout.
 */
export function computeNext(state: TimerState): NextInterval | null {
  const { config, phase, currentSectionIndex, currentRoundIndex } = state;
  const section = config.sections[currentSectionIndex];
  const round = section?.rounds[currentRoundIndex];
  if (!section || !round) return null;

  if (phase === "prepare") {
    // After prepare: first round's workout
    return {
      phase: "workout",
      label: round.label || undefined,
      seconds: round.workoutSeconds,
      sectionName: section.name || undefined,
    };
  }

  if (phase === "workout") {
    // After workout: rest (if there is rest), or next round/section
    if (round.restSeconds > 0) {
      return { phase: "rest", seconds: round.restSeconds };
    }
    return computeNextAfterRest(config, currentSectionIndex, currentRoundIndex);
  }

  if (phase === "rest") {
    return computeNextAfterRest(config, currentSectionIndex, currentRoundIndex);
  }

  if (phase === "section_rest") {
    // After section rest: first round of next section
    const nextSection = config.sections[currentSectionIndex + 1];
    const nextRound = nextSection?.rounds[0];
    if (!nextRound) return null;
    return {
      phase: "workout",
      label: nextRound.label || undefined,
      seconds: nextRound.workoutSeconds,
      sectionName: nextSection.name || undefined,
    };
  }

  // idle — compute the very first interval
  if (phase === "idle") {
    const firstSection = config.sections[0];
    const firstRound = firstSection?.rounds[0];
    if (!firstRound) return null;
    return {
      phase: "workout",
      label: firstRound.label || undefined,
      seconds: firstRound.workoutSeconds,
      sectionName: firstSection.name || undefined,
    };
  }

  return null;
}

function computeNextAfterRest(
  config: WorkoutConfig,
  sectionIndex: number,
  roundIndex: number
): NextInterval | null {
  const section = config.sections[sectionIndex];
  if (!section) return null;

  // Next round in same section
  if (roundIndex + 1 < section.rounds.length) {
    const next = section.rounds[roundIndex + 1];
    return {
      phase: "workout",
      label: next.label || undefined,
      seconds: next.workoutSeconds,
    };
  }

  // Next section?
  if (sectionIndex + 1 < config.sections.length) {
    if (section.restBetweenSections > 0) {
      return {
        phase: "section_rest",
        seconds: section.restBetweenSections,
      };
    }
    const nextSection = config.sections[sectionIndex + 1];
    const nextRound = nextSection?.rounds[0];
    if (!nextRound) return null;
    return {
      phase: "workout",
      label: nextRound.label || undefined,
      seconds: nextRound.workoutSeconds,
      sectionName: nextSection.name || undefined,
    };
  }

  // Workout complete
  return null;
}
