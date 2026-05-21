---
name: testing-pokemon-guide
description: Test the Pokémon guide app offline/page reliability flows end-to-end. Use when verifying routes, fallback data, search, offline download wiring, or local-only tools.
---

# Pokémon Guide Offline/Page Reliability Testing

## Devin Secrets Needed

- None for fallback/offline reliability testing.
- If testing live Supabase sync, use the repo's configured Supabase environment variables if available; do not require them for fallback tests.

## Setup

1. Install dependencies with `~/.bun/bin/bun install` if needed.
2. Start the app with `~/.bun/bin/bun run dev -- --host 0.0.0.0 --port 8080` from the repo root.
3. Use Chrome CDP at `http://localhost:29229` with Playwright for repeatable browser checks.
4. For offline fallback testing, clear IndexedDB, Cache Storage, and relevant localStorage keys before assertions.
5. Block external requests while allowing `localhost` so Vite/TanStack app assets load but Supabase/PokeAPI/network data does not mask fallback issues.

## Core Assertions

- `bun run lint` and `bun run build` should exit 0.
- Data-store fallbacks should return non-empty records for Pokémon, moves, items, locations, gyms, NPCs, learnsets, evolution nodes, encounters, gym roster, games, and Pokémon held items.
- Route smoke tests should include `/`, `/pokemon/1`, `/moves`, `/items`, `/items/1`, `/map`, `/gyms`, `/gyms/1`, `/npcs`, `/compare`, `/team-builder`, `/battle`, `/coach`, `/chatgpt`, `/art`, `/story`, `/explore`, `/minigames`, `/settings`, `/admin`, and a not-found route.
- Global search should be tested through the header search dialog, filling `[cmdk-input]` and reading `[cmdk-list]` results for fallback terms such as Grookey, Tackle, Potion, Turffield, and Milo.
- Settings should show Offline Pack and Advanced Downloads; `DOWNLOAD_SECTIONS` should include `pokemon_held_items` under the Items section.
- Browser-offline mode should disable or clearly warn on download controls instead of hanging.

## Useful Interaction Checks

- Team Builder: add a fallback Pokémon such as Grookey.
- Adventure Story: verify no raw translation keys like `story.*` are visible, then start an offline story and choose a continuation option.
- Compare: select two fallback Pokémon and save a comparison preset locally. Test this both with no Supabase config and with remote requests blocked, because the app may have Supabase config but no usable network.

## Reporting

- Capture full-page screenshots for Pokédex fallback, Pokémon detail, Settings offline pack, and at least one tool flow.
- Include any non-blocking console warnings separately from failed assertions.
- If a long full-suite rerun hangs in the harness after unrelated fixes, run targeted reruns for the changed flows and say exactly what was retested.
