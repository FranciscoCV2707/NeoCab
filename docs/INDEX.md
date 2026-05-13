# NeoCab Documentation Index

**Version:** 1.0.0 | **Last Updated:** 2026-05-12

---

## 🚀 Quick Start

1. **New to the project?** → Read [`INDEX_MAESTRO.md`](INDEX_MAESTRO.md) (full navigation guide)
2. **User/Operator?** → See [User Documentation](#user--operator-documentation)
3. **Developer?** → See [Development Documentation](#development--architecture)
4. **Building installers?** → See [Build & Deployment](#build--deployment)

---

## 👥 User & Operator Documentation

📁 **Location:** Root directory (for distribution)

| Document | Purpose | Audience |
|----------|---------|----------|
| [`INSTALLATION.md`](../INSTALLATION.md) | Setup for all platforms | Users, Operators |
| [`USER_MANUAL.md`](../USER_MANUAL.md) | Daily operation guide | Arcade Operators |
| [`FAQ.md`](../FAQ.md) | 50+ common Q&A | All Users |
| [`BUILD.md`](../BUILD.md) | Developer build guide | Developers |
| [`PERFORMANCE.md`](../PERFORMANCE.md) | Optimization & profiling | Developers, DevOps |
| [`README.md`](../README.md) | Project overview | All |

---

## 🔧 Development & Architecture

📁 **Location:** `docs/` (for developers)

### Navigation & Planning
| Document | Purpose |
|----------|---------|
| [`INDEX_MAESTRO.md`](INDEX_MAESTRO.md) | **Start here** — Full guide to all documentation |
| [`00_README_MAESTRO.md`](00_README_MAESTRO.md) | Executive summary (stack, goals, timeline) |
| [`GUIA_RAPIDA.md`](GUIA_RAPIDA.md) | Quick reference for common tasks |

### Architecture & Planning
| Document | Purpose |
|----------|---------|
| [`01_PLAN_MAESTRO_PARTE_1.md`](01_PLAN_MAESTRO_PARTE_1.md) | Vision, stack, database schema intro |
| [`02_PLAN_MAESTRO_PARTE_2.md`](02_PLAN_MAESTRO_PARTE_2.md) | Full database schema + architecture diagram |
| [`03_PLAN_MAESTRO_PARTE_3.md`](03_PLAN_MAESTRO_PARTE_3.md) | Weeks 1-2 detailed (setup + database) |
| [`04_PLAN_MAESTRO_PARTE_4.md`](04_PLAN_MAESTRO_PARTE_4.md) | Real module code samples (copy/adapt) |

### Schedule & Progress
| Document | Purpose |
|----------|---------|
| [`05_CRONOGRAMA_DIA_POR_DIA.md`](05_CRONOGRAMA_DIA_POR_DIA.md) | Weeks 3-16 day-by-day breakdown |
| [`STATUS.md`](STATUS.md) | Current phase status & what's done |
| [`PROGRESO_ACTUAL.md`](PROGRESO_ACTUAL.md) | Latest session progress |
| [`PHASE6_WEEK1_SHADERS.md`](PHASE6_WEEK1_SHADERS.md) | Phase 6 shader system implementation |

### Platform Support
| Document | Purpose |
|----------|---------|
| [`00B_COMPATIBILIDAD_PLATAFORMAS.md`](00B_COMPATIBILIDAD_PLATAFORMAS.md) | Platform support matrix (Win/Linux/ARM) |
| [`00C_WINDOWS_XP.md`](00C_WINDOWS_XP.md) | Windows XP legacy mode setup |

### Reference Guides
| Document | Purpose |
|----------|---------|
| [`06_EMULADORES_EXHAUSTIVO.md`](06_EMULADORES_EXHAUSTIVO.md) | All 300+ emulators (specs, paths, detection) |
| [`07_CONFIGURACION_CONTROLES.md`](07_CONFIGURACION_CONTROLES.md) | Input mapping (Xbox, PS4, Arcade sticks) |
| [`10_HARDWARE_FISICO.md`](10_HARDWARE_FISICO.md) | Cabinet hardware, GPIO, coin detection |

### Implementation Guides
| Document | Purpose |
|----------|---------|
| [`15_UI_HYPERSPIN_WHEEL.md`](15_UI_HYPERSPIN_WHEEL.md) | HyperSpin wheel UI implementation |
| [`16_JOYTOKEY_INTEGRADO.md`](16_JOYTOKEY_INTEGRADO.md) | Input mapping system (integrated) |
| [`17_SETUP_WIZARD.md`](17_SETUP_WIZARD.md) | First-launch setup flow |
| [`INTEGRATION_COMPLETE.md`](INTEGRATION_COMPLETE.md) | Full feature integration summary |

### Development Practices
| Document | Purpose |
|----------|---------|
| [`08_CHECKLIST_FINAL.md`](08_CHECKLIST_FINAL.md) | QA checklist + troubleshooting |
| [`09_TRABAJANDO_CON_IA.md`](09_TRABAJANDO_CON_IA.md) | How to develop with Claude/ChatGPT |
| [`11_OPERACIONES.md`](11_OPERACIONES.md) | Business model, pricing, operator features |
| [`12_TEMPLATE_PROMPTS.md`](12_TEMPLATE_PROMPTS.md) | Ready-to-use AI prompts for development |

### Session Notes (History)
| Document | Purpose |
|----------|---------|
| [`BIENVENIDA_SESION_2.md`](BIENVENIDA_SESION_2.md) | Session 2 intro |
| [`FASE3_ROADMAP.md`](SESION_3_ROADMAP.md) | Session 3 roadmap |
| [`PHASE4_HARDWARE.md`](PHASE4_HARDWARE.md) | Phase 4 (Hardware) summary |
| [`PHASE5_IMPLEMENTATION_PLAN.md`](PHASE5_IMPLEMENTATION_PLAN.md) | Phase 5 (Customization) plan |

---

## 🏗️ Build & Deployment

📁 **Location:** Root + build-scripts/

| Document | Purpose |
|----------|---------|
| [`BUILD.md`](../BUILD.md) | Full build instructions (all platforms) |
| [`RELEASE_CHECKLIST.md`](../RELEASE_CHECKLIST.md) | Pre-release verification ✅ |
| [`00B_COMPATIBILIDAD_PLATAFORMAS.md`](00B_COMPATIBILIDAD_PLATAFORMAS.md) | Platform matrix & build targets |
| [`ROADMAP.md`](../ROADMAP.md) | Feature roadmap (v1.0 → v2.0) |

---

## 📊 Status & Progress

| Document | Location | Purpose |
|----------|----------|---------|
| [`STATUS.md`](STATUS.md) | docs/ | Current implementation status |
| [`STATUS.md`](../STATUS.md) | root/ | Release readiness |
| [`PROGRESO_v1.0.md`](../PROGRESO_v1.0.md) | root/ | Session progress tracker |
| [`SIGUIENTE_SESION.md`](../SIGUIENTE_SESION.md) | root/ | What to do next |

---

## 🔍 How to Navigate

### I want to...

**Understand the project quickly:**
→ [`00_README_MAESTRO.md`](00_README_MAESTRO.md) → [`GUIA_RAPIDA.md`](GUIA_RAPIDA.md)

**Set up my environment:**
→ [`01_PLAN_MAESTRO_PARTE_1.md`](01_PLAN_MAESTRO_PARTE_1.md) (Stack section)

**See the full database schema:**
→ [`02_PLAN_MAESTRO_PARTE_2.md`](02_PLAN_MAESTRO_PARTE_2.md) (Database section)

**Implement a feature (e.g., add a new emulator):**
→ [`06_EMULADORES_EXHAUSTIVO.md`](06_EMULADORES_EXHAUSTIVO.md) + [`04_PLAN_MAESTRO_PARTE_4.md`](04_PLAN_MAESTRO_PARTE_4.md) (code samples)

**Configure input mapping (controller setup):**
→ [`07_CONFIGURACION_CONTROLES.md`](07_CONFIGURACION_CONTROLES.md)

**Build for Windows/Linux/ARM:**
→ [`BUILD.md`](../BUILD.md)

**Deploy to arcade cabinets:**
→ [`INSTALLATION.md`](../INSTALLATION.md) + [`USER_MANUAL.md`](../USER_MANUAL.md)

**Check what's done vs what's missing:**
→ [`STATUS.md`](STATUS.md) or [`RELEASE_CHECKLIST.md`](../RELEASE_CHECKLIST.md)

**See current phase progress:**
→ [`PROGRESO_ACTUAL.md`](PROGRESO_ACTUAL.md)

---

## 📋 File Organization

### Root Directory (Distribution)
**Purpose:** User-facing, release-ready documentation

```
/
├── INSTALLATION.md        # User installation guide
├── USER_MANUAL.md         # Operator manual
├── FAQ.md                 # FAQs (50+ Q&A)
├── BUILD.md               # Developer build guide
├── PERFORMANCE.md         # Performance & optimization
├── RELEASE_CHECKLIST.md   # Release verification
├── STATUS.md              # Current status
├── ROADMAP.md             # Feature roadmap
└── ...
```

### `/docs/` Directory (Development)
**Purpose:** Development planning, architecture, implementation guides

```
docs/
├── INDEX_MAESTRO.md              # Main navigation (all docs)
├── 00_README_MAESTRO.md          # Executive summary
├── 01-04_PLAN_MAESTRO_*.md       # Architecture + planning
├── 05_CRONOGRAMA_DIA_POR_DIA.md  # Schedule (weeks 3-16)
├── 06-12_*.md                    # Reference guides
├── 15-17_*.md                    # Implementation guides
├── PHASE*.md                     # Phase summaries
├── STATUS.md                     # Technical status
└── ...
```

---

## 🎯 Next Steps

1. ✅ **Read:** [`INDEX_MAESTRO.md`](INDEX_MAESTRO.md) for full overview
2. ✅ **Check:** [`STATUS.md`](STATUS.md) for current progress
3. ✅ **Plan:** Use [`05_CRONOGRAMA_DIA_POR_DIA.md`](05_CRONOGRAMA_DIA_POR_DIA.md) for your next session
4. ✅ **Build:** Follow [`BUILD.md`](../BUILD.md) to set up your environment

---

**Last Updated:** 2026-05-12 | **Maintainer:** Francisco Caballero
