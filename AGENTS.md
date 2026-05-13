# Repository Guidelines

## Project Structure & Module Organization
This repository is a Tauri desktop app with a React/TypeScript frontend and a Rust backend.

- `src/` contains the UI, hooks, context, and feature components.
- `src-tauri/src/` contains Rust commands, core services, adapters, models, input handling, and database code.
- `public/` stores static assets and GLSL shaders.
- `build-scripts/` contains platform build helpers and installer scripts.
- `docs/` holds design, roadmap, and operational documentation.

Keep feature code close to the layer it belongs to: UI changes in `src/`, IPC and system logic in `src-tauri/src/`.

## Build, Test, and Development Commands

- `npm run dev` starts the Vite frontend for local UI work.
- `npm run tauri dev` runs the full desktop app with Rust and frontend hot reload.
- `npm run build` type-checks TypeScript and builds the web bundle.
- `npm run tauri build` creates the production desktop package.
- `npm run lint` runs ESLint over `src/`.
- `npm run format` formats frontend TypeScript and TSX files with Prettier.
- `cd src-tauri; cargo test` runs Rust tests.

## Coding Style & Naming Conventions
TypeScript uses strict mode with `noUnusedLocals` and `noUnusedParameters` enabled. Prefer clear, component-focused names and keep React files in `PascalCase.tsx` form, such as `GameScreen.tsx` or `SetupWizard.tsx`.

- Use 2-space indentation in frontend files.
- Use `camelCase` for variables, functions, hooks, and Rust modules/functions.
- Use `PascalCase` for React components and Rust types/structs.
- Keep CSS colocated with its component, for example `GameScreen.tsx` and `GameScreen.css`.

For Rust changes, run `cargo fmt` before review.

## Testing Guidelines
There is no large frontend test suite in the repo yet, so verify UI work with `npm run build` and manual app testing through `npm run tauri dev`.

- Name Rust tests by behavior, for example `scan_roms_handles_missing_paths`.
- Add tests near the code they validate when possible.
- If you touch backend logic, run `cargo test`.

## Commit & Pull Request Guidelines
History uses Conventional Commits: `feat:`, `fix:`, `docs:`, and `test:`. Keep commit messages short and scoped, such as `fix: resolve theme loading bug`.

Pull requests should include:

- A short summary of the change and why it was made.
- Screenshots or screen recordings for UI changes.
- Notes about platform-specific behavior, especially Windows and Linux.
- Commands used to verify the change, such as `npm run build` or `cargo test`.

## Agent-Specific Instructions
Prefer small, targeted edits. Avoid changing unrelated docs or generated artifacts unless the task requires it.
