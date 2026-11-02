# Vesper — A Village After Dark

A pixel-art vampire village with a continuous outdoor world, individual room scenes, and persistent people whose unseen lives run on scheduled events.

**Play:** https://vesper-village.yogurt-co.chatgpt.site

**Public source:** https://github.com/yogurtcp/vesper-village

MIT licensed. No account is required to play. Saved villages stay in the visitor's browser; there is no shared player database. Frostline is a separate, unchanged project.

## Playing

Move with WASD / arrows. Hold Shift to run. Hold E near a human for five uninterrupted seconds to feed and convert them. Releasing or moving interrupts the bite, leaving a witness. Release E before starting a second bite.

Walk toward a building's front door to enter. Each room is a separate screen. Walk into a named doorway to switch rooms or return to the street. NPCs and guards use the same connected doors.

J opens the village journal, including individual suspicion, rumor sources, and a town chronicle of distant events. M opens the expanded street map. The journal and map pause the game. Time ×1 / ×4 / ×12 accelerates the whole simulation for observation. Phone controls provide a virtual stick and hold-to-bite / run buttons.

## Town and art

Bellwether has a 3072 × 2304 continuous outdoor map, roughly four times the original prototype's area. Branching streets, uneven building frontages, a market square, riverside path, gardens, trees, benches and warm night lighting surround twelve enterable buildings:

- Lantern Inn, Juniper Coffee, Post Office, Watch House.
- Village School, Market Hall, Moonberry Froyo, Little Cloud Labs.
- Rowan House, Willow House, St. Agnes Clinic, Early Bird Bakery.

Every building has four persistent room identities: 48 separate room scenes. Generated background themes furnish public rooms, parlors, kitchens, offices, bedrooms, storerooms, classrooms, clinics, market rooms and a distinct froyo shop. Themes are reused where appropriate; this is not 48 separately generated images. Furniture footprints and door approaches have authored collision layouts.

Building facades, room backgrounds, trees, a fountain, grass and cobblestones use generated raster pixel art, baked to small native sizes with restricted palettes and nearest-neighbor rendering. Small animated characters retain their original native pixel rig.

- Runtime artwork: [`dist/assets`](dist/assets).
- Original generated sources: [`design/generated`](design/generated).
- Final prompts and generation mode: [`design/prompts.json`](design/prompts.json).
- Art manifest: [`art-manifest.json`](art-manifest.json).
- Optional authoring bake: `python3 bake_art.py` (requires Pillow). Normal builds use committed PNGs and only Python's standard library.

Actual game views: [village streets](design/previews/village.png), [inn room](design/previews/inn-room.png), [froyo shop](design/previews/froyo.png).

## Vampire rules

- Thirty-six named residents have homes, occupations, schedules, temperaments and close relations. One is initially a hungry vampire.
- At ×1 one game hour lasts one real minute. Blood falls from 100% to 20% over 24 game hours under normal conditions. Below 50%, direct sunlight outside drains blood 1.5× faster. Indoors and building-front shade avoid the extra drain.
- Every completed bite, including an NPC bite, converts its victim and fills the attacker to 100%. New vampires start at 72%, begin seeking prey below 58%, and keep their identities and routines. They are independent competitors.
- Crimson marks are player-only vampire sense. Human suspicion comes from witnessed attacks, reports and diluted rumors. Hearsay does not accumulate into certainty.
- Witnesses flee through rooms and streets to a guard or the Watch House. A report records the remembered room and position. Guards pursue visible identified vampires and otherwise search the last sighting and connected rooms. Silver fire is visibly aimed; three hits kill. Guards can kill competitors too.
- The player's confirmed identity is permanently broadcast. Escaping a patrol does not clear the exposure. The run continues until death, allowing a difficult attempted escape.
- Growing town-wide fear changes evening outings, companionship and sheltering behavior. Room boundaries block vision, feeding, gunfire and direct conversation across scenes.

The player is excluded from all NPC registries and AI movement / scheduling. Loading a save removes accidental NPC routes from the player while retaining position, health, knowledge, exposure and active feeding.

## Unseen simulation

`engine.js` maintains the resident identities independently of rendering.

- The current room, or the visible outdoor neighborhood plus a buffer, uses continuous movement, actual sight checks, interrupted feeding, and aimed guard fire.
- Residents elsewhere have a next scheduled event. A priority queue processes arrivals, decisions, feeding milestones, reports, and occasional social events. There is no per-frame movement or hunger loop over distant residents.
- Distant travel stores a path with its departure time and speed. Position is calculated lazily for the map or when approaching. Doors change the resident's persistent room at the scheduled arrival.
- Distant hunts use coarse local opportunity / witness decisions. Feeding has a midpoint observation check and a five-second completion event. Arriving midway materializes the same attacker, victim and elapsed bite.
- Blood is calculated lazily from elapsed time, with hour boundaries, sunlight, and room changes accounted for. Rumors exchange information periodically among people sharing a location.
- Entering a scene never repopulates it or resets its people. Guards can follow the player across scene boundaries. They do not learn a target's new location simply because the player changed rooms.

Schedules and social behavior remain a first-pass simulation. There are no inventories, detailed lessons, CCTV, telephone interactions, locks, funerals or complete criminal investigations. Rooms share a common logical size, with different artwork and door positions. Silver shots resolve a traced clear shot after aiming; distant outcomes are approximate. There is no wall-clock progression while the app is closed.

## Build, run and check

```sh
python3 build.py
python3 -m http.server 8780 --bind 127.0.0.1 --directory dist
node tests.cjs
```

Open http://127.0.0.1:8780/. No browser framework, package install, backend or external runtime assets are required.

Edit `engine.js`, `renderer.js`, `game.js`, `boot.js` or `index.template.html` in the root, then rebuild. Do not patch only generated JavaScript in `dist`. Styles live in `dist/style.css`. `build.py` validates referenced art files and hashes source, templates, styles, metadata and runtime art for a consistent offline cache.

- `engine.js`: rules, town layout, room graph, event queue and behavior.
- `renderer.js`: generated art integration, scene camera and native character animation.
- `game.js`: controls, journal, map, saves and first-run explanation.
- `boot.js` / `sw.template.js`: installation and startup-only update handling.

## Saved villages and installation

The existing `vesper-village-save-v1` browser key is retained. Save format 2 includes room identities, planned arrivals, blood calculation times, conversions, knowledge, rumors, exposure, health, deaths and active bites. Format-1 saves migrate into the expanded town, preserving the bloodline and ongoing bite. The browser keeps a backup at `vesper-village-save-v1-before-rooms` before migration. Mid-bite reload waits for input to continue or break away.

Install metadata, icons and a discoverable install action are included. The worker caches all generated runtime artwork for offline use. It checks for a published update only at online startup, with no polling, focus or reconnection checks. Active play is never reloaded to apply an update. Browser/OS installation availability varies.

## Validation

Twenty-three engine checks cover hunger / sunlight, feeding and interruption, scene isolation, every doorway, all 48 room routes, distant journeys without per-frame updates, materialization continuity, unseen bites, rumors, reports, guard pursuit across doors, silver deaths, obsolete travel cancellation, save continuity and format-1 migration. Three natural two-day simulations also exercise spreading conversion, reports, rumor chains and guard killings; these are not a guarantee of long-term balance.

Browser checks exercise real movement and feeding keys, building / room entry and reverse exits, the journal, expanded map, mobile controls, saved-room restoration, cached artwork offline, and upgrade from the published original prototype.

The game and repository are public at the owner's request. Keep source commits marked `[muse]`, push to GitHub and synchronize the Sites source before publishing, and preserve public access on future deployments. `.openai/hosting.json` retains the existing Site identity.
