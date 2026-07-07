class NodoPila:
    def __init__(self, dato):
        self.dato = dato
        self.siguiente = None

class PilaHistorial:
    def __init__(self):
        self.tope = None
        self.tamaño = 0

    def push(self, dato):
        """Inserta un elemento en el tope de la pila. O(1)"""
        nuevo_nodo = NodoPila(dato)
        if self.tope is None:
            self.tope = nuevo_nodo
        else:
            nuevo_nodo.siguiente = self.tope
            self.tope = nuevo_nodo
        self.tamaño += 1

    def pop(self):
        """Retira y retorna el elemento en el tope de la pila. O(1)"""
        if self.esta_vacia():
            return None
        nodo_removido = self.tope
        self.tope = self.tope.siguiente
        self.tamaño -= 1
        return nodo_removido.dato

    def peek(self):
        """Retorna el elemento en el tope sin retirarlo. O(1)"""
        if self.esta_vacia():
            return None
        return self.tope.dato

    def esta_vacia(self):
        return self.tope is None

    def obtener_elementos(self):
        """
        Recorre la pila sin modificarla para enviarla al Frontend.
        Complejidad: O(n) donde n es el tamaño de la pila.
        """
        elementos = []
        actual = self.tope
        while actual is not None:
            # Si el dato tiene método to_dict (TAD), lo usamos
            if hasattr(actual.dato, 'to_dict'):
                elementos.append(actual.dato.to_dict())
            else:
                elementos.append(actual.dato)
            actual = actual.siguiente
        return elementos
