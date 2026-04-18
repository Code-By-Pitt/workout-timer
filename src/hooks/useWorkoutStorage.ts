import { useState, useCallback, useEffect } from "react";
import type { SavedWorkout, WorkoutConfig } from "../types/timer";
import { supabase } from "../lib/supabase";
import { useAuth } from "./useAuth";

const LOCAL_STORAGE_KEY = "workout-timer-workouts";

export function useWorkoutStorage() {
  const { user } = useAuth();
  const [workouts, setWorkouts] = useState<SavedWorkout[]>([]);
  const [loaded, setLoaded] = useState(false);

  // Load workouts from Supabase + migrate any local data on first login
  useEffect(() => {
    if (!user) return;

    async function loadAndMigrate() {
      // Check for legacy localStorage workouts to migrate
      await migrateLocalWorkouts(user!.id);

      // Fetch from Supabase
      const { data } = await supabase
        .from("workouts")
        .select("*")
        .order("updated_at", { ascending: false });

      if (data) {
        setWorkouts(
          data.map((row) => ({
            id: row.id,
            config: row.config as WorkoutConfig,
            createdAt: new Date(row.created_at).getTime(),
            updatedAt: new Date(row.updated_at).getTime(),
          }))
        );
      }
      setLoaded(true);
    }

    loadAndMigrate();
  }, [user]);

  const save = useCallback(
    async (config: WorkoutConfig, existingId?: string) => {
      if (!user) return;

      if (existingId) {
        const { error } = await supabase
          .from("workouts")
          .update({
            name: config.name,
            config,
            updated_at: new Date().toISOString(),
          })
          .eq("id", existingId);

        if (!error) {
          setWorkouts((prev) =>
            prev.map((w) =>
              w.id === existingId
                ? { ...w, config, updatedAt: Date.now() }
                : w
            )
          );
        }
      } else {
        const { data, error } = await supabase
          .from("workouts")
          .insert({
            user_id: user.id,
            name: config.name,
            config,
          })
          .select()
          .single();

        if (!error && data) {
          const newWorkout: SavedWorkout = {
            id: data.id,
            config,
            createdAt: new Date(data.created_at).getTime(),
            updatedAt: new Date(data.updated_at).getTime(),
          };
          setWorkouts((prev) => [newWorkout, ...prev]);
        }
      }
    },
    [user]
  );

  const remove = useCallback(
    async (id: string) => {
      if (!user) return;

      const { error } = await supabase
        .from("workouts")
        .delete()
        .eq("id", id);

      if (!error) {
        setWorkouts((prev) => prev.filter((w) => w.id !== id));
      }
    },
    [user]
  );

  return { workouts, save, remove, loaded };
}

// One-time migration: upload any workouts from localStorage to Supabase
async function migrateLocalWorkouts(userId: string) {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!raw) return;

    const localWorkouts: SavedWorkout[] = JSON.parse(raw);
    if (!localWorkouts.length) {
      localStorage.removeItem(LOCAL_STORAGE_KEY);
      return;
    }

    const rows = localWorkouts.map((w) => ({
      user_id: userId,
      name: w.config.name,
      config: w.config,
      created_at: new Date(w.createdAt).toISOString(),
      updated_at: new Date(w.updatedAt).toISOString(),
    }));

    const { error } = await supabase.from("workouts").insert(rows);
    if (!error) {
      localStorage.removeItem(LOCAL_STORAGE_KEY);
    }
  } catch {
    // Don't block on migration errors — local data stays until next attempt
  }
}
