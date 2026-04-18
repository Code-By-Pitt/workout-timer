# Workout Timer — Architecture

## Overview

Workout Timer is an interval timer for fitness instructors. Instructors create workouts with multiple sections and rounds, each with configurable work/rest splits, and run them with audio cues, a 10-second countdown clap, and optional Spotify music playback.

The app runs on two platforms sharing one backend:

- **Web app** — React SPA deployed on Vercel
- **Mobile app** — React Native (Expo) iOS app

Both connect to a shared **Supabase** backend for user auth, workout storage, and Spotify token management.

---

## Tech Stack

| Concern | Web | Mobile |
|---|---|---|
| Framework | React 19 + Vite 8 | Expo SDK 54 (React Native) |
| Language | TypeScript 6 | TypeScript 5.9 |
| Styling | Tailwind CSS v4 | NativeWind v4 (Tailwind for RN) |
| Navigation | View state in App.tsx | Expo Router (file-based) |
| State | `useReducer` + hooks | `useReducer` + hooks + Context |
| Auth | Supabase Auth | Supabase Auth |
| Database | Supabase (Postgres) | Supabase (Postgres) |
| Audio | HTML `<audio>` API | `expo-av` |
| Screen wake | Web Wake Lock API | `expo-keep-awake` |
| Spotify | OAuth PKCE + Connect API | OAuth PKCE (expo-auth-session) + Connect API |
| Token storage | Supabase DB + memory cache | Supabase DB + SecureStore cache |
| Deployment | Vercel | EAS Build + TestFlight |

---

## Architecture Diagram

```
┌─────────────────┐     ┌─────────────────┐
│   Web App        │     │   Mobile App     │
│   (React/Vite)   │     │   (Expo/RN)      │
└────────┬─────────┘     └────────┬─────────┘
         │                        │
         │   Supabase JS Client   │
         └───────────┬────────────┘
                     │
              ┌──────▼──────┐
              │   Supabase   │
              │              │
              │  Auth        │  ← Email + Google OAuth
              │  Postgres    │  ← workouts table (JSONB)
              │  RLS         │  ← spotify_tokens table
              └──────┬───────┘
                     │
              ┌──────▼──────┐
              │  Spotify API │  ← Connect API (play/pause)
              │              │  ← Playlists API (browse)
              └──────────────┘
```

---

## Project Structure

### Web (`/workout_timer/`)

```
src/
├── main.tsx                    # Entry point, AuthProvider, Spotify callback handler
├── App.tsx                     # View router (library/editor/timer), auth gate
├── index.css                   # Tailwind import
│
├── lib/
│   └── supabase.ts             # Supabase client singleton
│
├── hooks/
│   ├── useAuth.tsx             # Auth context: signIn, signUp, signInWithGoogle, signOut, resetPassword
│   ├── useSpotify.tsx          # Spotify context: connect, logout, isPremium, user
│   ├── useTimer.ts             # Core timer reducer + setInterval tick logic
│   ├── useWakeLock.ts          # Screen Wake Lock API wrapper
│   └── useWorkoutStorage.ts    # Supabase CRUD for workouts + localStorage migration
│
├── components/
│   ├── AuthScreen.tsx          # Login/signup (email + Google)
│   ├── WorkoutLibrary.tsx      # Workout list with sign-out button
│   ├── TimerConfig.tsx         # Workout editor (sections, rounds, Spotify picker)
│   ├── TimerDisplay.tsx        # Large countdown digits + phase label
│   ├── TimerControls.tsx       # Start/Pause/Reset/Restart Section buttons
│   ├── RepetitionCounter.tsx   # "Round X / Y"
│   ├── DurationStepper.tsx     # +/- stepper for work/rest seconds
│   ├── RoundEditor.tsx         # Per-round work/rest + label
│   ├── SectionEditor.tsx       # Section config (name, sound, rounds, rest)
│   ├── SpotifyConnectButton.tsx# Connect/disconnect Spotify
│   └── SpotifyPlaylistPicker.tsx# Modal to browse user's playlists
│
├── utils/
│   ├── formatTime.ts           # Seconds → "M:SS"
│   ├── playSound.ts            # HTML Audio wrapper with caching
│   ├── spotify.ts              # URL/URI parser for Spotify links
│   ├── spotifyAuth.ts          # PKCE OAuth flow, tokens in Supabase + memory
│   ├── spotifyApi.ts           # Spotify Web API wrapper (playlists, devices, play/pause)
│   └── oauthReturnState.ts     # Preserve editor state across Spotify OAuth redirect
│
└── types/
    └── timer.ts                # Phase, Round, Section, WorkoutConfig, SavedWorkout, SpotifyPlaylistRef
```

### Mobile (`/workout-timer-mobile/`)

```
app/                            # Expo Router file-based screens
├── _layout.tsx                 # Root layout: AuthProvider → auth gate → Stack
├── login.tsx                   # Login screen (email + Google)
├── index.tsx                   # Library (home) — FlatList of workouts
├── editor.tsx                  # Workout editor
└── timer.tsx                   # Active timer with Spotify integration

components/
├── TimerDisplay.tsx
├── TimerControls.tsx
├── RepetitionCounter.tsx
├── DurationStepper.tsx
├── RoundEditor.tsx
├── SectionEditor.tsx
├── SpotifyConnectButton.tsx
├── SpotifyPlaylistPicker.tsx
└── WorkoutListItem.tsx

hooks/
├── useAuth.tsx                 # Auth context (mirrors web)
├── useSpotify.tsx              # Spotify context (mirrors web)
├── useTimer.ts                 # Lifted from web, near-identical
└── useWorkoutStorage.tsx       # Supabase CRUD + AsyncStorage migration

lib/
├── supabase.ts                 # Supabase client with AsyncStorage session adapter
├── timer.ts                    # Types (identical to web)
├── formatTime.ts               # Lifted from web
├── playSound.ts                # expo-av based, caches Sound instances
├── spotify.ts                  # URL/URI parser (identical to web)
├── spotifyAuth.ts              # PKCE via expo-auth-session, tokens in Supabase + SecureStore
├── spotifyApi.ts               # Spotify Web API wrapper (identical to web)
└── WorkoutContext.tsx           # React Context for passing workout config between screens

assets/
├── icon.png                    # App icon (1024x1024)
└── sounds/                     # alarm, beep, bell, buzzer, chime, clap (.wav)
```

---

## Data Model

### Database Tables (Supabase Postgres)

**`workouts`** — one row per workout, owned by a user:
```
id          UUID (PK, auto-generated)
user_id     UUID (FK → auth.users, CASCADE delete)
name        TEXT
config      JSONB        ← full WorkoutConfig
created_at  TIMESTAMPTZ
updated_at  TIMESTAMPTZ
```

**`spotify_tokens`** — one row per user:
```
user_id        UUID (PK, FK → auth.users)
access_token   TEXT
refresh_token  TEXT
expires_at     BIGINT (ms timestamp)
updated_at     TIMESTAMPTZ
```

Both tables have Row-Level Security (RLS) — users can only access their own rows.

### WorkoutConfig JSONB Shape

```typescript
{
  name: "Upper Body",
  sections: [
    {
      name: "Warmup",
      transitionSound: "beep",        // "beep" | "bell" | "chime" | "buzzer"
      restBetweenSections: 60,         // seconds, 0 = no rest
      rounds: [
        {
          label: "Push-ups",           // optional exercise name
          workoutSeconds: 40,
          restSeconds: 20
        },
        { label: "Squats", workoutSeconds: 45, restSeconds: 15 }
      ]
    }
  ],
  spotifyUrl?: "https://open.spotify.com/playlist/...",   // legacy paste-URL fallback
  spotifyPlaylist?: {                                      // picked via OAuth
    id: "37i9dQZF1DX...",
    uri: "spotify:playlist:37i9dQZF1DX...",
    name: "Chill Beats",
    imageUrl: "https://...",
    trackCount: 127
  }
}
```

---

## Auth Flow

1. User opens app → login screen (email/password or Google)
2. Supabase Auth manages sessions, email verification, password reset
3. Session token stored by `@supabase/supabase-js` automatically (localStorage on web, AsyncStorage on mobile)
4. `useAuth` hook provides `user`, `signIn`, `signUp`, `signInWithGoogle`, `resetPassword`, `signOut`
5. App content gated behind `if (!user) return <AuthScreen />`

### Providers configured in Supabase Dashboard:
- **Email** — enabled by default
- **Google** — OAuth credentials from Google Cloud Console

---

## Spotify Integration

### Two separate OAuth flows:

1. **Sign-in** (removed) — was planned as Supabase Auth provider but Spotify doesn't reliably verify emails, causing account linking failures. Removed.

2. **Music playback** (active) — custom PKCE OAuth flow:
   - User clicks "Connect Spotify" in the workout editor
   - PKCE flow exchanges code for access + refresh tokens
   - Tokens stored in Supabase `spotify_tokens` table (source of truth) + cached in memory
   - Premium users get an in-app playlist picker (fetches `GET /me/playlists`)
   - Free users can paste a Spotify URL manually

### Playback control (Premium only):
- On workout start: `PUT /me/player/play` with the playlist URI → music starts on user's active Spotify device
- On pause: `PUT /me/player/pause` → music pauses
- On resume: `PUT /me/player/play` (no body) → music resumes from same position
- On reset/complete: `PUT /me/player/pause` → music stops
- 10-second clap sound plays at end of each work phase (in-app audio, not Spotify)

### Fallback (free users / no playlist picked):
- Pasted URL is opened via `window.open()` (web) or `Linking.openURL()` (mobile)
- User controls playback manually in Spotify

---

## How to Run

### Web (local development)

```bash
cd /Users/alexanderpitt/Documents/workout_timer

# Install dependencies
npm install

# Create .env with your credentials
# VITE_SPOTIFY_CLIENT_ID=...
# VITE_SUPABASE_URL=...
# VITE_SUPABASE_ANON_KEY=...

# Start dev server (use 127.0.0.1 for Spotify OAuth compatibility)
npm run dev -- --host 127.0.0.1

# Open http://127.0.0.1:5173/
```

### Mobile (Expo Go on iPhone)

```bash
cd /Users/alexanderpitt/Documents/workout-timer-mobile

# Install dependencies
npm install

# Start Metro bundler
npx expo start

# Scan QR code with iPhone camera → opens in Expo Go
```

### Production build (web)

```bash
npm run build    # outputs to dist/
npm run preview  # preview the production build locally
```

---

## How to Test

### Auth
1. Sign up with email → check inbox for verification → click link → sign in
2. Sign in with Google → consent screen → approved → lands on library
3. Sign out → returns to login screen
4. Forgot password → enter email → check inbox → reset link → set new password

### Workouts
1. Create a workout with 2 sections, 3 rounds each, custom work/rest times
2. Save → appears in library with correct summary
3. Edit → modify a round → save → changes persist
4. Delete → removed from library
5. Close browser → reopen → sign in → workouts still there (Supabase)

### Timer
1. Start a workout → green background (WORK), countdown runs
2. Work ends → amber background (REST), rest countdown
3. Rest ends → next round starts automatically
4. Section ends → blue background (SECTION REST) with "Up next: ..."
5. Pause → timer stops, resume → continues from same position
6. Reset → returns to initial state
7. Restart Section → resets to round 1 of current section
8. 10 seconds remaining in work → clap sound plays
9. All rounds complete → alarm sound, timer goes idle

### Spotify (Premium)
1. In editor → Connect Spotify → OAuth flow → "Connected as [name]"
2. Select a Spotify Playlist → cover art and track count shown
3. Save workout → start → music auto-plays on active Spotify device
4. Pause timer → music pauses
5. Resume → music resumes (same position, not track 1)
6. Reset/complete → music stops

### Cross-device
1. Create workout on web → sign in on mobile (same account) → workout appears
2. Connect Spotify on web → open mobile → Spotify already connected (tokens in Supabase)
3. Delete on mobile → refresh web → workout gone

---

## Environment Variables

### Web (`.env`)
| Variable | Description |
|---|---|
| `VITE_SPOTIFY_CLIENT_ID` | Spotify app Client ID (public, PKCE) |
| `VITE_SUPABASE_URL` | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Supabase publishable/anon key |

### Mobile (`app.json` → `extra`)
| Key | Description |
|---|---|
| `spotifyClientId` | Same Spotify Client ID |
| `supabaseUrl` | Same Supabase project URL |
| `supabaseAnonKey` | Same Supabase publishable key |

### Vercel (production)
Set the same three `VITE_*` variables in Vercel → Project → Settings → Environment Variables.

---

## Deployment

### Web → Vercel
- Auto-deploys on every push to `main` branch
- Framework: Vite (auto-detected)
- Build: `npm run build` → output: `dist/`
- `vercel.json` has a rewrite for `/callback` (Spotify OAuth redirect)
- GitHub repo: `Code-By-Pitt/workout-timer`

### Mobile → App Store (future)
1. Sign up for Apple Developer Program ($99/year)
2. `npm install -g eas-cli && eas login`
3. `eas init && eas build:configure`
4. `eas build --platform ios --profile production` (cloud build)
5. `eas submit --platform ios` (upload to App Store Connect)
6. Add screenshots, description, privacy policy in App Store Connect
7. Submit for Apple review (1-7 days)
- GitHub repo: `Code-By-Pitt/workout-timer-mobile`

### Supabase
- Project: `xncjzcjorlydoedxywze`
- Free tier: 500MB DB, 50K MAU
- Tables: `workouts`, `spotify_tokens` (with RLS)
- Auth providers: Email, Google
