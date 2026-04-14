// OAuth 2.0 Authorization Code + PKCE for Spotify
// No backend — Client ID is public, PKCE protects the flow

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

const STORAGE_KEYS = {
  accessToken: "spotify.access_token",
  refreshToken: "spotify.refresh_token",
  expiresAt: "spotify.expires_at",
  codeVerifier: "spotify.code_verifier",
} as const;

function getRedirectUri(): string {
  return `${window.location.origin}/callback`;
}

// PKCE helpers using Web Crypto API
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
  localStorage.setItem(STORAGE_KEYS.codeVerifier, verifier);

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
  const verifier = localStorage.getItem(STORAGE_KEYS.codeVerifier);
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

  storeTokens(data.access_token, data.refresh_token, data.expires_in);
  localStorage.removeItem(STORAGE_KEYS.codeVerifier);
}

function storeTokens(accessToken: string, refreshToken: string, expiresIn: number) {
  localStorage.setItem(STORAGE_KEYS.accessToken, accessToken);
  localStorage.setItem(STORAGE_KEYS.refreshToken, refreshToken);
  localStorage.setItem(
    STORAGE_KEYS.expiresAt,
    String(Date.now() + expiresIn * 1000)
  );
}

export function isLoggedIn(): boolean {
  return Boolean(
    localStorage.getItem(STORAGE_KEYS.accessToken) &&
      localStorage.getItem(STORAGE_KEYS.refreshToken)
  );
}

export function logout() {
  localStorage.removeItem(STORAGE_KEYS.accessToken);
  localStorage.removeItem(STORAGE_KEYS.refreshToken);
  localStorage.removeItem(STORAGE_KEYS.expiresAt);
}

let refreshPromise: Promise<string> | null = null;

export async function getAccessToken(): Promise<string | null> {
  const token = localStorage.getItem(STORAGE_KEYS.accessToken);
  const expiresAt = Number(localStorage.getItem(STORAGE_KEYS.expiresAt) ?? 0);
  // Refresh if expired or expiring in the next 30s
  if (token && Date.now() < expiresAt - 30_000) {
    return token;
  }
  const refreshToken = localStorage.getItem(STORAGE_KEYS.refreshToken);
  if (!refreshToken) return null;

  // Share in-flight refresh
  if (!refreshPromise) {
    refreshPromise = refreshAccessToken(refreshToken).finally(() => {
      refreshPromise = null;
    });
  }
  return refreshPromise;
}

async function refreshAccessToken(refreshToken: string): Promise<string> {
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
    // Refresh token invalid — force re-login
    logout();
    throw new Error("Refresh token invalid");
  }
  const data: {
    access_token: string;
    refresh_token?: string;
    expires_in: number;
  } = await res.json();
  storeTokens(
    data.access_token,
    data.refresh_token ?? refreshToken,
    data.expires_in
  );
  return data.access_token;
}
