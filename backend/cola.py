from collections import deque

"""
ESTRUCTURA DE DATOS: COLA (Queue)
¿Qué estructura utilizó?: Cola (Queue) basada en collections.deque.
¿Por qué la eligió?: Porque las tareas o solicitudes pendientes deben ser atendidas en orden 
                    de llegada, siguiendo el principio FIFO (First In, First Out).
¿Qué operación resuelve?: Gestión de turnos, tareas en espera o solicitudes de revisión.
¿Qué ventajas ofrece?: collections.deque está altamente optimizada para agregar y extraer 
                       elementos en ambos extremos en tiempo constante O(1), con una
                       implementación en C muy eficiente y segura para hilos.
¿Qué complejidad aproximada tiene?: 
    - Inserción (enqueue): O(1)
    - Extracción (dequeue): O(1)
"""

class ColaTareas:
    def __init__(self):
        self.elementos = deque()

    @property
    def tamaño(self):
        """Retorna el tamaño actual de la cola."""
        return len(self.elementos)

    def enqueue(self, dato):
        """Inserta un elemento al final de la cola. O(1)"""
        self.elementos.append(dato)

    def dequeue(self):
        """Retira y retorna el elemento al frente de la cola. O(1)"""
        if self.esta_vacia():
            return None
        return self.elementos.popleft()

    def peek(self):
        """Retorna el elemento al frente sin retirarlo. O(1)"""
        if self.esta_vacia():
            return None
        return self.elementos[0]

    def esta_vacia(self):
        """Verifica si la cola está vacía."""
        return len(self.elementos) == 0

    def obtener_elementos(self):
        """
        Recorre la cola sin modificarla para enviarla al Frontend.
        Complejidad: O(n) donde n es el tamaño de la cola.
        """
        elementos_dict = []
        for dato in self.elementos:
            if hasattr(dato, 'to_dict'):
                elementos_dict.append(dato.to_dict())
            else:
                elementos_dict.append(dato)
        return elementos_dict
