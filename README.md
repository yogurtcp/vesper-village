# Vesper — A Village After Dark

A separate, dependency-free pixel-art vampire-town prototype. Frostline is unchanged.

Move with WASD / arrows, hold Shift to run, and hold E for five uninterrupted seconds near a human to feed and turn them. J opens the persistent resident journal; M shows the street map. Phone controls provide a stick and hold-to-bite / run buttons. The journal and map pause time. The Time button cycles the entire simulation through ×1, ×4 and ×12 for testing.

## Implemented

- Twelve enterable buildings, each with four connected rooms: inn, coffee shop, post office, guard station, school, market, froyo shop, tech office, two residential houses, clinic and bakery. Walk through their south-side doors to reveal the interiors.
- Thirty-six named residents, including three guards and one initially hungry rival vampire. Home/work schedules, midday coffee trips, nighttime sleep, temperaments, relationships and individual knowledge persist.
- Continuous day/night clock. At ×1 one game hour lasts one real minute. Blood drains 80 percentage points per 24 game hours. Below 50%, direct sunlight outside drains blood 1.5× faster. Interior and building-front shade avoid the extra drain.
- All completed bites, including NPC bites, fill the attacker to 100% and convert the victim. New vampires start at 72% and begin hunting below 58%; they retain their identity, workplace, home and temperament. This starting reserve is a first-pass balance choice to avoid an immediate chain reaction.
- Five-second feeding immobilizes both actors. Moving or releasing stops it; a surviving victim remembers the attack and reports it. A fresh release is required before beginning another player bite. Guards can be bitten too.
- Sight depends on walls, windows, facing, distance and light. Windows allow observation and silver gunfire but not feeding through the wall. Sleeping people do not witness bites.
- Witnesses physically flee to a guard or the Watch House. Reports carry the remembered sighting, not a target's magically updated position. Guards pursue visible identified vampires, aim visibly, shoot lethal silver, and otherwise search the last sighting. Three hits kill. They can kill rival vampires as well as the player.
- Confirmed discovery of the player is permanent and publicly broadcast. Escaping a patrol leaves the identity exposed. The run continues until death so an exposed player can attempt a difficult escape.
- Rumors spread between nearby humans, retaining the source and diluted confidence. Repeated hearsay does not accumulate into certainty. Readers can inspect each resident's beliefs and the rumor trail in the journal.
- Growing fear changes nighttime companionship and causes nonessential workers to shelter at home. Fear is currently town-wide; location-specific fear is a future refinement.
- Crimson vampire marks are explicitly player-only blood sense, unrelated to human suspicion. Map and journal intentionally expose simulation state for this first test.
- Distant actors update at 1.25-second intervals, make decisions less frequently, and use approximate witnessing probabilities. Nearby actors use continuous movement and actual sight. Viewport size expands the continuously simulated radius. No NPC is recreated when leaving the camera.
- Device-local saves include conversions, blood, health, routes, knowledge, rumors, wanted identities, deaths, and active bite progress. Mid-bite reload waits for input to continue or break away.
- Install metadata/icons, discoverable installation instructions, offline assets, and one online-startup service-worker update check. No polling, focus or reconnection checks. An active run is never reloaded for an update.

## Build and run

```sh
python3 build.py
python3 -m http.server 8780 --bind 127.0.0.1 --directory dist
node tests.cjs
```

Open http://127.0.0.1:8780/. No dependencies or network resources are needed by the game. Original canvas pixel art is code-native. `build.py` hashes source, template, styles, manifest and icons to version the offline cache and script URLs. Edit the JavaScript in the repository root, then rebuild; do not fix only generated copies in `dist`.

Tuning is in `engine.js`: `RULES`, building definitions, and `decide` / `routine`. `renderer.js` owns the art and camera; `game.js` owns input, journal, map and saves. Saves use `vesper-village-save-v1` and are separate from Frostline.

## First-pass limits

This is a behavioral prototype, not a finished life simulator. The twelve buildings share a basic four-room layout, with different labels, furniture, jobs, schedules and opportunities. There are no shopping inventories, quests, school lessons, working CCTV, telephone interactions, doors with keys, funerals, or detailed criminal investigations. Character relationships currently support companionship rather than a full social simulation. Silver shots resolve a traced clear shot after aiming, rather than simulated projectile travel. Distant encounters are approximate; visible encounters use the same persistent participants. No offline wall-clock progression occurs while the app is closed.

## Validation

Fourteen engine checks cover hunger and sunlight, conversion, interruption, window contact, reporting / last sightings, diluted rumors, NPC conversion, silver deaths, cover, all 48 accessible rooms, schedules, save continuity and distant updates. A deterministic 24-hour unforced run produces conversions, reports, rumors and a guard killing. One sample is not a long-term balance guarantee.

Isolated browser checks cover an actual five-second E-key bite, save/reload of conversion / suspicion / health / exposure, journal and resident inspection, street map, offline saved startup, mobile touch layout and runtime errors. Startup upgrade is checked with a previous cache version and persistent village data.

Published using the Sites skill; `.openai/hosting.json` retains the private Site identity. Keep source commits marked `[muse]`. Do not change the audience without a user request.
