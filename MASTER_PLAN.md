# 📜 MASTER_PLAN.md: Milk & Honey Tales (Godot 4 Edition)

## 🌌 Project Overview & Architectural Vision
*Milk & Honey Tales* (עלילות חלב ודבש) is a real-time, top-down Action RPG inspired by *Hades* and *Pokémon*, set across localized regions of Israel. Built entirely in Godot 4 using strictly typed GDScript, the engine relies on procedural canvas drawing for premium dark fantasy aesthetics, real-time combat mechanics, automatic `Y-Sort` visual depth stacking, and built-in Complex Text Layout (CTL) for flawless, real-time English/Hebrew toggle mechanics. Cloud saves are managed asynchronously via an API synchronization layer connected to Supabase.

---

## 🗺️ Execution Phases

### Phase 1: Core Overworld & Real-Time Movement
Establish the physical playground engine. Set up a top-down node layout where movement is fluid and responsive, featuring interactive environments and dynamic cameras.
- **Deliverables:** `Main.tscn` incorporating region-specific nodes (`CentralDistrict.tscn`, `NegevDesert.tscn`). Smooth character movement utilizing `CharacterBody2D` with velocity, deceleration, and a dash mechanic containing invulnerability frames (i-frames).
- **Validation Constraint:** Active `Y-Sort Enabled` parameters checked on both map containers and player instances to manage visual overlapping correctly. Ground tiles rendered efficiently and culled outside the viewport.

### Phase 2: Bilingual Localization Engine (EN/HE)
Implement Godot's translation file handling rules before laying down advanced menus to ensure UI boundaries scale symmetrically when flipped.
- **Deliverables:** A foundational `localization.csv` schema sheet compiling structural interface keys (e.g., `greeting`, `quest_start`, `health`, `gold`). A custom `LocalizationManager.gd` that parses this CSV and loads localized strings dynamically. Import/configure Hebrew fonts (like *Rubik* or *Heebo*) into themes.
- **Validation Constraint:** Use native `Control` node configurations with BiDi (Bidirectional text layout) tracking so Hebrew sentences render correctly from Right-to-Left without line-wrapping backwards.

### Phase 3: Supabase Storage Integration
Wire up a secure network communication manager to sync positioning arrays and game state progress to your remote cloud database.
- **Deliverables:** An autoloaded singleton service script (`SaveSystem.gd`) that instantiates a Godot `HTTPRequest` node. Formulate clean JSON payload builders mapping data fields to your live Postgres schema: `health`, `gold`, `current_region`, and a JSON dictionary tracking active and completed quest IDs, as well as player inventory.
- **Validation Constraint:** Implement asynchronous saving logic so saving operations commit to the backend/local file on transitions or key checkpoints, avoiding network call spam.

### Phase 4: Enemy Visual Variants & Overworld Spawning
Establish the algorithmic blueprint defining how wild creatures live, spawn, and are categorized.
- **Deliverables:** Dynamic spawning management scripts linked to region maps that spawn enemy variants (Golem, Wraith, Brute) with custom procedurally drawn polygons. Enemies possess health bars, damage number popups, and drop gold on death.

### Phase 5: Action Combat Arena & Boss Encounters
Transition the screen layout smoothly into intense combat scenarios.
- **Deliverables:** Real-time mouse-aimed attack swings with visual arcs, screen shakes on hit, and hit-flash visual effects. Build a quest manager directing players to defeat regional boss threats (e.g., the Bamba Golem) with custom combat arenas.
