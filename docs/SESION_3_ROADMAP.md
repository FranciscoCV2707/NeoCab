# 🚀 SESIÓN 3 - ROADMAP

**Para:** Próxima sesión  
**Duración estimada:** 2-3 horas  
**Objetivos:** Completar Semana 1 de desarrollo

---

## 📋 CHECKLIST SESIÓN 2 (debería estar 100%)

- [x] Analizar documentación (27 .md files)
- [x] Inicializar Tauri (npm create tauri-app@latest)
- [x] Organizar docs/ carpeta
- [x] Actualizar rutas en documentos
- [ ] **FALTA:** npm install
- [ ] **FALTA:** npm tauri dev (verificación)
- [ ] **FALTA:** Primer commit

---

## 🎯 SESIÓN 3 - PLAN DETALLADO

### Paso 1: Completar npm install (10 min)
```powershell
cd C:\Users\Pako\Desktop\arcade\NeoCab
npm install
# Espera a que termine (puede tardar 5-10 min)
```

### Paso 2: Verificar compilación (5 min)
```powershell
npm tauri dev
# Debería abrir una ventana con la app
# Si funciona: ✅
# Si no: compartir el error
```

### Paso 3: Crear .gitignore mejorado (5 min)

El que viene by default debería estar bien, pero verifica que incluya:
```
node_modules/
target/
dist/
.DS_Store
*.log
.env.local
```

### Paso 4: Primer commit (5 min)
```powershell
git add .
git commit -m "feat: initialize tauri with react and typescript"
```

### Paso 5: Crear estructura de módulos (30 min)

**Backend (Rust):**
```powershell
cd C:\Users\Pako\Desktop\arcade\NeoCab\src-tauri\src

New-Item -ItemType Directory -Force commands
New-Item -ItemType Directory -Force core
New-Item -ItemType Directory -Force adapters
New-Item -ItemType Directory -Force input
New-Item -ItemType Directory -Force models
New-Item -ItemType Directory -Force db
New-Item -ItemType Directory -Force utils
```

**Frontend (React):**
```powershell
cd C:\Users\Pako\Desktop\arcade\NeoCab\src

New-Item -ItemType Directory -Force pages
New-Item -ItemType Directory -Force components
New-Item -ItemType Directory -Force hooks
New-Item -ItemType Directory -Force store
New-Item -ItemType Directory -Force types
New-Item -ItemType Directory -Force assets\fonts
New-Item -ItemType Directory -Force assets\images
```

### Paso 6: Crear mod.rs files (10 min)

Para cada carpeta de Rust, crear archivo mod.rs:
```powershell
# Backend
New-Item -ItemType File C:\Users\Pako\Desktop\arcade\NeoCab\src-tauri\src\commands\mod.rs
New-Item -ItemType File C:\Users\Pako\Desktop\arcade\NeoCab\src-tauri\src\core\mod.rs
New-Item -ItemType File C:\Users\Pako\Desktop\arcade\NeoCab\src-tauri\src\adapters\mod.rs
New-Item -ItemType File C:\Users\Pako\Desktop\arcade\NeoCab\src-tauri\src\input\mod.rs
New-Item -ItemType File C:\Users\Pako\Desktop\arcade\NeoCab\src-tauri\src\models\mod.rs
New-Item -ItemType File C:\Users\Pako\Desktop\arcade\NeoCab\src-tauri\src\db\mod.rs
New-Item -ItemType File C:\Users\Pako\Desktop\arcade\NeoCab\src-tauri\src\utils\mod.rs
```

### Paso 7: Segundo commit (5 min)
```powershell
cd C:\Users\Pako\Desktop\arcade\NeoCab
git add .
git commit -m "feat: add project module structure"
```

---

## 📊 RESULTADO ESPERADO

Estructura de carpetas completa:

```
src-tauri/src/
├── commands/mod.rs      ← Comandos IPC
├── core/mod.rs          ← Lógica central
├── adapters/mod.rs      ← Adaptadores emuladores
├── input/mod.rs         ← Manejo joysticks/controles
├── models/mod.rs        ← Estructuras de datos
├── db/mod.rs            ← Base de datos
└── utils/mod.rs         ← Utilidades

src/
├── pages/               ← Vistas principales
├── components/          ← Componentes React
├── hooks/              ← Custom hooks
├── store/              ← Estado (zustand/redux)
├── types/              ← TypeScript types
└── assets/             ← Imágenes, fuentes
    ├── fonts/
    └── images/
```

---

## 🔍 VERIFICACIÓN FINAL

```powershell
# Desde NeoCab root
ls -Recurse | grep "\.rs$" | wc -l
# Debería haber 7+ archivos .rs (los mod.rs)

git log --oneline
# Debería ver 2 commits (init + structure)
```

---

## 📚 DOCUMENTOS A LEER (PARALELO)

Mientras npm install corre:
1. **02_PLAN_MAESTRO_PARTE_2.md** - Arquitectura completa (1.5h)
2. **06_EMULADORES_EXHAUSTIVO.md** - Qué emuladores soportar (1h)
3. **07_CONFIGURACION_CONTROLES.md** - Sistema de controles (30 min)

---

## ⏭️ SESIÓN 4

Una vez completada Sesión 3:
- [ ] Leer 03_PLAN_MAESTRO_PARTE_3.md (Semana 2)
- [ ] Empezar con `lib.rs` en Rust
- [ ] Crear primera estructura de datos (Config struct)
- [ ] Setup SQLite + schema inicial

---

## 💡 TIPS

- **npm install puede tardar:** No canceles, deja que termine
- **Si falla compilación:** Compartir output completo
- **Git commits pequeños:** Mejor 10 commits que 1 grande
- **Verifica frecuentemente:** `git status` para no perder cambios

---

## 🎯 OBJETIVO SEMANA 1

```
Day 1 (Sesión 2): Init Tauri ✅
Day 2 (Sesión 3): Estructura módulos ← AQUÍ
Day 3-5 (Sesión 4+): Config inicial + DB
```

---

*Sesión 3 - Semana 1 Completación*  
*Actualizado: 2026-05-10*
