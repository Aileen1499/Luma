# LUMA: Product Direction and Implementation Spec
Version 1 · Decisions to review before implementation

## 1. Direction in one page
LUMA is a calm personal system that answers one question every day: **what should I do next?** It turns goals into routines, routines into specific sessions, and sessions into a schedule you can follow without re-planning.

It is a place to *execute* plans, not to store them.

### Principles
- **Fewer decisions.** Today shows one next action and at most three priorities.
- **Plans are suggestions, not contracts.** A missed session is moved or released. It is never punished.
- **Low maintenance.** Schedules are generated from routines. The user never re-creates the same thing in two places.
- **Supportive tone.** No guilt copy, no streak-loss warnings, no leaderboards.
- **Optional extras.** Timer, challenges, journaling, XP and reminders can all be switched off.
- **Blank by default.** A new account contains no content at all (section 5).
- **Private by default.** Every user's data is isolated (section 6).

What LUMA is not: a social app, a chart dashboard, an app blocker (a web app cannot block TikTok or video apps), or an AI coach in version 1.

## 2. The core loop: routine → session → schedule → completion

| Object | What it is | Key fields |
|---|---|---|
| Life area (optional) | A named, colored category | name, color |
| Goal | An outcome the user cares about | title, deadline (optional), milestones, status |
| Routine | A recurring activity group that supports a goal | name, weekly target, schedule mode, status |
| Session template | A reusable type of session inside a routine | name, default minutes, notes, checklist, optional "tiny version" minutes |
| Scheduled session | One dated instance on the calendar | date, start time (optional), minutes, state |
| Completion | The record of what actually happened | status, time, actual minutes, note, "where I stopped" |
| Task | A one-off item outside routines | title, notes, due date (optional), area/goal (optional) |

## 3. Local-First MVP Architecture
In this personal-first MVP, IndexedDB via Dexie.js serves as the robust persistence engine with a clean repository abstraction for future Supabase sync.
- Blank by default: zero seeded rows.
- Full offline capability: PWA manifest + Service Worker.
- Undo Toast: 5-second action window on all completions.
- Reset Today: propose up to 3 to keep, move rest to tomorrow.
- Design tokens: background wash (#F7F1E8 base with lavender #D6CBFA, peach #FBD6BD, mint #C6E6D6), white cards, border rgba(28,26,38,.10), no box-shadows.

