# Workout Timer — UI Redesign Spec

## Research Summary

Analysis of Timer Plus, Interval Timer (DreamSpark), Interval Timer (Deltaworks), Seconds Pro, and top-rated HIIT timer apps on Dribbble — including direct visual review of their App Store / Play Store screenshots via Playwright — reveals consistent UX patterns that our app should adopt.

### Visual evidence from competitor screenshots

**Timer Plus (App Store hero is landscape mode):**
- Landscape is featured as the PRIMARY use case — phone propped sideways on a bench
- Vertically rotated "WORK" label down the left edge
- Timer digits occupy ~70% of screen height
- "UP NEXT: REST 00:10" preview pinned to the right edge
- "ROUNDS LEFT: 2", "CYCLES LEFT: 3" in bottom corners
- Three distinct phases with three colors: PREPARE (yellow), WORK (lime green), REST (red)
- Stop/pause controls are small and monochrome — they get out of the way

**Interval Timer (DreamSpark) — extreme minimalism:**
- Three full-color screens: yellow (rest/prep), green (work), blue (rest after)
- Just four elements visible: time, phase label, round number, single icon
- No progress ring, no controls, no "next up" — color IS the entire UX
- Most-requested feature in reviews: "preview of the next exercise" (validates our NextUp bar)

**Interval Timer (Deltaworks):**
- **Exercise name at top** ("Squat press") in large bold text
- **Dual-time display**: huge current countdown + small elapsed/total at the sides
- Music-player controls: previous-round / play-pause / next-round
- Skip-back/skip-forward let users jump rounds without resetting
- Per-section color theming (different colors for different sections)

### Patterns confirmed across all three apps

### Key patterns from top apps:
1. **Full-screen color coding** is the #1 UX differentiator — the ENTIRE screen changes color per phase. Users recognize their state from across a gym without reading text.
2. **Timer text dominates the viewport** — nothing competes with it. Minimum 30% of screen height for the digits alone.
3. **Circular progress ring** around or near the timer shows how far through the current interval you are — gives spatial sense of "almost done" without reading numbers.
4. **Minimal UI during active timer** — hide everything that isn't needed mid-workout. Only show: time, phase, round, exercise name. Controls at the bottom, small.
5. **"Next up" preview** — shows what's coming after the current interval (e.g., "Next: REST 20s" or "Next: Squats").
6. **Bottom-anchored controls** — Start/Pause and Reset are thumb-reachable at the bottom. Never at the top.
7. **Landscape mode** — phone propped sideways on a bench shows a massive timer.
8. **Audio + visual countdown** — last 3-5 seconds have a distinct visual pulse or countdown animation, not just the 10s clap.

### Current weaknesses of our app:
- Timer text is large but not dominant — other UI competes for attention
- No progress indicator (ring or bar)
- No "next up" preview
- No landscape support
- Editor is functional but visually flat
- Library is basic — no workout preview or quick-start
- Controls look generic

---

## Redesign: Timer Screen (Active Workout)

This is the most important screen — instructors look at it for 30-60 minutes straight.

### Layout (Portrait)

```
┌──────────────────────────────────────┐
│ [status bar]                          │
│                                       │
│          UPPER BODY CIRCUIT           │  ← workout name, small, dim
│           Section 1 / 3               │  ← section info, small
│                                       │
│                                       │
│         ┌─────────────────┐           │
│        ╱                   ╲          │
│       │    ╭─────────────╮  │         │
│       │    │             │  │         │  ← circular progress ring
│       │    │    2:34     │  │         │  ← GIANT countdown (30%+ of height)
│       │    │             │  │         │
│       │    ╰─────────────╯  │         │
│        ╲                   ╱          │
│         └─────────────────┘           │
│                                       │
│              ● WORK ●                 │  ← phase label with pulsing dot
│                                       │
│           Push-ups                    │  ← exercise name, prominent
│           Round 3 / 8                 │  ← round counter
│                                       │
│   ┌─────────────────────────────┐     │
│   │  Next: REST · 0:20          │     │  ← next-up preview bar
│   └─────────────────────────────┘     │
│                                       │
│                                       │
│    ┌──────────┐    ┌──────────┐       │
│    │  PAUSE   │    │  RESET   │       │  ← controls at bottom
│    └──────────┘    └──────────┘       │
│    ┌────────────────────────────┐     │
│    │      Restart Section       │     │
│    └────────────────────────────┘     │
│                                       │
└──────────────────────────────────────┘
```

### Color System

| Phase | Background | Ring Color | Text |
|---|---|---|---|
| WORK | `#059669` (emerald-600) | `#34d399` (emerald-400) | White |
| REST | `#d97706` (amber-600) | `#fbbf24` (amber-400) | White |
| SECTION REST | `#2563eb` (blue-600) | `#60a5fa` (blue-400) | White |
| IDLE | `#1e293b` (slate-800) | `#475569` (slate-500) | White |
| LAST 5 SECONDS | Current phase color + **pulsing opacity** | Ring flashes | Digits scale up slightly |

### Circular Progress Ring

- SVG `<circle>` with `stroke-dasharray` + `stroke-dashoffset` animated per second
- Fills clockwise from 12 o'clock
- Semi-transparent track ring behind the active arc
- Ring thickness: 8px on mobile, 12px on desktop
- Ring diameter: ~65% of screen width (portrait)
- Timer digits centered inside the ring

### "Next Up" Preview Bar

- Small bar below the round counter
- Shows what happens when the current interval ends:
  - During WORK: "Next: REST · 0:20"
  - During REST: "Next: WORK · Push-ups · 0:40" (if there's a next round with a label)
  - During last REST of a section: "Next: SECTION REST · 1:00" or "Next: Squats (Section 2)"
  - During last interval of workout: "Final interval!"
- Background: `white/10`, rounded pill shape
- Appears only during active timer, not during idle

### Last 5 Seconds Animation

- Timer digits pulse (scale 1.0 → 1.05 → 1.0) each second for the last 5 seconds of WORK phase
- Background opacity pulses subtly (0.9 → 1.0 → 0.9)
- Existing clap sound at 10s remains

### Controls

- **During workout**: Pause + Reset side by side (large, rounded, semi-transparent white). Restart Section below, smaller.
- **During idle**: Single large "Start Workout" button. "← Back" link below.
- Buttons are `min-height: 56px` for easy tap targets with sweaty hands.

---

## Redesign: Library Screen (Workout List)

### Layout

```
┌──────────────────────────────────────┐
│ [status bar]                          │
│                                       │
│  My Workouts            [Sign Out]    │
│  alex@email.com                       │
│                                       │
│  ┌──────────────────────────────────┐ │
│  │  + Create New Workout            │ │  ← prominent green button
│  └──────────────────────────────────┘ │
│                                       │
│  ┌──────────────────────────────────┐ │
│  │ ┌────┐                           │ │
│  │ │ ▶  │  Upper Body Circuit       │ │  ← quick-start button
│  │ │    │  3 sections · 12 rounds   │ │
│  │ └────┘  Total: 18:00  🎵         │ │  ← total time + Spotify badge
│  │                       [Edit] [⋮] │ │  ← edit + overflow menu (delete)
│  └──────────────────────────────────┘ │
│                                       │
│  ┌──────────────────────────────────┐ │
│  │ ┌────┐                           │ │
│  │ │ ▶  │  HIIT Blast               │ │
│  │ │    │  1 section · 8 rounds     │ │
│  │ └────┘  Total: 12:00             │ │
│  │                       [Edit] [⋮] │ │
│  └──────────────────────────────────┘ │
│                                       │
└──────────────────────────────────────┘
```

### Changes from current:
- **Quick-start button (▶)** on each workout card — tap to start immediately without opening the editor. Saves an entire screen transition for repeat workouts.
- **Total workout time** calculated and shown (sum of all work + rest + section rest)
- **Edit button** is explicit (not the whole card)
- **Overflow menu (⋮)** for delete, duplicate, share (future)
- Cards have subtle left-border color accent

---

## Redesign: Editor Screen

### Layout

```
┌──────────────────────────────────────┐
│ [← Back]              [Save]         │
│                                       │
│  Workout Name                         │
│  [Upper Body Circuit________________] │
│                                       │
│  Music (optional)                     │
│  [🎵 Connected: Chill Beats  ][Clear]│ │
│                                       │
│  ─── Section 1: Warmup ───           │
│  Sound: [Beep] [Bell] [Chime] [Buzz] │
│  Rest after: [- 1:00 +]              │
│                                       │
│  ┌──────────────────────────────────┐ │
│  │ Round 1                          │ │
│  │ [Push-ups_______________]        │ │
│  │ Work [- 0:40 +]  Rest [- 0:20 +]│ │
│  └──────────────────────────────────┘ │
│  ┌──────────────────────────────────┐ │
│  │ Round 2                          │ │
│  │ [Squats_________________]        │ │
│  │ Work [- 0:45 +]  Rest [- 0:15 +]│ │
│  └──────────────────────────────────┘ │
│  [+ Add Round]  [+ Add 4]            │
│                                       │
│  [+ Add Section]                      │
│                                       │
│  ┌──────────────────────────────────┐ │
│  │        Start Workout              │ │  ← prominent, bottom
│  └──────────────────────────────────┘ │
│                                       │
└──────────────────────────────────────┘
```

### Changes from current:
- **Save button in header** (top-right) instead of at the bottom — always visible without scrolling
- **Section headers are collapsible** — tap to expand/collapse. Reduces scroll for multi-section workouts.
- **Workout summary** at the bottom before Start button shows total time
- **Start Workout** button is sticky at the bottom (doesn't scroll away)

---

## Redesign: Login Screen

### Layout

```
┌──────────────────────────────────────┐
│                                       │
│                                       │
│            [timer icon]               │
│                                       │
│         WORKOUT TIMER                 │
│    Train smarter. Time everything.    │
│                                       │
│                                       │
│  ┌──────────────────────────────────┐ │
│  │  G  Continue with Google         │ │  ← white button, Google colors
│  └──────────────────────────────────┘ │
│                                       │
│  ──────────── or ────────────         │
│                                       │
│  Email                                │
│  [____________________________________│
│                                       │
│  Password                             │
│  [____________________________________│
│                                       │
│  ┌──────────────────────────────────┐ │
│  │          Sign In                  │ │  ← emerald button
│  └──────────────────────────────────┘ │
│                                       │
│  Forgot password?                     │
│                                       │
│  Don't have an account? Sign Up       │
│                                       │
└──────────────────────────────────────┘
```

### Changes from current:
- **App icon** at the top for brand identity
- **Tagline** below the title
- Otherwise similar — the current login screen is clean

---

## New Component: ProgressRing

Circular SVG progress indicator used on the timer screen.

### Props
```typescript
interface ProgressRingProps {
  progress: number;    // 0 to 1
  size: number;        // diameter in px
  strokeWidth: number; // ring thickness
  trackColor: string;  // unfilled ring color
  fillColor: string;   // filled arc color
  children: ReactNode; // timer digits rendered inside
}
```

### Implementation
- SVG `<circle>` with `stroke-dasharray` = circumference
- `stroke-dashoffset` = `circumference * (1 - progress)`
- `transform="rotate(-90)"` to start from 12 o'clock
- Animated via CSS transition (`stroke-dashoffset 1s linear`)
- On mobile: React Native SVG (`react-native-svg`)

---

## New Component: NextUpBar

Preview of the next interval.

### Props
```typescript
interface NextUpBarProps {
  currentPhase: Phase;
  currentRound: Round;
  currentRoundIndex: number;
  currentSectionIndex: number;
  config: WorkoutConfig;
}
```

### Logic
- Computes what comes after the current interval (rest → next round's work, work → rest, last round → section rest or workout complete)
- Renders: "Next: [PHASE] · [exercise name] · [duration]"
- "Final interval!" when this is the last interval of the workout

---

## Typography Scale

| Element | Web | Mobile | Weight |
|---|---|---|---|
| Timer digits | `clamp(4rem, 20vw, 10rem)` | 80pt | Bold, monospace, tabular-nums |
| Phase label | `1.5rem` | 24pt | Bold, uppercase, tracking-widest |
| Exercise name | `1.75rem` | 28pt | Bold |
| Round counter | `1.125rem` | 18pt | Medium |
| Next-up bar | `0.875rem` | 14pt | Medium |
| Section name | `1rem` | 16pt | Medium, dim |
| Workout name | `0.875rem` | 14pt | Semibold, dim |
| Controls | `1.25rem` | 20pt | Bold |

---

## Implementation Priority

### Phase 1 (highest impact, do first)
1. **ProgressRing component** — circular progress on timer screen
2. **NextUpBar component** — "next up" preview
3. **Timer typography overhaul** — make digits truly dominant
4. **Last 5 seconds pulse animation**

### Phase 2 (library improvements)
5. **Quick-start button** on workout cards
6. **Total workout time** calculation and display
7. **Edit/overflow menu** separation

### Phase 3 (editor polish)
8. **Collapsible sections**
9. **Sticky Start Workout button**
10. **Save in header**

### Phase 4 (stretch)
11. **Landscape mode** (web + mobile)
12. **Workout summary** before starting
13. **Skip-round controls** (previous/next round buttons during active timer, like Deltaworks)
14. **Dual-time display** (small "elapsed | total" strip alongside the main countdown)
15. **PREPARE phase** before the first work interval — 5-10s "Get Ready" countdown so the user isn't caught mid-fumble when WORK starts (Timer Plus has this)

---

## New Insights from Screenshots

### Add a PREPARE phase
Timer Plus has a yellow "PREPARE" phase that runs for ~5 seconds before the first WORK interval. This is a small but noticeable UX win: the user starts the timer, sees a 5-second countdown, gets into position, and then WORK begins — instead of needing to rush to position the moment they hit Start. Easy to add: extend the Phase type, add a `prepareSeconds` field to WorkoutConfig (default 5, configurable, can be disabled by setting to 0).

### Hero use case is landscape
Timer Plus features landscape mode as their FIRST screenshot for a reason — instructors prop their phone on a bench and walk away from it. Our portrait-only design forces them to keep the phone vertical, which is awkward. Landscape mode should be a Phase 4 priority, not a stretch goal — it's a real differentiator.

### Skip-round controls
Deltaworks has previous/next round buttons that let the instructor skip a round mid-workout (e.g., a participant arrives late, or someone needs to skip a difficult exercise). Our Restart Section is helpful but coarse-grained. Add `nextRound()` and `previousRound()` to the timer reducer — small change, high utility.

### Phase color recommendations (refined)
Based on what tests well across the three apps:

| Phase | Background | Why |
|---|---|---|
| PREPARE | `#eab308` (yellow-500) | Universally yellow = "get ready" |
| WORK | `#10b981` (emerald-500) | Slightly brighter than current emerald-600 — Timer Plus uses near-fluorescent lime |
| REST | `#dc2626` (red-600) | Red signals "stop / recovery" — Timer Plus uses red, DreamSpark uses blue. Red is more universally read as "stop" |
| SECTION REST | `#2563eb` (blue-600) | Blue distinguishes section breaks from round rests |
| IDLE | `#1e293b` (slate-800) | Dark neutral for setup/between |

(Current app uses amber-500 for REST — consider switching to red-600 for stronger contrast and faster recognition.)

---

## Platform Notes

### Web-specific
- ProgressRing uses inline SVG
- Landscape mode via CSS `@media (orientation: landscape)` with adjusted layout
- Timer font uses `clamp()` for responsive sizing

### Mobile-specific
- ProgressRing uses `react-native-svg` (`Svg`, `Circle` components)
- Landscape mode via `expo-screen-orientation` (future)
- Timer font uses fixed pt sizes since viewport units aren't available in RN
