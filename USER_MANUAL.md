# 🎮 Manual del Usuario Maestro - NeoCab v1.0 🚀

Bienvenido a **NeoCab**, el sistema operativo definitivo para gabinetes arcade. Este manual te guiará a través de todas las potentes herramientas integradas que hacen de NeoCab el sustituto moderno y ligero de HyperSpin y RocketLauncher.

---

## 🕹️ 1. Conceptos Básicos e Interfaz
NeoCab está diseñado para ser operado exclusivamente con palancas y botones arcade (aunque el ratón y teclado funcionan para la configuración).

*   **Rueda de Sistemas:** Navega entre tus consolas y máquinas arcade (MAME, NES, SNES, etc.).
*   **Lista de Juegos:** Visualiza tus juegos con arte original, videos y descripciones.
*   **Favoritos:** Pulsa el botón asignado a "Favorito" (normalmente Botón 4) para añadir juegos a tu colección rápida.

---

## 👨‍💼 2. Panel de Operador (Tu Centro de Mando)
Para acceder al Panel de Operador, pulsa la combinación de teclas/botones configurada (por defecto `Ctrl+Alt+O` o la tecla asignada en el JoyMapper). Requiere un **PIN de seguridad** (Default: `0000`).

### Pestañas Principales:
*   **Estadísticas:** Mira cuántas monedas has recaudado, tiempo total de juego y salud del sistema.
*   **Controles:** Accede al **Input Wizard** para configurar tus palancas.
*   **Studio:** Edita visualmente el aspecto de tu sistema.
*   **Auditoría:** Revisa qué juegos no tienen video o carátula y soluciónalo con un clic.

---

## 🎨 3. NeoCab Studio (Diseño Visual)
¡Olvida editar archivos de texto o usar programas externos!
1.  Entra en la pestaña **Studio**.
2.  **Mueve elementos:** Usa el ratón para arrastrar la rueda de juegos o la ventana de video.
3.  **Ajusta Propiedades:** Usa los sliders laterales para cambiar el tamaño, rotación y opacidad.
4.  **Pantalla de Carga (Fade):** Personaliza el texto y el tiempo que dura la transición antes de que empiece un juego.
5.  **Guardar:** Pulsa el botón de Guardar y los cambios se aplicarán instantáneamente a todo el sistema.

---

## 🕹️ 4. JoyMapper (Controles Profesionales)
NeoCab no necesita drivers externos (como ViGEm o x360ce). El motor **JoyMapper** nativo lo hace todo:
1.  Ve a **Controles** -> **Input Wizard**.
2.  Sigue las instrucciones en pantalla: pulsa Arriba, Abajo, Botón 1, etc.
3.  **Curvas de Respuesta:** Si usas un stick analógico, puedes configurar curvas "Exponenciales" para mayor precisión en juegos de lucha o disparos.
4.  **Anti-Deadzone:** Si tu palanca está un poco vieja y se mueve sola, ajusta el Deadzone para que el sistema ignore esos pequeños movimientos.

---

## 🚀 5. Launcher Pro (Fades & Bezels)
La experiencia de lanzamiento es lo que separa a un arcade barato de uno profesional.
*   **Fades:** NeoCab muestra una pantalla de carga elegante que oculta el inicio del emulador. Puedes personalizarla en el Studio.
*   **Bezels (Marcos):** Para juegos clásicos en 4:3, NeoCab busca automáticamente un marco (bezel) en `data/media/bezels` para llenar los bordes negros de tu pantalla moderna.

---

## 🔍 6. Smart Scraper (Sincronización de Medios)
NeoCab está conectado a **ScreenScraper.fr**.
1.  En el Panel de Operador, selecciona un juego que no tenga imagen.
2.  Pulsa **"Scrapear Juego"**.
3.  El sistema buscará automáticamente en la nube y descargará:
    *   Logo (Wheel)
    *   Caja (Box Art)
    *   Video de preview
    *   Información del desarrollador y año.

---

## 📊 7. Auditoría y Mantenimiento
Usa la pestaña de **Auditoría** para mantener tu máquina impecable.
*   **Limpieza de ROMs:** Detecta archivos que no son juegos válidos.
*   **Media Check:** Te muestra una lista de qué juegos están "huérfanos" (sin arte).
*   **Logs:** Si un emulador no arranca, revisa la pestaña de **Registros** para ver el error exacto en tiempo real.

---

## 💻 8. Soporte Legacy (Windows XP)
Si estás instalando esto en un PC antiguo con **Windows XP**:
*   NeoCab detectará automáticamente el sistema y activará el **Modo SDL2**.
*   No intentes usar Shaders pesados; mantén el diseño en el Studio lo más limpio posible para asegurar 60 FPS constantes.

---

## ❓ 9. Preguntas Frecuentes
*   **¿Cómo cambio el PIN?** En la pestaña de Configuración del Panel de Operador.
*   **¿Puedo usar mi mando de PS5/Xbox?** Sí, NeoCab los detecta nativamente. Solo pásalos por el Input Wizard.
*   **¿Dónde pongo mis juegos?** En la carpeta `data/games/[sistema]`.

---
**NeoCab v1.0 - El futuro del Arcade, hoy.**
