import type { WorkoutConfig } from "../types/timer";

const KEY = "workout-timer.oauth_return";

export interface OAuthReturnState {
  editorConfig: WorkoutConfig;
  editingId?: string;
}

export function saveOAuthReturnState(state: OAuthReturnState): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    // ignore
  }
}

// Reads and removes the saved state in a single call.
export function takeOAuthReturnState(): OAuthReturnState | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    localStorage.removeItem(KEY);
    return JSON.parse(raw) as OAuthReturnState;
  } catch {
    try {
      localStorage.removeItem(KEY);
    } catch {
      // ignore
    }
    return null;
  }
}
