from collections import deque

class ColaTareas:
    def __init__(self):
        self.elementos = deque()

    @property
    def tamaño(self):
        return len(self.elementos)

    def enqueue(self, dato):
        self.elementos.append(dato)

    def dequeue(self):
        if self.esta_vacia():
            return None
        return self.elementos.popleft()

    def peek(self):
        if self.esta_vacia():
            return None
        return self.elementos[0]

    def esta_vacia(self):
        return len(self.elementos) == 0

    def obtener_elementos(self):
        elementos_dict = []
        for dato in self.elementos:
            if hasattr(dato, 'to_dict'):
                elementos_dict.append(dato.to_dict())
            else:
                elementos_dict.append(dato)
        return elementos_dict
