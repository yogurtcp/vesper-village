# Vesper handover — expanded village / room scenes

Vesper is separate from Frostline. Work only in this repository for vampire-game requests.

- Public game: https://vesper-village.yogurt-co.chatgpt.site
- Public repository: https://github.com/yogurtcp/vesper-village
- Sites project: `appgprj_6ae87784beac8191b17762f77bf29c65`.
- Public audience is explicitly user-authorized; preserve it. Use `save_site_version` + `deploy_site_version`, not private deployment calls.
- Commit subjects start `[muse]`. Local GitHub remote uses HTTPS; use the existing `gh auth git-credential` helper for pushes without changing global credential settings.
- Read README for current controls, rules, architecture, authoring and validation commands.

## Current request / implementation

The user asked for generated detailed pixel art, a bigger continuous street world, each room as a separate screen, and unseen people simulated without updating everyone continuously. The outdoor map is now 3072 × 2304; 12 buildings have 48 individual room spaces. Generated source artwork and prompts are in `design`; small runtime PNGs and the art manifest are committed. Do not regress to procedural rectangular houses or continuous cutaway interiors.

The event queue is authoritative for distant residents. `position` derives a point along a stored travel plan without stepping the resident. `refreshActive` materializes nearby / current-room people. `setGoal` uses the room portal graph and collision-safe paths; `arrive` performs actual space transitions. Always clear obsolete portals with `clearRoute` when stopping travel. Different spaces must not see, bite, shoot or gossip through one another.

All original vampire rules remain: five-second bites convert humans; NPC vampires also convert victims; permanent player identification; reporting witnesses; diluted rumors; lethal guards; normal 100→20 blood drain over 24 game hours, and 1.5× sunlight drain below 50. NPC vampires start at 72 and hunt below 58. No conversion cap was introduced.

## Save compatibility

Retain the `vesper-village-save-v1` storage key and format-1 migration. Format 2 adds `space`, planned movement, event times and lazy blood times. Version-1 backup is retained before migration. Preserve converted / dead residents, knowledge, rumors, health, exposure and active feeding. Do not erase a village to simplify an upgrade. `fixtures/legacy-save-v1.json` exercises migration, including an in-progress bite.

## Install / updates

All generated runtime art is hashed into the build and precached. Every referenced asset must exist. `boot.js` checks once at online startup and does not reload an active run. Do not add update polling or checks on focus / reconnect. Run `python3 build.py` before packaging; keep generated copies consistent.

## Scope limits

The town is not a complete life simulator. Rooms reuse generated themes, routines are simple, fear is town-wide, and unseen witnessing is probabilistic. Room windows currently do not expose actors in another scene. No locks, CCTV, inventories, detailed investigations or population replenishment are implemented. The food chain can still exhaust a town over multiple days; balance remains experimental.
