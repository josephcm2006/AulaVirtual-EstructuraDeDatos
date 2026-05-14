import webview
import os
# Importamos la clase Api que creaste en la carpeta backend
from backend.api import Api 

def iniciar_app():
    # 1. Instanciamos la API. 
    # Aquí es donde nacen tu Pila, Cola y Árbol para que vivan en memoria.
    api_sapiens = Api()

    # 2. Obtenemos la ruta absoluta del HTML para evitar errores al ejecutar
    ruta_html = os.path.join(os.path.dirname(__file__), 'frontend', 'index.html')

    # 3. Creamos la ventana principal de pywebview
    ventana = webview.create_window(
        title='Sapiens - Sistema de Organización Académica', 
        url=ruta_html, 
        js_api=api_sapiens,  # Conectamos Python con JavaScript aquí
        width=1200,          # Ancho inicial
        height=800,          # Alto inicial
        min_size=(800, 600), # Evitamos que el usuario encoja la ventana demasiado
        background_color='#f3f4f6' # Un color de fondo inicial (gris muy claro)
    )

    # 4. Iniciamos la interfaz gráfica
    # OJO: debug=True es VITAL mientras programas. Te permitirá dar click derecho 
    # en tu app y usar "Inspeccionar elemento" igual que en Google Chrome.
    print("Iniciando Sapiens...")
    webview.start(debug=True)

if __name__ == '__main__':
    iniciar_app()