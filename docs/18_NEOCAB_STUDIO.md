# 🎨 Documentación Técnica: NeoCab Studio Engine

**NeoCab Studio** es el motor de personalización visual integrado que permite a los usuarios diseñar la interfaz de su gabinete arcade sin tocar una sola línea de código o XML.

---

## 🛠️ Capacidades del Editor
El Studio opera como un entorno **WYSIWYG** (What You See Is What You Get) que manipula el DOM de React en tiempo real:

### 1. Manipulación Espacial
- **Drag-and-Drop Nativo**: Los elementos de la UI (Wheel, Video, Art) se pueden posicionar libremente en el lienzo.
- **Coordenadas Relativas**: El sistema calcula posiciones en porcentajes (%) para asegurar que los temas se vean perfectos tanto en pantallas 4:3 como 16:9 o 4K.

### 2. Estilización Avanzada
- **Transformaciones CSS3**: Cada elemento soporta ajustes de rotación (deg), escala (scale) y opacidad (0-1).
- **Z-Indexing**: Control total sobre qué elementos se muestran por encima de otros (ej. poner un logo encima de la ventana de video).

### 3. Gestión de Multimedia (Assets)
- El editor permite seleccionar imágenes de fondo y assets del sistema directamente desde el sistema de archivos de NeoCab (`data/media/`).

---

## 💾 El Formato de Tema (`theme.json`)
NeoCab Studio genera un archivo JSON estructurado que el frontend consume para renderizar la interfaz. Ejemplo de estructura:

```json
{
  "background": "main_bg.png",
  "elements": [
    {
      "id": "wheel",
      "type": "GameWheel",
      "x": 75.5,
      "y": 50.0,
      "scale": 1.2,
      "opacity": 1.0,
      "rotation": 0
    },
    {
      "id": "preview_video",
      "type": "VideoWindow",
      "x": 20.0,
      "y": 45.0,
      "scale": 1.0,
      "opacity": 0.9
    }
  ],
  "fade": {
    "enabled": true,
    "duration_ms": 1500,
    "loading_text": "GET READY!"
  }
}
```

---

## 🚀 Flujo de Trabajo
1.  **Carga**: Al abrir el Studio, el backend de Rust lee el `current_theme.json`.
2.  **Edición**: El usuario manipula la UI. Cada cambio actualiza el estado local de React.
3.  **Persistencia**: Al pulsar "Guardar", el comando `save_theme_config` de Tauri escribe el nuevo JSON en disco.
4.  **Hot-Reload**: El sistema detecta el cambio y recarga la interfaz visual sin necesidad de reiniciar NeoCab.

---
**NeoCab Studio: Creatividad sin límites para tu arcade.**
