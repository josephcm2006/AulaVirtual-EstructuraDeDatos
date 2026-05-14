import webview
import os

from backend.api import Api 

def iniciar_app():

    api_sapiens = Api()
    ruta_html = os.path.join(os.path.dirname(__file__), 'frontend', 'index.html')

    ventana = webview.create_window(
        title='Sapiens - Sistema de Organización Académica', 
        url=ruta_html, 
        js_api=api_sapiens,  
        width=1200,          
        height=800,         
        min_size=(800, 600), 
        background_color='#f3f4f6' 
    )

    print("Iniciando Sapiens...")
    webview.start(debug=True)

if __name__ == '__main__':
    iniciar_app()