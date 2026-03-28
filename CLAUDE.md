# CLAUDE.md — Division 2 Builds Planner

## Project Overview

**DIV2BUILDS** is a Progressive Web App (PWA) for browsing and creating character builds for *The Division 2* (Year 7 Season 3). It is a **single-file, no-build-tool, vanilla JavaScript application** deployed on GitHub Pages.

- Live URL path: `/division2-builds/`
- Theme: Dark tactical UI (orange `#f97316` accent, near-black backgrounds)
- Fonts: Barlow Condensed (headings), Rajdhani (body), Share Tech Mono (labels/monospace)
- Patch version tracked: `Y7S3`

---

## Repository Structure

```
division2-builds/
├── index.html            # The entire application (HTML + CSS + JS, ~3000 lines)
├── division2-builds.html # Alternate/backup copy of the app
├── items.json            # Item database (weapons, talents, gear sets, exotics, skills)
├── build-example.json    # Reference example of a fully ID-referenced build object
├── types.ts              # TypeScript interface definitions (reference only, NOT compiled)
├── implementation-guide.md # Phased implementation roadmap (Spår A/B/C)
├── manifest.json         # PWA manifest
├── sw.js                 # Service worker (cache-first for HTML, network-first otherwise)
├── icon-192.png          # PWA icon
└── icon-512.png          # PWA icon
```

### Key File Notes

- **`index.html`** is the entire application. All styles, JS logic, and data live inline. There is no bundler, no npm, no framework.
- **`items.json`** is the canonical item database. It must be the source of truth for all item IDs.
- **`types.ts`** is documentation — it defines the intended schema but is never imported or compiled. Use it as the contract when writing or editing data.
- **`build-example.json`** shows a complete, valid, fully ID-referenced build. Use it as a template when adding new builds.
- **`division2-builds.html`** mirrors `index.html`; keep both in sync if editing the app.

---

## Application Architecture

### No Build System

There is **no package.json, no bundler, no transpiler**. Everything runs directly in the browser as written. Do not introduce npm packages, ES modules with imports, or build steps without explicit discussion.

### JavaScript Architecture (inside `index.html`)

All JS is vanilla, written in function scope (no `class`, minimal ES6+). Key globals and functions:

| Symbol | Location (approx. line) | Purpose |
|---|---|---|
| `var BUILDS` | ~833 | Main array of all build objects (inline data) |
| `var CREATORS` | ~820 | Creator profiles array |
| `sortBuilds(val, arr)` | ~2135 | Sort builds by rating/views/saves/updated |
| `renderMain()` | ~2173 | Renders the main browse/filter view |
| `renderSaved(main)` | ~2244 | Renders the saved builds page |
| `renderEvents(main)` | ~2251 | Renders the events widget page |
| `renderGuide(main)` | ~2262 | Renders the guide/beginner page |
| `renderCreators(main)` | ~2306 | Renders the creators page |
| `renderEditor()` | ~2508 | Renders the Create Build form |
| `renderEvWidget()` | ~2165 | Renders the sidebar events widget |

### State and Persistence

- **Active view/filters**: stored in JS variables in memory (no URL routing).
- **Saved builds**: persisted to `localStorage` under key `div2-user-builds`.
- **User-created builds**: saved to `localStorage` under `div2-user-builds`.

### PWA / Service Worker

- Cache name: `div2builds-v1` (in `sw.js`). **Increment this version** any time you make changes to `index.html` to bust the cached version.
- Strategy: cache-first for HTML, network-first with cache fallback for everything else.

---

## Data Model

### Build Object (inline in `BUILDS` array)

The inline BUILDS array currently uses a **denormalized** structure — item names and stats are stored directly on the build object as strings, not as references to `items.json`.

```js
// Current inline structure (denormalized)
{
  id: 1,
  season: "current",
  patch: "Y7S3",
  name: "St. Elmo's Striker DPS",
  spec: "demolitionist",
  specLabel: "Demolitionist",
  author: "Kamikazevondoom",
  creatorVerified: false,
  sourceType: 'ai-suggested',  // 'curated' | 'ai-suggested' | 'community'
  rating: 9.6,
  stars: 5,
  views: 28400,
  saves: 1840,
  tags: ["DPS","Solo","Heroic","Legendary"],
  difficulty: "Legendary",
  updated: "6 days ago",
  summary: "...",
  description: "...",
  tips: [...],
  gear: [ { type, icon, name, brand, rarity, talent, mods }, ... ],  // 6 slots
  weapons: { primary: {...}, secondary: {...} },
  skills: [ { name, variant, icon }, ... ],
  talents: [ { name, desc }, ... ]
}
```

### Target Build Schema (ID-referenced, per `types.ts` / `build-example.json`)

The **target** schema (migration goal, Spår A) uses IDs that reference `items.json`. See `build-example.json` for the full structure and `types.ts` for TypeScript interfaces.

### items.json Structure

```json
{
  "_version": "1.0.0",
  "_patch": "Y7S3",
  "weapons": [...],          // WeaponMV objects
  "weaponTalents": [...],    // WeaponTalentMV objects
  "chestTalents": [...],     // ChestTalentMV objects
  "backpackTalents": [...],  // BackpackTalentMV objects
  "gearSets": [...],         // GearSetMV objects
  "brandSets": [...],        // BrandSetMV objects
  "exotics": [...],          // ExoticMV objects
  "skills": [...]            // SkillMV objects
}
```

**ID conventions:**
- Weapons: `{family}-{slug}` → `ar-st-elmos-engine`, `lmg-iron-lung`
- Talents: `talent-{slug}` → `talent-actum-est`, `talent-risk-management`
- Gear sets: `set-{slug}` → `set-strikers-battlegear`
- Exotics: `exotic-{slug}` → `exotic-coyotes-mask`
- Skills: `skill-{slug}` → `skill-striker-drone`

---

## Design System

### CSS Variables (defined in `:root`)

| Variable | Value | Use |
|---|---|---|
| `--bg` | `#0e1117` | Page background |
| `--bg2` | `#141920` | Sidebar, modal backgrounds |
| `--bg3` | `#1a2030` | Input fields, card inner sections |
| `--panel` | `#171d28` | Build cards |
| `--border` | `#222d40` | Subtle borders |
| `--border2` | `#2d3f58` | Prominent borders |
| `--orange` | `#f97316` | Primary accent, active states |
| `--orange2` | `#fb923c` | Hover orange |
| `--blue` | `#38bdf8` | Named items, creator badges |
| `--green` | `#4ade80` | Live events, curated badges |
| `--yellow` | `#fbbf24` | Save/bookmark actions, difficulty |
| `--red` | `#f87171` | Destructive actions, close buttons |
| `--gold` | `#f59e0b` | Exotic items |
| `--text` | `#e8eef8` | Primary text |
| `--text2` | `#9aaec8` | Secondary text |
| `--text3` | `#637a96` | Tertiary/muted text |

### Rarity Colors

| Rarity | Color | CSS class suffix |
|---|---|---|
| Exotic | `--gold` (#f59e0b) | `.exotic` |
| Named | `--blue` (#38bdf8) | `.named` |
| Gear Set | `--orange` (#f97316) | — |
| High-End | `--text` (#e8eef8) | — |

### Source Type Badges

| sourceType | Badge label | Color |
|---|---|---|
| `curated` | CURATED | green |
| `ai-suggested` | AI SUGGESTED | text3 (muted) |
| `community` | COMMUNITY | blue |

**Rule:** Never remove or hide the AI badge from `ai-suggested` builds. Never promote AI builds to "Verified" without human review.

### Typography Classes

- `.font-barlow` — Barlow Condensed (headings, large numbers)
- `.font-mono` — Share Tech Mono (labels, badges, codes)
- `.font-raj` — Rajdhani (body, UI text)
- `letter-spacing` is used heavily for the tactical aesthetic — preserve it.

---

## Content & Data Conventions

### Game Terminology (use exactly as written)

- Specializations: `demolitionist`, `sharpshooter`, `survivalist`, `technician`, `firewall`, `gunner`
- Weapon families: `ar`, `lmg`, `smg`, `mmr`, `shotgun`, `rifle`, `pistol`
- Gear slots: `mask`, `chest`, `backpack`, `gloves`, `holster`, `kneepads`
- Rarities: `high-end`, `named`, `gear-set`, `exotic`
- Core colors: `red` (weapon damage), `blue` (armor/health), `yellow` (skill power)
- Current patch: `Y7S3` (Year 7 Season 3)

### Build Ratings

- Rating scale: 0–10 (one decimal, e.g. `9.4`)
- Stars: 1–5 (derived from rating)
- Do not fabricate view/save counts — use realistic numbers proportional to rating

### Source Type Rules

| sourceType | Badge | Validation | Rating |
|---|---|---|---|
| `curated` | Curated (green) | All item IDs validated, drop locations confirmed | Shown immediately |
| `ai-suggested` | AI Suggested (grey) | Items validated against DB, badge NEVER removable | Hidden until reviewed |
| `community` | Community (blue) | Items validated, free text fallback allowed with warning | Hidden until 10+ saves |

---

## Development Workflow

### Making Changes

Since there is no build step:
1. Edit `index.html` directly (and mirror changes to `division2-builds.html` if applicable).
2. **Bump the service worker cache version** in `sw.js` (`const CACHE = 'div2builds-v2'`) whenever `index.html` changes, or users will see stale content.
3. Test by opening `index.html` in a browser — no server required for most features.

### Adding a New Build

1. Add the build object to the `BUILDS` array in `index.html` (line ~833).
2. Follow the denormalized inline format currently used by other builds.
3. Optionally add a fully ID-referenced version to `build-example.json` format as a reference.
4. Ensure `sourceType` is set correctly and badge logic will apply.
5. If any new items are referenced, add them to `items.json` following existing ID conventions.

### Adding Items to items.json

1. Follow the existing schema for the item type (see `types.ts` for the interface).
2. Use the ID naming convention: `{type}-{kebab-slug}`.
3. Validate that `talentId` references exist in the appropriate talent array.
4. Only include **Minimum Viable fields** (marked in `types.ts`) — future fields are deferred.

### Editing Styles

- All CSS is inline in `<style>` at the top of `index.html`.
- Use existing CSS variables — do not hardcode color hex values.
- Keep the tactical/military aesthetic: sharp corners (2px border-radius max), monospace labels, uppercase text, subtle scan-line overlay.
- The `body::before` pseudo-element provides the CRT scan-line effect — do not remove it.

---

## Implementation Roadmap

See `implementation-guide.md` for the full phased plan. Summary:

| Phase | Goal | Status |
|---|---|---|
| **Spår A — Phase 1** | Build `items.json` with all items from 29 builds, migrate BUILDS array to use IDs, write `resolveBuild()` | In progress |
| **Spår A — Phase 2** | Editor uses item pickers from DB instead of free text | Planned |
| **Spår A — Phase 3** | Detail pages show gear set synergies from DB | Planned |
| **Spår B — Phase 4** | Item explorer pages (weapons list, gear set pages) | Future |
| **Spår C** | AI metadata, version history, community features | Future |

---

## Key Constraints for AI Assistants

1. **No framework, no bundler.** Do not suggest React, Vue, Vite, webpack, or npm. All code must work as plain HTML/JS in a browser.
2. **Single file discipline.** Core app logic lives in `index.html`. Only create separate files when the implementation guide explicitly calls for it (e.g. `items.json`, `sw.js`).
3. **Preserve the aesthetic.** The tactical dark UI with orange accents, monospace labels, and uppercase text is intentional. Do not "clean up" or "modernize" the visual style.
4. **AI build badge is non-negotiable.** Any build with `sourceType: 'ai-suggested'` must always display the AI badge. Never remove it or promote the build automatically.
5. **ID integrity.** When writing data that references other items, always verify the referenced ID exists in `items.json`. Flag missing references rather than silently creating inline data.
6. **Patch accuracy.** Current patch is `Y7S3`. Do not invent game mechanics, talent descriptions, or drop locations — use only confirmed, accurate game data.
7. **Service worker versioning.** Any change to `index.html` requires bumping the cache version in `sw.js`.
8. **Mirror changes.** `division2-builds.html` is a mirror of `index.html` — keep both in sync.
