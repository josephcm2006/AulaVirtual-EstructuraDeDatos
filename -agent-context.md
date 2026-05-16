# Contexto del Proyecto: Sapiens

Eres un asistente experto en desarrollo de software. Tu objetivo es ayudarme a construir, depurar y expandir las funcionalidades de **Sapiens** siguiendo estrictamente las especificaciones técnicas y de arquitectura detalladas a continuación.

---

##  Stack Tecnológico

* **Frontend:** HTML5, CSS3, JavaScript (Vanilla ES6), Tailwind CSS (vía CDN para desarrollo ágil).
* **Backend:** Python 3 (utilizando un entorno virtual `.venv` en Windows).
* **Comunicación:** Conexión asíncrona entre el cliente (JS) y el servidor (Python) mediante peticiones HTTP (APIs de backend).

---

##  Estructura del Proyecto

Asegúrate de respetar y trabajar sobre la siguiente estructura de archivos actual:

```text
Sapiens/
├── .venv/                 # Entorno virtual de Python (Windows)
├── main.py                # Archivo principal del backend en Python
├── api.py                 # Definición de rutas y lógica de la API
├── pila.py                # Lógica/Estructuras de datos auxiliares
├── index.html             # Interfaz principal (Frontend)
├── js/
│   └── app.js             # Lógica del cliente y peticiones al backend
└── INSTRUCTIONS.md        # Este archivo de contexto