// ═══════════════════════════════════════════════════════════════
// THE DIVISION 2 — ITEM DATABASE SCHEMA
// Minimum Viable + Future fields marked clearly
// ═══════════════════════════════════════════════════════════════

// ── SHARED PRIMITIVES ──────────────────────────────────────────

type Rarity = 'high-end' | 'named' | 'gear-set' | 'exotic'
type SpecKey = 'demolitionist' | 'sharpshooter' | 'survivalist' | 'technician' | 'firewall' | 'gunner'
type Playstyle = 'dps' | 'tank' | 'healer' | 'skill' | 'status' | 'hybrid'
type ActivityType = 'solo' | 'group' | 'heroic' | 'legendary' | 'countdown' | 'summit' | 'raid' | 'pvp' | 'dark-zone' | 'farming'
type CoreColor = 'red' | 'blue' | 'yellow'
type WeaponFamily = 'ar' | 'lmg' | 'smg' | 'mmr' | 'shotgun' | 'rifle' | 'pistol'
type SourceType = 'curated' | 'ai-generated' | 'user' | 'imported'
type GearSlotKey = 'mask' | 'chest' | 'backpack' | 'gloves' | 'holster' | 'kneepads'

// ══════════════════════════════════════════════════════════════
// A. MINIMUM VIABLE SCHEMA
// These fields are REQUIRED at launch. Nothing optional here.
// ══════════════════════════════════════════════════════════════

// ── WEAPON ────────────────────────────────────────────────────
interface WeaponMV {
  id: string                // 'ar-st-elmos-engine'
  name: string              // "St. Elmo's Engine"
  family: WeaponFamily      // 'ar'
  rarity: 'high-end' | 'named' | 'exotic'
  isExotic: boolean
  isNamed: boolean

  // Core attributes — these are LOCKED and never change
  core1: string             // "AR Damage"
  core2: string             // "Health Damage"
  // Third attribute is rollable (or reconfigurable for exotics)
  attr3Options: string[]    // ["DMG Out of Cover", "Crit Hit Damage"]
  attr3Default: string      // "DMG Out of Cover" — recommended roll

  // Talent
  talentId: string          // references Talent.id
  talentLocked: boolean     // true = exotic/named, false = high-end rollable

  // Mod slots available
  modSlots: ('magazine' | 'muzzle' | 'optic' | 'underbarrel')[]

  // Drop info — minimum: one source
  primaryDrop: string       // "Targeted Loot: AR in Countdown Heroic"

  // For build display
  shortNote: string         // One sentence explaining how to use it
}

// ── WEAPON TALENT ─────────────────────────────────────────────
interface WeaponTalentMV {
  id: string                // 'talent-actum-est'
  name: string              // "Actum Est"
  description: string       // Full description from game
  isLocked: boolean         // true = only on specific named/exotic
  lockedToWeaponId?: string // if locked, which weapon
  category: 'weapon'
}

// ── CHEST TALENT ──────────────────────────────────────────────
interface ChestTalentMV {
  id: string                // 'talent-press-the-advantage'
  name: string              // "Press the Advantage"
  description: string
  gearSetId?: string        // if it's a gear set talent
  category: 'chest'
}

// ── BACKPACK TALENT ───────────────────────────────────────────
interface BackpackTalentMV {
  id: string                // 'talent-risk-management'
  name: string              // "Risk Management"
  description: string
  gearSetId?: string
  category: 'backpack'
}

// ── GEAR SET ──────────────────────────────────────────────────
interface GearSetMV {
  id: string                // 'set-strikers-battlegear'
  name: string              // "Striker's Battlegear"
  bonus2pc: string          // "+5% Weapon Damage"
  bonus3pc: string          // "+10% Weapon Damage"
  bonus4pc: string          // "Striker's Gamble: +0.65% weapon damage per hit..."
  chestTalentId: string     // references ChestTalent.id
  backpackTalentId: string  // references BackpackTalent.id
  playstyle: Playstyle      // 'dps'
  identity: string          // One sentence: what makes this set unique
}

// ── BRAND SET ─────────────────────────────────────────────────
interface BrandSetMV {
  id: string                // 'brand-contractor'
  name: string              // "Contractor's Gloves"
  bonus1pc: string          // "+10% Weapon Handling"
  bonus2pc: string          // "+10% Weapon Damage"
  bonus3pc: string          // "+10% Headshot Damage"
  identity: string          // "Used for Weapon Damage stacking"
}

// ── EXOTIC ────────────────────────────────────────────────────
interface ExoticMV {
  id: string                // 'exotic-coyotes-mask'
  name: string              // "Coyote's Mask"
  slot: GearSlotKey | WeaponFamily  // 'mask' | 'ar'
  talentId: string          // references a talent
  uniqueEffect: string      // Plain text unique mechanic
  primaryAcquisition: string // "Jefferson Trade Center final boss"
  playstyle: Playstyle[]    // ['dps']
}

// ── SKILL ─────────────────────────────────────────────────────
interface SkillMV {
  id: string                // 'skill-striker-drone'
  name: string              // "Striker Drone"
  parentSkill: string       // "Drone"
  description: string       // What it does
  role: 'offense' | 'defense' | 'support' | 'utility'
}

// ── GEAR SLOT ENTRY (used inside a Build) ─────────────────────
interface GearSlotEntryMV {
  itemId: string            // references Weapon/Exotic/GearSet/BrandSet.id
  itemName: string          // denormalized for display speed
  brand: string             // denormalized
  gearSetId?: string        // if part of a gear set
  rarity: Rarity
  isExotic: boolean
  isNamed: boolean

  // Attributes — these are the actual rolled values
  core: string              // "Weapon Damage (red)"
  attr1: string             // "Crit Hit Chance"
  attr2: string             // "Crit Hit Damage"
  mod?: string              // "Crit Hit Damage mod"

  // Only chest and backpack have talents
  talentId?: string         // references Talent.id

  notes?: string            // optional: why this specific item/roll
}

// ── WEAPON ENTRY (used inside a Build) ────────────────────────
interface WeaponEntryMV {
  weaponId: string          // references Weapon.id
  weaponName: string        // denormalized
  weaponType: string        // denormalized ("Assault Rifle (Exotic)")
  rarity: Rarity

  talentId: string          // references WeaponTalent.id
  talentName: string        // denormalized
  talentIsLocked: boolean

  attribute3: string        // the rolled/reconfigured 3rd attribute
  mods: string              // "Mag: Extra Rounds | Muzzle: Crit Hit Dmg"

  // Setup instructions — critical for usability
  setupSteps: string[]      // ["1. Reconfigure to DMG Out of Cover", "2. Max Core1 via Tinkering"]

  drops: {
    source: string
    rate: 'targeted' | 'campaign' | 'world'
    note: string
  }[]

  notes?: string
}

// ── BUILD (core entity) ───────────────────────────────────────
interface BuildMV {
  id: string                // uuid or timestamp
  slug: string              // 'striker-st-elmos-dps-y7s3'
  buildName: string
  shortSummary: string      // max 160 chars — shown on card
  description: string       // full description for detail page

  // Identity
  specialization: SpecKey
  playstyle: Playstyle
  difficulty: 'challenging' | 'heroic' | 'legendary'
  activityType: ActivityType[]
  patchVersion: string      // 'Y7S3'
  sourceType: SourceType

  // Author
  author: string
  creatorVerified: boolean

  // Stats
  rating: number
  views: number
  saves: number

  // Discoverability
  tags: string[]
  beginnerFriendly: boolean
  soloFriendly: boolean
  groupFriendly: boolean

  // Loadout — all item references
  gear: {
    mask: GearSlotEntryMV
    chest: GearSlotEntryMV
    backpack: GearSlotEntryMV
    gloves: GearSlotEntryMV
    holster: GearSlotEntryMV
    kneepads: GearSlotEntryMV
  }

  weapons: {
    primary: WeaponEntryMV
    secondary: WeaponEntryMV
    sidearm?: WeaponEntryMV
  }

  skills: {
    skill1: { skillId: string; skillName: string; notes?: string }
    skill2: { skillId: string; skillName: string; notes?: string }
  }

  // Core balance — derived but stored explicitly for filtering
  coreBalance: { red: number; blue: number; yellow: number }

  // Gameplay
  howToPlay: string
  strengths: string[]
  weaknesses: string[]
  substitutions: string[]
  tips: string[]

  // Timestamps
  createdAt: string         // ISO8601
  updatedAt: string         // ISO8601
}


// ══════════════════════════════════════════════════════════════
// B. FUTURE SCHEMA ADDITIONS
// Add these when the product moves to Spår B/C
// ══════════════════════════════════════════════════════════════

interface WeaponFuture extends WeaponMV {
  // Game stats
  rpm: number
  magSize: number
  baseDamage: number
  optimalRange: number
  headShotMultiplier: number

  // Relations
  compatibleTalentIds: string[]   // all talents that can roll on this weapon
  namedVariantId?: string         // if this weapon has a named version
  exoticVariantId?: string

  // Meta
  metaTier: 'S' | 'A' | 'B' | 'C' | 'D'
  metaNotes: string
  patchUpdated: string
}

interface GearSetFuture extends GearSetMV {
  // All items belonging to this set
  itemIds: string[]
  activities: ActivityType[]
  patchStatus: 'meta' | 'viable' | 'outdated'
  commonCombinations: string[]    // ["Use 4pc + 2pc Empire State for crit"]
  counterBuilds: string[]
}

interface BuildFuture extends BuildMV {
  // Analysis
  analysis: {
    damageRating: number          // 0-100
    survivabilityRating: number   // 0-100
    utilityRating: number         // 0-100
    groupValueRating: number      // 0-100
    assemblyDifficulty: 'easy' | 'moderate' | 'hard'
    gearScore: number
    optimizationLevel: 'raw' | 'tinkered' | 'optimized'
  }

  // AI metadata (if sourceType === 'ai-generated')
  aiMetadata?: {
    model: string
    generatedAt: string
    confidence: number            // 0-1
    humanReviewed: boolean
    reviewedBy?: string
    reviewedAt?: string
    qualityLabel: 'unreviewed' | 'reviewed' | 'verified' | 'meta-confirmed'
  }

  // Version history
  changelog: {
    patch: string
    changes: string
    updatedAt: string
  }[]

  // Community
  comments: number
  forks: number                   // user-created variants based on this build
  parentBuildId?: string          // if this is a fork
  relatedBuildIds: string[]
}
