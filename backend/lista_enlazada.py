"""
ESTRUCTURA DE DATOS: LISTA ENLAZADA SIMPLE
¿Qué estructura utilizó?: Lista Enlazada Simple (Singly Linked List).
¿Por qué la eligió?: Para gestionar la colección de estudiantes registrados sin tener que 
                    predefinir un tamaño máximo o reasignar memoria de forma contigua.
¿Qué operación resuelve?: Registro secuencial y dinámico de alumnos.
¿Qué ventajas ofrece?: Crecimiento dinámico e inserción eficiente si se mantiene un puntero. 
                       Evita el desperdicio de memoria y es ideal cuando no se requiere 
                       acceso aleatorio frecuente por índice.
¿Qué complejidad aproximada tiene?: 
    - Inserción al final: O(1) si llevamos puntero a la 'cola', o O(n) si hay que recorrerla. (Implementaremos O(1) usando puntero al último).
    - Búsqueda: O(n) en el peor de los casos.
    - Eliminación: O(n) porque hay que buscar el nodo previo.
"""

class NodoLista:
    def __init__(self, dato):
        self.dato = dato
        self.siguiente = None

class ListaEnlazadaEstudiantes:
    def __init__(self):
        self.cabeza = None
        self.cola = None  # Puntero extra para lograr O(1) al insertar al final
        self.tamaño = 0

    def insertar_al_final(self, dato):
        """Inserta un nuevo estudiante al final de la lista. O(1)"""
        nuevo_nodo = NodoLista(dato)
        if self.cabeza is None:
            self.cabeza = nuevo_nodo
            self.cola = nuevo_nodo
        else:
            self.cola.siguiente = nuevo_nodo
            self.cola = nuevo_nodo
        self.tamaño += 1

    def buscar_por_identificacion(self, identificacion):
        """
        Busca un estudiante secuencialmente por su ID.
        Complejidad: O(n)
        """
        actual = self.cabeza
        while actual is not None:
            if hasattr(actual.dato, 'identificacion') and actual.dato.identificacion == identificacion:
                return actual.dato
            actual = actual.siguiente
        return None

    def eliminar_por_identificacion(self, identificacion):
        """
        Elimina un nodo de la lista buscando su ID.
        Complejidad: O(n)
        """
        actual = self.cabeza
        anterior = None

        while actual is not None:
            if hasattr(actual.dato, 'identificacion') and actual.dato.identificacion == identificacion:
                if anterior is None:
                    # El elemento a borrar es la cabeza
                    self.cabeza = actual.siguiente
                    if self.cabeza is None:
                        self.cola = None # Quedó vacía
                else:
                    anterior.siguiente = actual.siguiente
                    if actual.siguiente is None:
                        # Si era el último, actualizamos la cola
                        self.cola = anterior
                self.tamaño -= 1
                return True # Eliminado exitosamente
            
            anterior = actual
            actual = actual.siguiente
            
        return False # No se encontró

    def obtener_todos(self):
        """
        Recorre la lista para enviarla al Frontend.
        Complejidad: O(n)
        """
        elementos = []
        actual = self.cabeza
        while actual is not None:
            if hasattr(actual.dato, 'to_dict'):
                elementos.append(actual.dato.to_dict())
            else:
                elementos.append(actual.dato)
            actual = actual.siguiente
        return elementos
