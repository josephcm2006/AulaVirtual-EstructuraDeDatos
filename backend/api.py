class Api:
    def __init__(self):
        print("API de Sapiens inicializada. Estructuras listas.")

#esta es la parte que nos permite hacer comunicacion bidirecional
    def hacer_ping(self, mensaje):
        print(f"Mensaje recibido desde el frontend: {mensaje}")
        return "¡Pong desde Python! Conexión exitosa."