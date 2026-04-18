// Spotify OAuth 2.0 Authorization Code + PKCE
// Tokens stored in Supabase spotify_tokens table (server-side)
// Access token cached in memory only (no localStorage — XSS-safe)

import { supabase } from "../lib/supabase";

const CLIENT_ID = import.meta.env.VITE_SPOTIFY_CLIENT_ID as string;
const AUTH_URL = "https://accounts.spotify.com/authorize";
const TOKEN_URL = "https://accounts.spotify.com/api/token";

const SCOPES = [
  "user-read-email",
  "user-read-private",
  "playlist-read-private",
  "playlist-read-collaborative",
  "user-read-playback-state",
  "user-modify-playback-state",
].join(" ");

// In-memory cache only — never written to localStorage
let cachedAccessToken: string | null = null;
let cachedExpiresAt = 0;

function getRedirectUri(): string {
  let origin = window.location.origin;
  origin = origin
    .replace("//localhost:", "//127.0.0.1:")
    .replace("//localhost/", "//127.0.0.1/");
  if (origin.endsWith("//localhost"))
    origin = origin.replace("//localhost", "//127.0.0.1");
  return `${origin}/callback`;
}

// PKCE helpers
function randomString(length: number): string {
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~";
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => chars[b % chars.length]).join("");
}

async function sha256Base64Url(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return base64UrlEncode(new Uint8Array(hash));
}

function base64UrlEncode(bytes: Uint8Array): string {
  let str = "";
  for (const b of bytes) str += String.fromCharCode(b);
  return btoa(str).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export async function startLogin(): Promise<void> {
  const verifier = randomString(64);
  const challenge = await sha256Base64Url(verifier);
  // Code verifier is short-lived and must survive the redirect — sessionStorage is acceptable here
  sessionStorage.setItem("spotify.code_verifier", verifier);

  const params = new URLSearchParams({
    client_id: CLIENT_ID,
    response_type: "code",
    redirect_uri: getRedirectUri(),
    code_challenge_method: "S256",
    code_challenge: challenge,
    scope: SCOPES,
  });

  window.location.assign(`${AUTH_URL}?${params.toString()}`);
}

export async function handleCallback(code: string): Promise<void> {
  const verifier = sessionStorage.getItem("spotify.code_verifier");
  if (!verifier) throw new Error("Missing code verifier");

  const body = new URLSearchParams({
    client_id: CLIENT_ID,
    grant_type: "authorization_code",
    code,
    redirect_uri: getRedirectUri(),
    code_verifier: verifier,
  });

  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Token exchange failed: ${text}`);
  }

  const data: {
    access_token: string;
    refresh_token: string;
    expires_in: number;
  } = await res.json();

  await storeTokens(data.access_token, data.refresh_token, data.expires_in);
  sessionStorage.removeItem("spotify.code_verifier");
}

async function storeTokens(
  accessToken: string,
  refreshToken: string,
  expiresIn: number
) {
  const expiresAt = Date.now() + expiresIn * 1000;

  // Cache in memory
  cachedAccessToken = accessToken;
  cachedExpiresAt = expiresAt;

  // Persist refresh token + access token in Supabase
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  await supabase.from("spotify_tokens").upsert(
    {
      user_id: user.id,
      access_token: accessToken,
      refresh_token: refreshToken,
      expires_at: expiresAt,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" }
  );
}

export async function isLoggedIn(): Promise<boolean> {
  if (cachedAccessToken) return true;
  // Check Supabase for stored tokens
  const tokens = await loadTokensFromSupabase();
  return tokens !== null;
}

export async function logout() {
  cachedAccessToken = null;
  cachedExpiresAt = 0;

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) {
    await supabase.from("spotify_tokens").delete().eq("user_id", user.id);
  }

  // Clean up any legacy localStorage tokens
  localStorage.removeItem("spotify.access_token");
  localStorage.removeItem("spotify.refresh_token");
  localStorage.removeItem("spotify.expires_at");
}

let refreshPromise: Promise<string | null> | null = null;

export async function getAccessToken(): Promise<string | null> {
  // Return cached token if still valid
  if (cachedAccessToken && Date.now() < cachedExpiresAt - 30_000) {
    return cachedAccessToken;
  }

  // Try loading from Supabase
  const tokens = await loadTokensFromSupabase();
  if (!tokens) return null;

  // If the stored access token is still valid, cache and return
  if (Date.now() < tokens.expires_at - 30_000) {
    cachedAccessToken = tokens.access_token;
    cachedExpiresAt = tokens.expires_at;
    return tokens.access_token;
  }

  // Refresh needed
  if (!refreshPromise) {
    refreshPromise = refreshAccessToken(tokens.refresh_token).finally(() => {
      refreshPromise = null;
    });
  }
  return refreshPromise;
}

async function loadTokensFromSupabase(): Promise<{
  access_token: string;
  refresh_token: string;
  expires_at: number;
} | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("spotify_tokens")
    .select("access_token, refresh_token, expires_at")
    .eq("user_id", user.id)
    .single();

  return data ?? null;
}

async function refreshAccessToken(
  refreshToken: string
): Promise<string | null> {
  const body = new URLSearchParams({
    client_id: CLIENT_ID,
    grant_type: "refresh_token",
    refresh_token: refreshToken,
  });
  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  if (!res.ok) {
    await logout();
    return null;
  }
  const data: {
    access_token: string;
    refresh_token?: string;
    expires_in: number;
  } = await res.json();

  await storeTokens(
    data.access_token,
    data.refresh_token ?? refreshToken,
    data.expires_in
  );
  return data.access_token;
}
