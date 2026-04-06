import { useState, useCallback } from "react";
import type { SavedWorkout, WorkoutConfig } from "../types/timer";

const STORAGE_KEY = "workout-timer-workouts";

function migrateConfig(config: WorkoutConfig): WorkoutConfig {
  return {
    ...config,
    sections: config.sections.map((s) => ({
      ...s,
      restBetweenSections: s.restBetweenSections ?? 60,
    })),
  };
}

function loadAll(): SavedWorkout[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed: SavedWorkout[] = JSON.parse(raw);
    return parsed.map((w) => ({ ...w, config: migrateConfig(w.config) }));
  } catch {
    return [];
  }
}

function saveAll(workouts: SavedWorkout[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(workouts));
}

export function useWorkoutStorage() {
  const [workouts, setWorkouts] = useState<SavedWorkout[]>(loadAll);

  const save = useCallback((config: WorkoutConfig, existingId?: string) => {
    setWorkouts((prev) => {
      const now = Date.now();
      if (existingId) {
        const updated = prev.map((w) =>
          w.id === existingId ? { ...w, config, updatedAt: now } : w
        );
        saveAll(updated);
        return updated;
      }
      const newWorkout: SavedWorkout = {
        id: crypto.randomUUID(),
        config,
        createdAt: now,
        updatedAt: now,
      };
      const updated = [newWorkout, ...prev];
      saveAll(updated);
      return updated;
    });
  }, []);

  const remove = useCallback((id: string) => {
    setWorkouts((prev) => {
      const updated = prev.filter((w) => w.id !== id);
      saveAll(updated);
      return updated;
    });
  }, []);

  return { workouts, save, remove };
}
