# Vesper handover — compact modern town

Vesper is separate from Frostline. Work in this repository for vampire-game requests.

- Public game: https://vesper-village.yogurt-co.chatgpt.site
- Public MIT source: https://github.com/yogurtcp/vesper-village
- Sites project: `appgprj_6ae87784beac8191b17762f77bf29c65`; preserve public access. Use save_site_version → deploy_site_version.
- Commits begin `[muse]`; push exact source to GitHub and Sites, then publish matching packaged dist. Existing GitHub HTTPS remote uses gh auth git-credential.

## Current implementation

The user requested a modern setting, unique rooms and buildings, a smaller simpler town, witnesses reacting to NPC bites, and improved people animation. All are implemented. Bellwether is now 1600×1152, a quarter of the previous map, with 12 individually generated modern facades along two adjacent street rows and one connecting passage. The old winding roads/river/square are replaced.

`town-modern.json` is authoritative for the compact layout, 48 room descriptions, individual furniture collision, and art-specific door endpoints. Each building has four unique room PNGs baked from its four-panel generated atlas. Every painted interior door must match exactly one portal; tests enforce the authored registry. Do not add decorative dead-end doors. Interior link tuples are [roomA, sideA, roomB, sideB, coordinateA, coordinateB]; opposite sides are not assumed. `spawnSide` controls safe player arrival. Foreground south exits are drawn only when real connections exist. Art revisions remove counters/sofas blocking doors.

Generated modern masters/prompts live in design/modern; optional bake is `python3 bake_modern.py`. Runtime uses 67 assets: 12 facades, 48 rooms, 4 character atlases, modern asphalt, retained grass/tree. `bake_art.py` and design/generated are historical. Build hashes town config, all runtime assets and code. Keep root code authoritative and rebuild dist.

Characters use 4-direction/4-phase walk atlases. Distance drives frames, idle is stable, all feet share a baseline. Clothing/skin variants are precomputed once. Sleeping, feeding, victim struggle, police aiming and calling poses are separate. Indoors characters render 1.5× larger for the room camera. Do not regress to alternate left/right flips.

## Feeding, witnesses and simulation

Fresh villages have only the player as a vampire; all 36 NPCs start human. Never seed a competitor. NPC vampires arise from completed bites. Existing saved conversions remain intact. Startup text and the journal count include the player.

Nearby humans hear the victim cry even if facing away, turn toward the attacker and witness through clear line of sight. Nearby sleeping people wake after one second. Separate rooms/walls block identification. Visible encounters are deterministic even before promotion to active residents. Unseen visual-only encounters retain coarse probabilities. Witnesses flee toward police and can make a two-second phone call after three seconds and separation from the attacker; guards/station receive reports immediately. Reporting takes precedence over routines. Held/converted/dead callers cannot finish a call. Both player and NPC bites share this code.

The event queue remains authoritative offscreen. Planned travel is materialized only when needed. Reports receive short scheduled events even during distant travel. Preserve scene isolation, clearRoute on cancelled travel, lazy blood, permanent identification, rumor provenance, five-second conversion and all original blood rules. Current room/nearby neighborhood alone receives continuous movement.

## Saves, install, checks

Storage key stays vesper-village-save-v1. Format 3 migrates formats 1/2 to modern coordinates, replans routes, preserves blood times, health, conversions/deaths, beliefs, exposure and ongoing bites. Browser backups: -before-modern and the previous -before-rooms. Fixtures cover both earlier formats. Mid-bite reload waits for player input.

PWA checks only at online startup, never on timers/focus/reconnection; active play is not reloaded. All runtime art is precached. Preserve offline support and saved work.

Run `python3 build.py` and `node tests.cjs`: 30 behavior checks plus three two-day simulations after a player-created vampire. Browser checks passed actual keyboard doors, released-player autonomy, NPC bite → flee → phone report, mobile layout, all 67 assets offline, and published-v2 → modern-v3 startup upgrade preserving an active bite and beliefs. Current screenshots are in design/previews/modern-*.

Routines remain experimental, population can still be exhausted, there is no detailed inventory/CCTV/investigation system and no simulation while the app is closed.

## Player control regression fix

`changeSpace` used to insert the player into the NPC room index, so `refreshActive` could run vampire AI and route movement on the player after door transitions. The player must never be in `members`, `active` or the NPC event queue. `isNPC` guards AI entry points and update loops; `clearPlayerAI` removes saved NPC travel / intent fields without resetting health, blood, exposure, position or an active bite. Do not remove this separation when changing room transitions. Tests reproduce hungry auto-hunting after entry, stale scheduler / membership entries, and a contaminated save with a legitimate bite in progress.
