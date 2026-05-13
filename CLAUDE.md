# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**NeoCab** is a professional arcade cabinet operating system. It's a cross-platform Tauri + React + Rust application that powers arcade machines with:
- **300+ emulators** (MAME, PSX, N64, SNES, Genesis, etc.)
- **Coin & timer system** for commercial operation
- **Operator panel** with PIN security & statistics
- **Universal input system** (any joystick/gamepad)
- **Autoboot kiosk mode** for turnkey operation
- **Multiple visual themes**

**Duration:** 16 weeks | **Scope:** 80-120 hours | **Status:** Week 1 in progress

## Technology Stack

- **Frontend**: React 19.1.0 + TypeScript 5.8.3
- **Bundler**: Vite 7.0.4
- **Desktop Framework**: Tauri 2.x
- **Backend**: Rust (Cargo)
- **Input System**: SDL2 + GilRs (for joysticks/gamepads)
- **Database**: SQLite (10 tables)
- **Dev Server**: Port 1420 (HMR on 1421)

## Project Structure (Target)

```
neocab/
├── docs/                      - All documentation (18+ .md files)
├── src/                       - React frontend (TypeScript)
│   ├── components/
│   ├── pages/
│   ├── hooks/
│   ├── types/
│   ├── utils/
│   └── assets/
├── src-tauri/                 - Rust backend
│   ├── src/
│   │   ├── commands/          - Tauri IPC commands
│   │   ├── core/              - Core logic (GameLibrary, Emulator, Coin, Timer)
│   │   ├── adapters/          - Emulator implementations
│   │   ├── input/             - SDL2 + GilRs input system
│   │   ├── models/            - Data types & structs
│   │   ├── db/                - SQLite + migrations
│   │   └── utils/
│   ├── Cargo.toml
│   └── tests/
├── config/                    - YAML config files
├── public/                    - Static assets
├── package.json
├── tsconfig.json
└── vite.config.ts
```

## Development Commands

### Tauri Development
```bash
npm run dev              # Vite dev server on :1420
npm tauri dev           # Full Tauri with Rust auto-reload + Vite HMR
npm run build           # TypeScript check + Vite build
npm tauri build         # Build production desktop app (MSI/exe/deb/AppImage)
```

### Testing
```bash
cargo test              # Rust tests
npm test                # Frontend tests (when configured)
```

## Architecture Overview

### Frontend-Backend Communication
- React invokes Rust commands via `@tauri-apps/api/core` `invoke()`
- Example: `const games = await invoke("list_games", { system: "mame" })`
- Commands defined in `src-tauri/src/commands/*.rs`

### Core Modules (Implement by week)

| Week | Module | Purpose |
|------|--------|---------|
| 1-2  | Models + DB | SQLite schema, Rust types, migrations |
| 3    | Config Manager | YAML parsing, hot-reload |
| 4    | Game Library Scanner | Discover ROMs, index games |
| 5    | MAME Adapter | First emulator integration |
| 6    | Coin Manager | Money detection, balance tracking |
| 7    | UI (Main Menu) | React navigation skeleton |
| 8    | Timer Manager | Game timer + overlay |
| 9    | RetroArch Multi-emu | Multi-emulator support |
| 10   | Input Manager | SDL2 + GilRs, universal mapping |
| 11   | Operator Panel | PIN, statistics, earnings |
| 12   | Autoboot + Kiosk | Windows/Linux startup mode |
| 13-14| More Emulators | PSX, N64, GBC, etc. |
| 15   | Testing | Stability & edge cases |
| 16   | Release v1.0 | Build, deploy, documentation |

### TypeScript Configuration
- Target: ES2020, Strict mode ON
- No unused locals/parameters allowed
- React JSX: react-jsx

### Key Rust Patterns
- Traits for emulator adapters (enable 300+ emulators)
- SQLite with sqlx for type-safe queries
- Tauri commands for IPC (React ↔ Rust)
- SDL2 for input handling

## Documentation Structure

Read in order by your situation:

**Beginner (4-6 hours):**
1. `INDEX_MAESTRO.md` - Full navigation guide
2. `00_README_MAESTRO.md` - Executive summary
3. `01_PLAN_MAESTRO_PARTE_1.md` - Vision + Stack + Installation
4. `02_PLAN_MAESTRO_PARTE_2.md` - Architecture + Database schema

**Week-by-week Implementation:**
- `03_PLAN_MAESTRO_PARTE_3.md` - Weeks 1-2 detailed (setup + database)
- `05_CRONOGRAMA_DIA_POR_DIA.md` - Weeks 3-16 day-by-day

**Reference (as needed):**
- `04_PLAN_MAESTRO_PARTE_4.md` - Real module code (copy/adapt)
- `06_EMULADORES_EXHAUSTIVO.md` - All 300+ emulators (add new ones)
- `07_CONFIGURACION_CONTROLES.md` - Input mapping (Xbox, PS4, Arcade sticks)
- `08_CHECKLIST_FINAL.md` - Troubleshooting + QA checklist
- `09_TRABAJANDO_CON_IA.md` - How to develop with Claude/ChatGPT
- `10_HARDWARE_FISICO.md` - Cabinet hardware, components, wiring
- `11_OPERACIONES.md` - Business model, pricing, operator features
- `12_TEMPLATE_PROMPTS.md` - Ready-to-use AI prompts

## Status & Progress

**Current:** Week 1 (Setup + Tauri initialization)  
**Completed:** Tools installed, docs written, GitHub repo, Tauri init, npm install  
**Next:** Verify `npm tauri dev`, create folder structure, configure Cargo.toml

**Track progress in:** `docs/STATUS.md` + `docs/TAREAS.md`

## Common Workflows

### Adding an Emulator (e.g., PS1)
1. Check `06_EMULADORES_EXHAUSTIVO.md` for emulator specs
2. Copy template from `04_PLAN_MAESTRO_PARTE_4.md`
3. Create `src-tauri/src/adapters/ps1_emulator.rs`
4. Implement trait: `impl EmulatorAdapter for PS1Emulator { ... }`
5. Register in `EmulatorManager`
6. Test: `cargo test` + manual ROM launch
7. Commit: `git commit -m "feat: add PS1 emulator via pcsx-redux"`

### Configuring Input (e.g., Xbox 360)
1. Find device in `07_CONFIGURACION_CONTROLES.md`
2. Copy YAML mapping section
3. Save to `config/inputs/xbox360.yaml`
4. Test with input wizard UI (Week 10+)

### Debugging Compilation Issues
→ Check `08_CHECKLIST_FINAL.md` Troubleshooting section

## Commit Convention

Follow `conventional-commits`:
```
feat: add MAME emulator adapter
fix: resolve SQLite migration error
docs: update input configuration docs
test: add game scanner tests
```

## Weekly Checklist

After each week:
1. Update `docs/STATUS.md` with completions
2. Make commit for week's work
3. Run `cargo test` + `npm run build`
4. Check next week's tasks in `docs/TAREAS.md`

## graphify

This project has a knowledge graph at graphify-out/ with god nodes, community structure, and cross-file relationships.

Rules:
- ALWAYS read graphify-out/GRAPH_REPORT.md before reading any source files, running grep/glob searches, or answering codebase questions. The graph is your primary map of the codebase.
- IF graphify-out/wiki/index.md EXISTS, navigate it instead of reading raw files
- For cross-module "how does X relate to Y" questions, prefer `graphify query "<question>"`, `graphify path "<A>" "<B>"`, or `graphify explain "<concept>"` over grep — these traverse the graph's EXTRACTED + INFERRED edges instead of scanning files
- After modifying code, run `graphify update .` to keep the graph current (AST-only, no API cost).
