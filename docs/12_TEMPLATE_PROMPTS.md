# 🤖 ARCADECORE v3 - PARTE 12: TEMPLATES DE PROMPTS PARA IA

> **Copiar/pegar estos prompts en Claude, ChatGPT o Cursor para desarrollo eficiente.**

---

## 📋 CÓMO USAR ESTE DOCUMENTO

```
1. Encuentra el template que necesitas
2. Copiar COMPLETO
3. Pega en Claude/ChatGPT/Cursor
4. Reemplaza [TEXTO] con tus valores
5. Ajusta según necesidad
6. Lee respuesta completamente
7. Verifica en docs.rs si es Rust
8. Prueba en `cargo check`
```

---

## 🎯 TEMPLATE 1: NUEVO MÓDULO RUST (Más usado)

**Mejor para:** ChatGPT o Claude  
**Tiempo esperado:** 15-30 min respuesta  
**Complejidad:** Media

```
CONTEXTO:
Soy Francisco, estoy haciendo ArcadeCore v3, 
un frontend arcade nativo en Rust+Tauri+React.

El proyecto:
- BD: SQLite con tablas [emulators, games, sessions, etc]
- Stack: Rust 1.75+, Tauri 2.x, React 18, tokio 1.35, sqlx 0.7
- Estructura: src-tauri/src/core/[module_name].rs

NECESITO IMPLEMENTAR: [NOMBRE MÓDULO]

FUNCIONALIDAD:
[Descripción clara de qué debe hacer]

REQUISITOS:
- [Requisito 1]
- [Requisito 2]
- [Requisito 3]

DAME CÓDIGO:
1. Definición del struct/enum principal
2. Trait implementations (si aplica)
3. Métodos core (new, init, main_method)
4. Métodos helper
5. Unit tests (mínimo 3 casos)
6. Un ejemplo completo de uso
7. Documentación en comentarios

LUEGO:
Verifica en https://docs.rs/[crate]/latest 
que todos los métodos y types que sugeriste existen.

TERMINA CON:
Código listo para copiar en archivo .rs
```

### Ejemplo completado:

```
CONTEXTO:
Soy Francisco, estoy haciendo ArcadeCore v3.

NECESITO IMPLEMENTAR: TimerManager

FUNCIONALIDAD:
Un timer que cuenta segundos hacia atrás, 
emite eventos a través de tokio channels,
y ejecuta acción (close/pause/screenshot) 
cuando tiempo se acaba.

REQUISITOS:
- Iniciar con número de minutos
- Emitir evento cada segundo
- Agregar tiempo dinámicamente
- Pausar y resumir
- Configurar qué hacer al timeout
- Tests para cada función

DAME CÓDIGO: [Completo como arriba]
```

---

## 🔨 TEMPLATE 2: DEBUGGING RUST ERROR

**Mejor para:** Claude (es experto en Rust)  
**Tiempo esperado:** 5-10 min  
**Complejidad:** Baja-Media

```
CONTEXTO:
Estoy en archivo: [RUTA_ARCHIVO]
Línea: [NÚMERO]

Intenté escribir este código:
```
[Tu código exacto aquí]
```

RECIBÍ ESTE ERROR:
```
[COPIAR Y PEGAR ERROR COMPLETO DEL COMPILADOR]
```

PREGUNTAS:
1. ¿Cuál es el problema específicamente?
2. ¿Cuál es la forma idiomática correcta en Rust?
3. ¿Hay alternativa mejor para lo que quiero hacer?

CONTEXTO ADICIONAL:
- Estructura de datos: [Describir si complejo]
- Lo que intento lograr: [Descripción]
- Constraints: [Si hay]

VERIFICA:
Por favor, confirma en https://docs.rs/
que los tipos/métodos que sugieres existen.
```

### Ejemplo completado:

```
CONTEXTO:
Estoy en src-tauri/src/core/game_library.rs línea 45

Intenté:
```rust
let games = walkdir::WalkDir::new(&rom_path)
    .into_iter()
    .filter_map(|e| e.ok())
    .par_iter()  // ← ERROR aquí
    .filter(|entry| entry.path().extension() == Some("zip"))
    .collect::<Vec<_>>();
```

ERROR:
```
error[E0599]: no method named `par_iter` found for struct `Vec`
```

PREGUNTAS: [Como arriba]
```

---

## 🎮 TEMPLATE 3: AGREGAR NUEVO EMULADOR

**Mejor para:** Claude (entiende emuladores bien)  
**Tiempo esperado:** 10-20 min  
**Complejidad:** Media

```
CONTEXTO:
ArcadeCore v3, necesito agregar soporte para [EMULADOR].

INFORMACIÓN DEL EMULADOR:
Nombre: [Nombre oficial]
Año: [Año lanzamiento]
Sistemas soporta: [Lista]
Repositorio: [GitHub URL si existe]
Ejecutable: [Nombre archivo .exe/.bin]

CLI ARGUMENTS:
Cómo se lanza un ROM:
```
[Comando exact para lanzar un juego]
```

PARTICULARIDADES:
- BIOS necesario: Sí/No (¿dónde guardar?)
- Fullscreen flag: [Cuál es]
- Config archivo: [Dónde se guarda]
- Save states: [Dónde se guardan]
- Output: [Escala/custom res]

NECESITO:
1. Struct [NOMBRE]Adapter que implemente EmulatorAdapter trait
2. Implementación build_args() con argumentos CLI correctos
3. Manejo de BIOS si necesario
4. Tests que verifiquen argumentos generados
5. Cómo registrar en EmulatorManager
6. Documentación comentarios

LUEGO VERIFICA:
En documentación oficial del emulador:
- ¿Los argumentos CLI son correctos?
- ¿Hay flags adicionales recomendados?
- ¿Hay directorio especial para guardar ROM?

ENTREGA:
Código listo para copiar en src-tauri/src/adapters/[nombre].rs
```

### Ejemplo: DuckStation (PS1)

```
CONTEXTO: [Como arriba]

INFORMACIÓN DEL EMULADOR:
Nombre: DuckStation
Año: 2019
Sistemas soporta: PlayStation 1
Repositorio: https://github.com/stenzek/duckstation

CLI ARGUMENTS:
```
duckstation-qt -batch -gamelist-only game.iso
duckstation-nogui -batch -fullscreen game.iso
```

PARTICULARIDADES:
- BIOS necesario: Sí (scph1001.bin, scph5500.bin, scph5501.bin)
- Fullscreen flag: -fullscreen
- Config: ~/.config/duckstation/settings.ini
- Save states: ~/.local/share/duckstation/memcards/
- Output: Escalado automático a pantalla

NECESITO: [Como arriba]
```

---

## ⚛️ TEMPLATE 4: COMPONENTE REACT

**Mejor para:** ChatGPT (experto en React)  
**Tiempo esperado:** 5-15 min  
**Complejidad:** Media

```
CONTEXTO:
Frontend ArcadeCore v3 en React 18 + TypeScript + Vite.
Estilos: CSS vanilla (NO Tailwind).

NECESITO: Componente [NOMBRE_COMPONENTE]

DESCRIPCIÓN:
[Describe qué muestra y funcionalidad]

PROPS:
- prop1: [tipo] - [descripción]
- prop2: [tipo] - [descripción]

STATE:
- state1: [tipo] - [descripción]
- state2: [tipo] - [descripción]

COMPORTAMIENTO:
1. [Comportamiento 1]
2. [Comportamiento 2]
3. [Comportamiento 3]

RESPONSIVE:
- Desktop (1920px): [Layout]
- Tablet (768px): [Layout]
- Mobile (375px): [Layout]

DAME:
1. Componente TSX completo
2. CSS en <style> o archivo separado
3. Interfaces/tipos TypeScript
4. Ejemplo de uso
5. Comentarios explicativos

RESTRICCIONES:
- Sin librerías UI (builds CSS desde cero)
- Sin Tailwind
- Performance: <300ms render
- Accesible: a11y basics (alt, labels)
```

### Ejemplo: Componente GameGrid

```
CONTEXTO: [Como arriba]

NECESITO: Componente GameGrid

DESCRIPCIÓN:
Grid responsivo de juegos. Cada juego es card clickeable.
Muestra: portada, título, año, rating.
Click = lanza juego.

PROPS:
- games: Game[] - Array juegos para mostrar
- onGameClick: (game: Game) => void - Callback cuando click

STATE:
- selectedGame: Game | null - Juego seleccionado
- filteredGames: Game[] - Juegos filtrados por búsqueda

COMPORTAMIENTO:
1. Grid muestra games con portada
2. Hover en card → ligera sombra
3. Click en card → onGameClick(game)
4. Teclado flecha → navigate entre games

RESPONSIVE: [Como arriba]

DAME: [Como arriba]
```

---

## 🗄️ TEMPLATE 5: QUERY SQLITE CON SQLX

**Mejor para:** Claude (entiende sqlx bien)  
**Tiempo esperado:** 5-10 min  
**Complejidad:** Media

```
CONTEXTO:
ArcadeCore, usando sqlx 0.7 con SQLite.

TABLA:
```sql
[Copia el CREATE TABLE exacto]
```

NECESITO QUERY:
[Descripción clara de qué quieres obtener]

EJEMPLOS:
- Si quieres: "Todos juegos de sistema MAME"
- Si quieres: "Top 10 juegos por número de plays"
- Si quieres: "Earnings por día del último mes"

ASIMPTIONS:
- Pool: SqlitePool ya inicializado
- Structs: Ya definidos con #[derive(sqlx::FromRow)]
- Async: En función con async/await

DAME:
1. Query SQL exacta
2. Función Rust async que ejecute query
3. Type signature correcto
4. Error handling con Result<T, sqlx::Error>
5. Un ejemplo de cómo llamarlo
6. Comentario explicando query

VERIFICA:
En https://docs.rs/sqlx/latest/sqlx/
que syntax es correcto para SQLite (no PostgreSQL).
```

### Ejemplo: Top games por plays

```
CONTEXTO: [Como arriba]

TABLA:
```sql
CREATE TABLE games (
  id INTEGER PRIMARY KEY,
  title TEXT,
  system TEXT,
  rom_path TEXT,
  plays INTEGER DEFAULT 0,
  earnings REAL DEFAULT 0.0
);
```

NECESITO QUERY:
Top 10 juegos por número de plays en último mes,
con título, sistema, y número de plays.

DAME: [Como arriba]
```

---

## 🎯 TEMPLATE 6: INTEGRACIÓN CON TAURI COMMAND

**Mejor para:** Claude  
**Tiempo esperado:** 10-15 min  
**Complejidad:** Media-Alta

```
CONTEXTO:
ArcadeCore Tauri, necesito crear command Rust 
que sea llamado desde React frontend.

FUNCIONALIDAD:
[Describe qué hace el command]

ENTRADA (args):
- arg1: [tipo] - [descripción]
- arg2: [tipo] - [descripción]

SALIDA (return):
Retorna: [tipo serializable]
Estructura:
```json
{
  "field1": "type",
  "field2": "type"
}
```

OPERACIONES INTERNAS:
1. [Operación 1]
2. [Operación 2]
3. [Operación 3]

DAME CÓDIGO:
1. Struct ReturnType para serializar
2. Función #[tauri::command] async
3. Lógica completa
4. Error handling
5. Llamada desde React (useEffect/button)
6. TypeScript interface matching Rust struct

VERIFICA:
- serde_json para serialización
- Error types son Debug + Serialize
```

### Ejemplo: LaunchGame command

```
CONTEXTO: [Como arriba]

FUNCIONALIDAD:
Lanzar un juego específico. 
Emulator manager ejecuta el ROM.
Retorna PID del proceso.

ENTRADA:
- game_id: i32 - ID del juego en BD
- emulator_id: i32 - ID emulador a usar

SALIDA:
```json
{
  "success": true,
  "message": "Pac-Man launched",
  "pid": 12345,
  "start_time": "2024-05-09T16:30:00Z"
}
```

OPERACIONES INTERNAS:
1. Query BD para obtener game
2. Query para obtener emulator config
3. Call EmulatorManager::launch_game()
4. Log en BD sesión
5. Retornar resultado

DAME CÓDIGO: [Como arriba]
```

---

## 🎨 TEMPLATE 7: REFACTORING/OPTIMIZATION

**Mejor para:** Claude  
**Tiempo esperado:** 10-20 min  
**Complejidad:** Media-Alta

```
CONTEXTO:
Tengo código Rust que funciona pero está lento/feo.

PROBLEMA:
[Describe el problema específico]
- Lento: ¿Dónde exactamente?
- Feo: ¿Qué patrón es anti-idiomático?
- Leak: ¿Dónde sospecha memory leak?

CÓDIGO ACTUAL:
```rust
[Pegar código exacto que quieres refactor]
```

CONSTRAINTS:
- Debe mantener la API pública igual
- Tests existentes deben pasar
- [Otros constraints si hay]

PREGUNTAS:
1. ¿Cómo mejorar performance?
2. ¿Cuál es forma idiomática Rust?
3. ¿Hay patrones estándar para esto?

DAME:
1. Explicación de problemas encontrados
2. Código refactorizado
3. Explicación de cambios
4. Antes/después comparación
5. Benchmark si performance critical
6. Tests actualizados si necesario

VERIFICA:
En The Rust Book o docs.rs si patrón es estándar.
```

---

## 🧪 TEMPLATE 8: ESCRIBIR TESTS

**Mejor para:** Claude  
**Tiempo esperado:** 5-10 min  
**Complejidad:** Media

```
CONTEXTO:
Necesito tests para este código Rust.

FUNCIÓN A TESTEAR:
```rust
[Pega función exacta]
```

CASOS DE PRUEBA NECESARIOS:
- Case 1: [Input] → esperado [Output]
- Case 2: [Input] → esperado [Output]
- Case 3: [Input] → esperado [Output]
- Case 4 (error): [Input inválido] → error [tipo]

MOCKING:
- ¿Necesita mock de DB? Sí/No
- ¿Necesita mock de async? Sí/No
- ¿Necesita fixture data? Sí/No

DAME:
1. #[cfg(test)] module completo
2. 3-5 test functions
3. Mock helpers si necesario
4. Fixtures si necesario
5. Cómo correr: cargo test

VERIFICA:
Uses estándar: tokio::test para async
           mockall o similar para mocks
           tempfile para BD temporal
```

### Ejemplo: Tests para insert_coin

```
CONTEXTO: [Como arriba]

FUNCIÓN A TESTEAR:
```rust
pub async fn insert_coin(&mut self) -> Result<u32> {
    self.credits += 1;
    self.log_event("coin_insert").await?;
    Ok(self.credits)
}
```

CASOS DE PRUEBA:
- Case 1: insert_coin() → credits aumenta de 0 a 1
- Case 2: insert_coin() 5x → credits = 5
- Case 3: log_event fallar → propaga error
- Case 4: max credits alcanzado → retorna error

MOCKING:
- Mock de log_event para verificar llamadas
- Mock de DB para error injection

DAME: [Como arriba]
```

---

## 📖 TEMPLATE 9: REVISAR DOCUMENTACIÓN

**Mejor para:** ChatGPT o Claude  
**Tiempo esperado:** 5-10 min  
**Complejidad:** Baja

```
PREGUNTA:
Me confunde cómo usar [CRATE/FEATURE].

CONTEXTO:
Estoy usando [crate] v[version]
Para [describe goal]
en contexto de [async/sync/game loop]

EJEMPLOS:
- Tengo código X que intenta Y
- Documentación dice Z pero no entiendo W

DAME:
1. Explicación clara y simple
2. Ejemplo mínimo funcionando
3. Cómo aplica a mi caso
4. 1-2 alternativas si hay
5. Link a documentación oficial

NO necesito:
- Historia larga del crate
- Todos los features
- Código completo (solo essential)
```

### Ejemplo: Async en Tauri

```
PREGUNTA:
¿Cómo uso tokio async dentro de Tauri command?

CONTEXTO:
Tengo EmulatorManager que es async.
Necesito llamarlo desde Tauri command.
Confundido de dónde viene el runtime.

DAME: [Como arriba]
```

---

## 🔍 TEMPLATE 10: BÚSQUEDA DE DOCUMENTACIÓN

**Mejor para:** Claude  
**Tiempo esperado:** 2-5 min  
**Complejidad:** Baja

```
¿DÓNDE EN LA DOCUMENTACIÓN...?
[Describe qué buscas]

CRATE: [Nombre]
VERSION: [Versión si importante]

BUSCO:
- Método llamado [nombre]
- Sección sobre [tema]
- Ejemplo de [feature]
- Explicación de [concepto]

CONTEXTO PARA BÚSQUEDA:
[Describe en qué contexto lo necesitas]

Dame URL exacta en docs.rs + sección relevante.
```

### Ejemplo

```
¿DÓNDE EN LA DOCUMENTACIÓN...?
...explica cómo configurar SQLite con migrations?

CRATE: sqlx
VERSION: 0.7

BUSCO:
- Cómo usar sqlx-cli para migrations
- Dónde se guardan archivos .sql
- Cómo correr migrations en startup

CONTEXTO:
Tengo ArcadeCore con BD SQLite.
Quiero migrations automáticas al iniciar app.

Dame URL + sección.
```

---

## 💡 TEMPLATE 11: BRAINSTORM ARCHITECTURE

**Mejor para:** Claude  
**Tiempo esperado:** 15-30 min  
**Complejidad:** Alta

```
NECESITO AYUDA CON DECISIÓN DE ARQUITECTURA

PROBLEMA:
[Describe problema de diseño]

CONSTRAINTS:
- [Constraint 1]
- [Constraint 2]
- [Constraint 3]

OPCIONES QUE CONSIDERÉ:
1. [Opción A] - ventajas: [list] - desventajas: [list]
2. [Opción B] - ventajas: [list] - desventajas: [list]
3. [Opción C] - ventajas: [list] - desventajas: [list]

PREGUNTAS:
1. ¿Cuál es mejor?
2. ¿Hay opción 4 que no consideré?
3. ¿Qué sería pattern estándar en [domain]?
4. ¿Cuáles son trade-offs?

CONTEXTO PROYECTO:
[Describe ArcadeCore, escala, performance needs]

DAME:
1. Recomendación + razonamiento
2. Pros/cons cuantificados
3. Alternativa si presupuesto diferente
4. Referencias a patrones stándar
5. Riesgos a considerar
6. Cómo testear decisión
```

---

## ✅ CHECKLIST: ANTES DE PEDIR AYUDA A IA

- [ ] He leído PARTE 9 (TRABAJANDO_CON_IA.md)
- [ ] Tengo cuenta Claude Pro / ChatGPT Plus
- [ ] Tengo Cursor instalado (opcional pero recomendado)
- [ ] He elegido template apropiado
- [ ] He reemplazado [CORCHETES] con valores reales
- [ ] He incluido contexto suficiente
- [ ] He incluido constraints/restrictions
- [ ] He sido específico (no "haz todo")
- [ ] Estoy listo para revisar respuesta críticamente
- [ ] Tengo docs.rs abierto para verificar

---

## 🎯 QUICK REFERENCE

| Necesito | Template | Tool | Tiempo |
|----------|----------|------|--------|
| Nuevo módulo | #1 | Claude | 15-30m |
| Error compilación | #2 | Claude | 5-10m |
| Nuevo emulador | #3 | Claude | 10-20m |
| Componente React | #4 | ChatGPT | 5-15m |
| Query SQLite | #5 | Claude | 5-10m |
| Tauri command | #6 | Claude | 10-15m |
| Refactor código | #7 | Claude | 10-20m |
| Tests unitarios | #8 | Claude | 5-10m |
| Entender librería | #9 | Claude | 5-10m |
| Encontrar docs | #10 | Claude | 2-5m |
| Decisión arquitectura | #11 | Claude | 15-30m |

---

## 🚀 WORKFLOW TÍPICO

```
1. Identifico qué necesito (15 min revisión)
2. Elijo template (#1, #4, #5, etc)
3. Copy/paste template
4. Reemplazo [CORCHETES] con valores reales
5. Agrego contexto específico
6. Envío a Claude/ChatGPT/Cursor
7. Espero respuesta (5-30 min)
8. Leo respuesta completamente
9. Verifico en docs.rs si Rust
10. Pruebo con cargo check / cargo test
11. Si funciona: ¡listo!
12. Si error: Vuelvo a paso 6 con info error
13. Commit cuando done
```

**Tiempo total por tarea:** 30-60 minutos con IA
**Tiempo sin IA:** 2-4 horas manualmente

---

## 💬 TIPS FINALES

1. **Sé específico.** No "ayúdame con controles", sí "¿cómo mapeo botón 1 en SDL2?"
2. **Incluye contexto.** IA no sabe tu proyecto, explica
3. **Verifica siempre.** Docs > IA claims
4. **Itera rápido.** Error? Pregunta seguimiento específica
5. **Aprende mientras haces.** Lee código que IA genera, entiende
6. **Respeta límites IA.** No te sorprendas si se equivoca, verifica
7. **Guarda buenos prompts.** Si tienes pregunta excelente, guarda template
8. **Contribuye.**Cuando tengas prompt killer, comparte con comunidad

---

**Ahora estás listo para desarrollar ArcadeCore con IA como co-pilot.** 🚀

*¡Vamos a construirlo!*

---

*Fin de todos los documentos - Plan Maestro ArcadeCore v3 COMPLETO*
