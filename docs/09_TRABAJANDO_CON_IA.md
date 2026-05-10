# 🤖 ARCADECORE v3 - PARTE 9: DESARROLLO ASISTIDO CON IA

> **Cómo usar Claude, ChatGPT y Cursor para desarrollar ArcadeCore de forma eficiente, sin alucinar, y llegar a producción rápido.**

---

## 📋 HERRAMIENTAS IA RECOMENDADAS

### 1. Claude (Anthropic) - MEJOR para Rust
- **Modelo:** Claude 3.5 Sonnet o Claude Pro
- **Costo:** $20/mes (Pro)
- **Ventajas:** Excelente en Rust, context window grande (200K tokens)
- **Mejor para:** Arquitectura, debugging Rust, diseño sistema
- **URL:** https://claude.ai

### 2. ChatGPT (OpenAI) - MEJOR para React/Frontend
- **Modelo:** GPT-4 o GPT-4o
- **Costo:** $20/mes (Plus) o $200/mes (Pro)
- **Ventajas:** Excelente React, debugging JS/TS
- **Mejor para:** UI, componentes React, frontend
- **URL:** https://chatgpt.com

### 3. Cursor - MEJOR para desarrollo continuo
- **Costo:** $20/mes
- **Ventajas:** IDE con IA integrada, autocomplete como copiloto
- **Mejor para:** Desarrollo diario, coding, refactoring
- **URL:** https://cursor.com

### Recomendación
```
PRESUPUESTO IDEAL: $60/mes
├─ Claude Pro ($20/mes)      ← Arquitectura + Rust
├─ ChatGPT Plus ($20/mes)    ← Frontend + debugging JS
└─ Cursor ($20/mes)          ← IDE con IA integrada
```

---

## 🎯 ESTRATEGIA GENERAL: TDAD

### Plan-Test-Discuss-Ask-Develop (TDAD)

Cada sesión de 1-2 horas:

```
1. TEST (5 min)
   └─ ¿Qué pasó la vez anterior?
   └─ ¿Compila?
   └─ ¿Tests pasan?

2. DISCUSS (10 min)
   └─ Lee comentarios del código
   └─ Entiende qué hiciste
   └─ Identifica próximo paso

3. ASK (10 min)
   └─ Pregunta a IA cosas específicas
   └─ No: "implementa todo"
   └─ Sí: "¿cómo manejo este error?"

4. DEVELOP (25-35 min)
   └─ Código en Cursor/VS Code
   └─ IA sugiere, TÚ escribes
   └─ Copia ejemplo + lo adaptas

5. COMMIT (5 min)
   └─ `git add .`
   └─ `git commit -m "Feature X implementado"`
   └─ `git push`
```

**Tiempo total:** 1 sesión = 1 hora productiva

---

## 🛑 ANTI-HALUCCINACIONES: REGLAS DE ORO

### ❌ NUNCA hagas esto

```
❌ NO: "Implementa el game library completo"
✅ SÍ: "¿Cuál es el orden correcto de funciones para scanear ROMs?"

❌ NO: "Hazme todo el input manager"
✅ SÍ: "¿Cómo integrar SDL2 con tokio async?"

❌ NO: "Crea la UI principal"
✅ SÍ: "¿Cómo hacer un grid de juegos con React + Vite?"

❌ NO: "Resuelve mis errores de compilación"
✅ SÍ: "Este error `trait not implemented` significa qué?"
```

### ✅ REGLAS ANTI-ALUCINACIÓN

#### Regla 1: Verifica dependencies reales
```rust
// ANTES de confiar en IA:
cargo search sqlx --limit 5
cargo search tokio --limit 5
cargo search serde --limit 5

// Luego compara con lo que IA sugirió
// Si IA mencionó "serde_tomol", es ALUCINACIÓN
```

#### Regla 2: Busca docs.rs
```
Si IA sugiere un método, VERIFICA en:
https://docs.rs/[crate]/latest/[crate]/

Ejemplo: IA dice usar `db.query_all()`
Vas a: https://docs.rs/sqlx/latest/sqlx/
Y buscas "query_all" para confirmar que existe
```

#### Regla 3: Ejecuta cargo check antes de copiar
```bash
# Siempre:
cargo check  # Verifica que compila

# Si error de compilación, pregunta a IA:
# "Este error [ERROR EXACTO] qué significa?"
```

#### Regla 4: Tests como verificación
```rust
// Si IA da código sin tests, DESCONFÍA
#[test]
fn test_example() {
    // Este es el "test" que IA debe dar también
}

// Si no hay test, el código probablemente está incompleto
```

#### Regla 5: Citas de documentación
```
CUANDO IA te da código, pide:
"Dame 3 líneas de la documentación oficial de [crate]
que justifiquen esta implementación"

Si NO puede, probablemente alucinó.
```

---

## 🎓 FLUJO CORRECTO POR SEMANA

### Semana 1: Setup
```
Lunes:
  [ ] Lee PARTE 1 del plan
  [ ] Pregunta a Claude: "¿Cuál es el orden para instalar Rust en [TU_SO]?"
  [ ] Sigue pasos exactos
  [ ] Tests: `rustc --version`

Martes:
  [ ] Pregunta: "¿Cuál es la estructura mínima de un Tauri project?"
  [ ] Crea proyecto: `cargo tauri create`
  [ ] Tests: `cargo tauri dev` abre ventana

Miércoles:
  [ ] Pregunta: "¿Cómo estructurar src-tauri/src/main.rs?"
  [ ] Adapta ejemplo de Claude
  [ ] Tests: Compila sin warnings

Jueves-Viernes:
  [ ] Integra React frontend
  [ ] Tests: UI y Rust se comunican
  [ ] Commit: "Week 1: Tauri + React working"
```

### Semana 5: Primer emulador
```
Lunes-Martes:
  [ ] Pregunta: "¿Cómo lanzar proceso externo con tokio?"
  [ ] Implementa función base
  [ ] Tests: Puedes ejecutar `notepad.exe` o `gedit`

Miércoles:
  [ ] Pregunta: "¿Cuál es la CLI de MAME para lanzar un ROM?"
  [ ] Adapta para MAME
  [ ] Tests: `mame -listxml > test.xml` funciona

Jueves:
  [ ] Pregunta: "¿Cómo capturar exit code de proceso?"
  [ ] Implementa espera
  [ ] Tests: Juego termina cuando cierras ventana

Viernes:
  [ ] Commit: "Week 5: MAME adapter working"
```

---

## 💬 PROMPTS ESPECÍFICOS POR MÓDULO

### GameLibrary Scanner

**Pregunta inicial:**
```
Soy Francisco, estoy haciendo ArcadeCore (frontend arcade en Rust+Tauri).
Necesito un GameLibrary que:
- Escanee directorio /roms/mame/ recursivamente
- Calcule CRC32 de cada archivo
- Guarde en SQLite tabla `games`
- Sea paralelo (waldir + rayon)

Dame el código Rust completo para GameLibrary::scan_system().
Luego dame tests unitarios.
Luego dame cómo llamarlo desde Tauri command.
```

**Validación:**
```
Pregunta de seguimiento:
"En la documentación de walkdir en docs.rs,
¿dónde dice cómo iterar archivos recursivamente?"
```

### Input Manager

**Pregunta inicial:**
```
Necesito un InputManager que:
- Detecte gamepads con gilrs 0.10
- Emita eventos a través de tokio::sync::mpsc
- Mapee D-Pad → Up/Down/Left/Right
- Mapee botones según YAML config

Dame el struct InputManager con:
1. Método `new()`
2. Método `listen()` que emite InputEvent en loop
3. Subscriber pattern con tokio channels
4. Ejemplos de cómo escuchar eventos desde otra tarea

Verifica que esto está en la documentación de gilrs.
```

### Emulator Adapter Template

**Pregunta inicial:**
```
Necesito un trait EmulatorAdapter que:
- Tenga método `build_args(&game: Game) -> Vec<String>`
- Retorne argumentos CLI del emulador
- Se implemente para MAME, DuckStation, PPSSPP, etc.

Dame:
1. El trait definición
2. Implementación para MAME
3. Implementación para DuckStation
4. Cómo registrar en HashMap

Luego verifica que los argumentos CLI son correctos
buscando en MAME --help y DuckStation docs.
```

---

## 🔄 CICLO DE DESARROLLO DIARIO

### Plan: Lo que vas a hacer

```
Terminal 1:
$ cargo tauri dev
→ App corre en http://localhost:1420

Terminal 2:
$ cargo watch -x check
→ Auto-detecta cambios y compila

Terminal 3:
$ # Usa Cursor o VS Code + IA
```

### Test: Verifica que funciona

```bash
# Después de cada cambio:
cargo check              # ¿Compila?
cargo test --all        # ¿Tests pasan?
cargo clippy            # ¿Sin warnings?
cargo fmt               # ¿Bien formateado?

# Solo si TODO pasa:
git add .
git commit -m "Feature: [descripción]"
git push
```

### Discuss: Entiende qué hiciste

```
ANTES de preguntarle a IA:
- Lee el código que escribiste
- Ponlo en comentarios
- Entiende cada línea
- Si no entiendes, PREGUNTA a IA

NO:
Copiar código de IA → pegar → esperar que funcione

SÍ:
IA da código → TÚ lees → TÚ entiendes → TÚ lo escribes
```

### Ask: Pregunta específica

```
NO: "¿Cómo hago un database?"
SÍ: "Tengo error `no method named 'create_table' found`.
     ¿Cuál es el método correcto en sqlx 0.7?"

NO: "Hazme la UI"
SÍ: "¿Cómo crear un grid responsive en React que
     muestre juegos en 4 columnas en desktop,
     2 en mobile?"

NO: "Arregla el código"
SÍ: "En la línea X, el compilador dice:
     [ERROR EXACTO].
     ¿Cuál es el problema?"
```

### Develop: Código en sesión

```
1. Abre Cursor o VS Code
2. IA sugiere → TÚ escribes
3. NO copiar/pegar directamente
4. Adapta a tu estructura
5. Prueba inmediatamente
6. Si error → pregunta específica a IA
```

### Commit: Guarda progreso

```bash
git add .
git commit -m "Semana X, Día Y: [Feature específico]"
git push

Ejemplo:
git commit -m "W5D1: MAME adapter - CLI args builder"
git commit -m "W6D2: Coin manager - Insert coin event"
git commit -m "W8D3: Timer overlay - Countdown display"
```

---

## 📝 PLANTILLAS DE PROMPTS (COPIAR/PEGAR)

### Template 1: Nuevo módulo

```
Estoy haciendo ArcadeCore, un frontend arcade en Rust+Tauri+React.

CONTEXTO:
- Base de datos: SQLite con tablas [emulators, games, sessions, ...]
- Stack: Rust 1.75+, Tauri 2.x, React 18, tokio 1.35
- Arquitectura: Módulos en src-tauri/src/core/

NECESITO:
Implementar [NOMBRE_MODULO] que:
- [Funcionalidad 1]
- [Funcionalidad 2]
- [Funcionalidad 3]

DAME:
1. Definición struct/enum
2. Métodos principales (new, init, main_method)
3. Trait implementations si aplica
4. Unit tests (mínimo 3 casos)
5. Ejemplo de uso desde Tauri command

VERIFICA:
- Que los tipos existan en crates.io
- Que el ejemplo compila
```

### Template 2: Debugging error

```
CONTEXTO:
Estoy en [RUTA_ARCHIVO] línea [NÚMERO]
Escribí: [TU_CÓDIGO]

ERROR:
[COPIAR ERROR EXACTO DEL COMPILADOR]

PREGUNTAS:
1. ¿Cuál es el problema?
2. ¿Cómo lo arreglo?
3. ¿Hay una forma más idiomática en Rust?

VERIFICA:
- En docs.rs que el método que sugieres existe
```

### Template 3: Integración emulador

```
Necesito agregar soporte para [NOMBRE_EMULADOR].

INFORMACIÓN:
- Ejecutable: [ruta Windows/Linux]
- CLI: [cómo se lanza un ROM]
- BIOS necesario: [sí/no]
- Fullscreen flag: [cuál es]
- Output display: [escala/custom resolution]

NECESITO:
1. Struct [NOMBRE]Adapter implementando EmulatorAdapter
2. Método build_args() retornando Vec<String> correcto
3. Tests que verifican argumentos
4. Documentación comentario en el código

DAME:
- Código completo listo para copiar
- Tests completos
- Verificación en docs oficiales del emulador
```

### Template 4: Feature compleja

```
Necesito implementar [FEATURE] que requiere:
- [Componente 1]: [descripción]
- [Componente 2]: [descripción]
- [Componente 3]: [descripción]

FLUJO:
1. [Paso 1]
2. [Paso 2]
3. [Paso 3]

CONSTRAINTS:
- [Restricción técnica 1]
- [Restricción técnica 2]

PLAN:
Dame:
1. Pseudocódigo del algoritmo
2. Estructura de datos necesaria
3. Código Rust paso a paso
4. Tests para cada componente
5. Cómo integrar en el sistema existente
```

---

## 🎯 WORKFLOW CON CURSOR (RECOMENDADO)

### Setup inicial

```bash
# 1. Instala Cursor
brew install cursor  # macOS
# o descarga desde https://cursor.com

# 2. Abre proyecto
cursor arcadecore/

# 3. Crea .cursorrules (en raíz del proyecto)
# Voy a crearlo después
```

### Uso diario

```
1. Abre archivo que quieres editar
2. Presiona Ctrl+K (o Cmd+K en Mac)
3. Escribe PREGUNTA específica
4. Cursor IA sugiere cambios
5. Presiona Tab para aceptar, Esc para rechazar
6. Prueba: cargo check

Ejemplo:
Abro: src-tauri/src/core/emulator_manager.rs
Presiono: Ctrl+K
Escribo: "Implementar método run_game que lanza ROM con args"
Cursor sugiere código
Presiono Tab para aceptar
Corro: cargo check
Resultado: ✅ Compila
```

### Hotkeys útiles

```
Ctrl+K      → Ask Claude in Cursor (editar archivo)
Ctrl+Shift+K → Ask Claude (sin editar, solo pregunta)
Ctrl+I      → Inline edit (editar código existente)
Ctrl+L      → Limpiar chat
```

---

## 📊 METRICS: CÓMO SABER QUE VAS BIEN

### Por semana

| Métrica | Meta | Verificar |
|---------|------|-----------|
| Compilaciones sin error | 100% | `cargo check` |
| Tests pasando | 100% | `cargo test` |
| Clippy warnings | 0 | `cargo clippy` |
| Commits | 5+ | `git log --oneline` |
| Líneas código nuevas | 500-1000 | `git diff --stat` |
| Features completadas | 1 | Checklist semanal |

### Indicadores de ALUCINACIÓN

```
⚠️ IA sugiere un crate que no existe en crates.io
⚠️ IA da código que no compila (sin explicar error)
⚠️ IA dice "esto debería funcionar" sin tests
⚠️ IA cita documentación que no existe (verificaste)
⚠️ IA da 2 soluciones contradictorias sin elegir
⚠️ Código compila pero no hace lo que IA dijo
⚠️ Error runtime que IA no previó

→ Si vez esto, detente y verifica en docs.rs
```

---

## 🆘 CUANDO TE ATORES

### Nivel 1: IA local

```
Abre Cursor en el archivo problemático
Ctrl+K: "Este código no funciona: [DESCRIPCIÓN]"

Cursor te ayuda en el contexto del archivo
```

### Nivel 2: Claude/ChatGPT en chat

```
Copias código + error exacto
Preguntas: "¿Cuál es el problema?"
Esperas respuesta detallada
Pruebas solución
Si funciona: ¡listo!
Si no: pregunta seguimiento más específica
```

### Nivel 3: Comunidades

```
Si IA no resuelve:
- r/rust en Reddit
- r/tauri
- StackOverflow (busca primero)
- Discord oficial de Rust/Tauri/RetroArch

Pauta de pregunta:
1. Describe el problema
2. Copia código COMPLETO
3. Copia ERROR EXACTO
4. Qué intentaste
5. Qué esperas
```

---

## 🚫 LO QUE IA NO PUEDE HACER (BEN)

```
❌ Entender tu PC mejor que tú
   → Tú manejas inputs, IA sugiere
   
❌ Debuggear emuladores desconocidos
   → IA conoce MAME bien, Teknoparrot menos
   
❌ Predecir performance exacta
   → IA da estimaciones, TÚ benchmarks
   
❌ Decidir sobre diseño arquitectura
   → IA sugiere, TÚ decides
   
❌ Trabajar con ROMs (legales)
   → Eso es responsabilidad tuya
   
❌ Garantizar estabilidad production
   → Tests + deployment es tu responsabilidad
```

---

## 💰 AHORRO DE DINERO

Si presupuesto es limitado:

### Opción A: Gratis + GPT-4o mini
```
- Claude Free (límite: sí, pero funciona)
- GPT-4o mini (gratis, bastante capaz)
- Cursor Free (límite: sí)
Total: $0/mes
Producción: 80% (más lento)
```

### Opción B: Híbrido (Recomendado)
```
- Claude Pro ($20/mes) ← Rust + arquitectura
- GPT-4o mini (gratis)  ← Frontend
- Cursor Free (límite)   ← IDE
Total: $20/mes
Producción: 95% (muy eficiente)
```

### Opción C: Premium
```
- Claude Pro ($20/mes)
- ChatGPT Plus ($20/mes)
- Cursor ($20/mes)
Total: $60/mes
Producción: 100% (óptimo)
```

---

## 📚 RECURSOS PARA APRENDER RUST MIENTRAS DESARROLLAS

No necesitas ser expert en Rust. Aprendes haciendo:

### Primeras 3 semanas
- The Rust Book Cap 1-8: https://doc.rust-lang.org/book/
- Rustlings: https://github.com/rust-lang/rustlings

### Semanas 4-8
- Rust by Example: https://doc.rust-lang.org/rust-by-example/
- StackOverflow tags: [rust] [tokio] [tauri]

### Semanas 9+
- Async Rust: https://tokio.rs/tokio/tutorial
- Advanced Patterns: Compiler errors (¡son gratis!)

---

## ✅ CHECKLIST: ESTÁS LISTO PARA EMPEZAR CON IA

- [ ] Instalé Claude Pro ($20/mes)
- [ ] Instalé ChatGPT Plus ($20/mes) o gratuito
- [ ] Instalé Cursor ($20/mes) o VS Code gratis
- [ ] Leí las "Reglas Anti-Alucinación"
- [ ] Entiendo el flujo TDAD
- [ ] Tengo copias de prompts templates
- [ ] Instalé cargo watch globalmente
- [ ] Setup .cursorrules en mi proyecto
- [ ] Primeras 2 semanas planeo sin IA mucha (setup básico)
- [ ] Semana 3+ comienzo a usar IA intensamente

---

## 🎓 CONCLUSIÓN

**IA es TU ASISTENTE, no tu desarrollador.**

```
Trabajo correcto:
IA sugiere → TÚ escribes → TÚ entiendes → TÚ debuggeas

Trabajo incorrecto:
IA genera → Copias → Esperas que funcione → ¿Por qué error?
```

**Si sigues esto, en 16 semanas tendrás ArcadeCore v1.0.**

Ahora sí, ¡vamos a construirlo! 🚀

---

*Próximo: Documento de Hardware Físico*
