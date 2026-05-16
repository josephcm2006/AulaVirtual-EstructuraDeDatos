"""
ESTRUCTURA DE DATOS: COLA (Queue)
¿Qué estructura utilizó?: Cola (Queue) basada en Nodos enlazados.
¿Por qué la eligió?: Porque las tareas o solicitudes pendientes deben ser atendidas en orden 
                    de llegada, siguiendo el principio FIFO (First In, First Out).
¿Qué operación resuelve?: Gestión de turnos, tareas en espera o solicitudes de revisión.
¿Qué ventajas ofrece?: Permite insertar al final y extraer del inicio de forma muy eficiente, 
                       garantizando la equidad en el procesamiento.
¿Qué complejidad aproximada tiene?: 
    - Inserción (enqueue): O(1) manteniendo un puntero al final.
    - Extracción (dequeue): O(1) modificando el puntero del frente.
"""

class NodoCola:
    def __init__(self, dato):
        self.dato = dato
        self.siguiente = None

class ColaTareas:
    def __init__(self):
        self.frente = None
        self.final = None
        self.tamaño = 0

    def enqueue(self, dato):
        """Inserta un elemento al final de la cola. O(1)"""
        nuevo_nodo = NodoCola(dato)
        if self.esta_vacia():
            self.frente = nuevo_nodo
            self.final = nuevo_nodo
        else:
            self.final.siguiente = nuevo_nodo
            self.final = nuevo_nodo
        self.tamaño += 1

    def dequeue(self):
        """Retira y retorna el elemento al frente de la cola. O(1)"""
        if self.esta_vacia():
            return None
        nodo_removido = self.frente
        self.frente = self.frente.siguiente
        if self.frente is None:
            self.final = None  # La cola quedó vacía
        self.tamaño -= 1
        return nodo_removido.dato

    def peek(self):
        """Retorna el elemento al frente sin retirarlo. O(1)"""
        if self.esta_vacia():
            return None
        return self.frente.dato

    def esta_vacia(self):
        return self.frente is None

    def obtener_elementos(self):
        """
        Recorre la cola sin modificarla para enviarla al Frontend.
        Complejidad: O(n) donde n es el tamaño de la cola.
        """
        elementos = []
        actual = self.frente
        while actual is not None:
            if hasattr(actual.dato, 'to_dict'):
                elementos.append(actual.dato.to_dict())
            else:
                elementos.append(actual.dato)
            actual = actual.siguiente
        return elementos
