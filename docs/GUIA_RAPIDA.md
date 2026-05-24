# GUIA RAPIDA - NEOCAB

**Actualizado:** 2026-05-21  
**Versión:** v1.4.0 (estable)  
**Para:** Comenzar a desarrollar / contribuir al proyecto

> **El proyecto está completo.** Esta guía es para nuevos colaboradores que quieren compilar y ejecutar NeoCab localmente.

---

## 🎯 EN ESTE DOCUMENTO

Una guía **super concisa** para comenzar ahora, sin leer todo.

---

## ✅ VERIFICACIONES RÁPIDAS

Tu máquina ya tiene TODO:

```bash
# Windows PowerShell - verifica
git --version           # 2.53.0 ✅
rustc --version        # 1.95.0 ✅
cargo --version        # 1.95.0 ✅
node --version         # v20.20.2 ✅
npm --version          # 10.8.2 ✅
cmake --version        # 4.3.1 ✅
cargo tauri --version  # 2.11.1 ✅
```

**Si alguno no está:** Instálalo desde doc 01_PLAN_MAESTRO_PARTE_1.md

---

## 🚀 3 PASOS PARA EMPEZAR

### PASO 1: Crear Repositorio GitHub (5 min)

1. Ve a https://github.com/new
2. **Name:** `neocab`
3. **Description:** `Modern arcade cabinet - Universal emulator launcher`
4. **Public** ✅
5. **Add .gitignore:** Rust
6. **License:** GPL-3.0
7. Click "Create repository"

### PASO 2: Clonar Localmente (2 min)

```bash
# Windows PowerShell
cd C:\Dev
git clone https://github.com/TU-USUARIO/neocab.git
cd neocab
```

Cambiar `TU-USUARIO` por tu usuario de GitHub.

### PASO 3: Inicializar Tauri (15 min)

```bash
# En la carpeta neocab/
# Crear estructura Tauri
cargo create-tauri-app --directory .

# Cuando pregunte, dejar defaults o:
# - Frontend: React
# - Ty: TypeScript
# - Package manager: npm
```

**Si dice error "directory not empty":**
```bash
# Primero limpiar (dejar solo .git)
rm -r .github src src-tauri package.json vite.config.ts tsconfig.json -Force

# Luego repetir cargo create-tauri-app --directory .
```

### PASO 4: Verificar que Funciona (3 min)

```bash
npm install
npm tauri dev
```

Debería:
- Instalar dependencias (30-60 seg)
- Compilar Rust (2-5 min primera vez)
- Abrir ventana con app default

Si todo OK → **¡Listo para desarrollar!**

---

## 📁 ESTRUCTURA CREADA

Después del paso 3, tendrás:

```
neocab/
├── src/                 ← Frontend React (aquí va UI)
├── src-tauri/           ← Backend Rust (aquí va lógica)
├── package.json         ← Dependencias npm
├── Cargo.toml          ← Dependencias Rust
└── tauri.conf.json     ← Configuración Tauri
```

---

## 📚 QUÉ LEER AHORA

### Opción A: Rápida (1.5h)
1. Leer este archivo (5 min) ✅
2. Leer 00_README_MAESTRO.md (30 min)
3. Leer 01_PLAN_MAESTRO_PARTE_1.md (1h)
4. Comenzar paso 1-4 arriba

### Opción B: Completa (2-3h)
1. Leer INDEX_MAESTRO.md (20 min)
2. Leer 00_README_MAESTRO.md (30 min)
3. Leer 01_PLAN_MAESTRO_PARTE_1.md (1.5h)
4. Leer 02_PLAN_MAESTRO_PARTE_2.md (1h)
5. Hacer pasos 1-4

---

## 🔧 COMANDOS COMUNES

```bash
# Desarrollo
npm tauri dev           # Develop mode (con hot-reload)
npm tauri build         # Build Windows MSI
npm run build           # Build frontend solo
cargo build             # Build Rust solo
cargo test              # Run tests

# Git
git add .
git commit -m "mensaje"
git push origin main

# Troubleshooting
npm install             # Reinstalar deps npm
cargo clean             # Limpiar cache Rust
rm node_modules -r      # Borrar node_modules
```

---

## 📋 SEMANA 1 - TAREAS

Los primeros 5 días:

### Día 1: Inicializar repo (4h)
- [x] Crear GitHub repo
- [x] Clonar localmente
- [x] Crear estructura Tauri
- [x] Verificar que compila
- [x] Primer commit: "Initial Tauri setup"

### Día 2: Configurar dependencias (3h)
- [ ] Editar src-tauri/Cargo.toml (agregar crates)
- [ ] Editar src/package.json (agregar libs)
- [ ] npm install
- [ ] cargo check

### Día 3-5: Crear estructura (5h)
- [ ] Crear carpetas en src-tauri/src
- [ ] Crear carpetas en src
- [ ] Crear archivos mod.rs
- [ ] Crear .gitignore mejorado
- [ ] Commit final: "Add project structure"

**Hito:** Proyecto compilando sin carpetas vacías

---

## ❌ ERRORES COMUNES

### "cargo create-tauri-app: command not found"
**Solución:** 
```bash
npm install -g @tauri-apps/cli@latest
npm tauri --version
```

### "npm install falla con Error"
**Solución:**
```bash
npm cache clean --force
rm node_modules -r -Force  # PowerShell
npm install
```

### "Tauri dev no abre ventana"
**Solución:**
```bash
cargo clean
npm tauri dev
```

### "SDL2 no encuentra"
**Solución:** (Para después, semana 10)
Instalar desde doc 01 sección "Instalación SDL2"

---

## 📞 AYUDA RÁPIDA

| Pregunta | Respuesta | Documento |
|----------|-----------|-----------|
| ¿Cómo agrego módulo Rust? | Crear archivo en src-tauri/src/ y agregar mod en mod.rs | 02 |
| ¿Cómo agrego componente React? | Crear .tsx en src/components/ | 02 |
| ¿Cómo creo command Tauri? | Agregar función en src-tauri/src/commands/ y registrar en main.rs | 04 |
| ¿Cómo hago IPC fronted->backend? | Usar invoke() de @tauri-apps/api | 04 |
| ¿Cómo agrego dependencia npm? | npm install nombre_paquete | 02 |
| ¿Cómo agrego crate Rust? | Editar src-tauri/Cargo.toml | 02 |
| ¿Compilación muy lenta? | Agregar opt-level en Cargo.toml release profile | 08 |

---

## 🎯 OBJETIVO ESTA SEMANA

```
Hoy:       Repo + Tauri funcionando ✅
Mañana:    Dependencias configuradas
Viernes:   Estructura creada + compilando
```

**Hito:** Proyecto vacío pero compilando sin errores

---

## ⏭️ PRÓXIMOS PASOS

1. ✅ Pasos 1-4 arriba (30 min)
2. ⏳ Leer 02_PLAN_MAESTRO_PARTE_2.md (1.5h)
3. ⏳ Semana 1: Completar todo (10-12h distribuidas)
4. ⏳ Semana 2: Modelos + BD (6-8h)

---

## 📊 CHECKLIST RÁPIDA

### Antes de empezar
- [ ] Verificar todas las herramientas instaladas
- [ ] 16GB RAM disponible
- [ ] 30GB disco disponible

### Paso 1-4
- [ ] Repo GitHub creado
- [ ] Clonado localmente
- [ ] Tauri inicializado
- [ ] npm tauri dev abre ventana

### Primer commit
- [ ] git add .
- [ ] git commit -m "Initial Tauri setup"
- [ ] git push origin main
- [ ] Verificar en GitHub

---

## 💡 TIPS

1. **Compila frecuentemente** - cargo check cada 30 min
2. **Commits pequeños** - un cambio por commit
3. **Lee los errores** - el compilador de Rust explica bien
4. **Pregunta cuando estés atascado** - es normal
5. **No hagas todo hoy** - la semana es 5 días

---

**¿Listo?**

👉 Ejecuta los 4 pasos arriba en este momento.

Te espero en 30 minutos con repo + Tauri funcionando 🚀

---

*Guía rápida NeoCab - Semana 0*  
*Próximo: 02_PLAN_MAESTRO_PARTE_2.md después de esto*
