# Division 2 Item Database — Implementation Guide

## D. Recommended Implementation Order

---

### PHASE 1 — Foundation (do this first, nothing else)

**Goal:** Get the data model right before touching UI.

1. Create `items.json` with real data for the 29 existing builds
   - All weapons currently referenced in builds
   - All gear sets referenced in builds
   - All talents referenced in builds
   - All exotics referenced in builds

2. Migrate existing BUILDS array in HTML to reference IDs
   - Each gear slot gets `itemId` pointing to items.json
   - Each weapon gets `weaponId` pointing to items.json
   - Each talent gets `talentId` pointing to items.json

3. Write a build resolver function:
   ```js
   function resolveBuild(build, itemDb) {
     // Takes a build with IDs, returns a build with full item data merged in
     // Used everywhere: cards, detail pages, editor, inspector
   }
   ```

4. Validate that all 29 builds resolve correctly against the item database.

**Deliverable:** A standalone `items.json` file + updated BUILDS array with IDs + a working resolver.

---

### PHASE 2 — Editor Integration

**Goal:** Make Create Build reference items from the database instead of free text.

1. Build a weapon picker component:
   - Search by name
   - Filter by family (AR/LMG/SMG etc.)
   - On selection: auto-populate core1, core2, locked talent, mod slots

2. Build a gear slot picker component:
   - Search by name
   - Filter by gear set, brand, rarity
   - On selection: auto-populate brand, gearSet, rarity

3. Talent auto-population:
   - When a gear set is selected for chest/backpack: show the set's talent as default
   - Allow override for non-set pieces

4. Core balance auto-calculation:
   - Count red/blue/yellow from gear slot core attributes
   - Display live as user fills slots

**Deliverable:** Editor that writes valid ID-referenced builds.

---

### PHASE 3 — Detail Page Enhancement

**Goal:** Build detail pages that pull live data from item database.

1. Gear slot display: show item name + brand bonus context
   - If 2+ pieces of same brand: show brand bonus unlocked
   - If 4pc gear set: show set bonus unlocked with highlight

2. Weapon display:
   - Pull weapon stats from items.json
   - Show talent description from talents
   - Show locked vs rollable status

3. Set bonus calculator:
   - Count gear set pieces in build
   - Show which bonuses are active (2pc / 3pc / 4pc)

**Deliverable:** Detail pages that show gear set synergies automatically.

---

### PHASE 4 — Explorer (later, Spår B)

1. Weapon list page: read from weapons array in items.json
2. Gear set page: read from gearSets array
3. "Builds using this item": reverse index — for each item ID, which builds reference it

**This requires no new data — just UI over existing items.json**

---

## How sourceType affects the system

```
sourceType: 'curated'
  - Author is a verified creator
  - All item IDs are validated against items.json
  - drop locations are confirmed accurate
  - No AI metadata

sourceType: 'ai-generated'  
  - Always show "AI Generated" badge — never removable
  - aiMetadata.qualityLabel starts as 'unreviewed'
  - Cannot be promoted to 'meta-confirmed' without human review
  - All generated item references must be validated against items.json
  - If an AI references an item not in the database: flag it, don't silently create

sourceType: 'user'
  - Show "Community" badge
  - Item IDs validated against items.json
  - Free text fallback allowed where item not found in DB (with warning)
  - Rating starts at 0, not shown until 10+ saves

sourceType: 'imported'
  - Same as 'user' but with import source noted
  - All IDs re-validated against current items.json on import
```

---

## Minimum viable vs future fields

### Launch (Spår A) — required fields only

```json
Build: id, slug, buildName, shortSummary, specialization, playstyle,
       difficulty, activityType, patchVersion, sourceType, author,
       creatorVerified, tags, gear (6 slots), weapons (primary + secondary),
       skills, coreBalance, howToPlay, strengths, weaknesses, substitutions

GearSlot: itemId, itemName, brand, rarity, core, attr1, attr2, mod, talentId

WeaponEntry: weaponId, weaponName, talentId, attribute3, mods, setupSteps, drops

Weapon: id, name, family, rarity, core1, core2, attr3Default, talentId,
        talentLocked, modSlots, primaryDrop

Talent: id, name, description, category, isLocked

GearSet: id, name, bonus4pc, chestTalentId, backpackTalentId, identity

Exotic: id, name, slot, uniqueEffect, primaryAcquisition
```

### Future (Spår B/C) — add when needed

```
Weapon: rpm, magSize, baseDamage, metaTier, compatibleTalentIds
GearSet: activities, commonCombinations, patchStatus
Build: analysis{}, aiMetadata{}, changelog[], relatedBuildIds
Talent: synergyNotes, bestUseCases, triggerCondition
```

---

## Key relationships diagram

```
Build
  ├── gear.mask.itemId         → exotics.id / items.id
  ├── gear.chest.talentId      → chestTalents.id
  ├── gear.backpack.talentId   → backpackTalents.id
  ├── gear.*.gearSetId         → gearSets.id
  ├── weapons.primary.weaponId → weapons.id
  ├── weapons.primary.talentId → weaponTalents.id
  ├── skills.skill1.skillId    → skills.id
  └── skills.skill2.skillId    → skills.id

GearSet
  ├── chestTalentId            → chestTalents.id
  └── backpackTalentId         → backpackTalents.id

Weapon
  └── talentId                 → weaponTalents.id

Exotic
  └── talentId                 → chestTalents / backpackTalents / weaponTalents
```

---

## Content policies for build labels

| Label | Requirements |
|---|---|
| **Curated** | Written by verified creator, all items ID-validated, drop locations confirmed, tested in current patch |
| **AI Generated** | Badge always visible, items validated against DB, no rating until reviewed |
| **Community** | User-submitted, items validated, rating only after 10+ saves |
| **Verified** | Human reviewer has tested the build in current patch and confirmed it works |
| **Outdated** | Patch version is 2+ seasons old, no confirmed update |

**Rules:**
- Never show an AI build without the "AI Generated" badge
- Never promote an AI build to "Verified" without human testing
- Never show patch version as "current" unless updatedAt is within 90 days
- If an item in a build no longer exists in the current game, flag the build as "Needs Update"
