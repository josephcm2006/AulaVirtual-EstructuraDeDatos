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
        nuevo_nodo = NodoLista(dato)
        if self.cabeza is None:
            self.cabeza = nuevo_nodo
            self.cola = nuevo_nodo
        else:
            self.cola.siguiente = nuevo_nodo
            self.cola = nuevo_nodo
        self.tamaño += 1

    def buscar_por_identificacion(self, identificacion):
        actual = self.cabeza
        while actual is not None:
            if hasattr(actual.dato, 'identificacion') and actual.dato.identificacion == identificacion:
                return actual.dato
            actual = actual.siguiente
        return None

    def eliminar_por_identificacion(self, identificacion):
        actual = self.cabeza
        anterior = None

        while actual is not None:
            if hasattr(actual.dato, 'identificacion') and actual.dato.identificacion == identificacion:
                if anterior is None:
                    self.cabeza = actual.siguiente
                    if self.cabeza is None:
                        self.cola = None 
                else:
                    anterior.siguiente = actual.siguiente
                    if actual.siguiente is None:
                        self.cola = anterior
                self.tamaño -= 1
                return True 
            
            anterior = actual
            actual = actual.siguiente
            
        return False # No se encontró

    def obtener_todos(self):
        elementos = []
        actual = self.cabeza
        while actual is not None:
            if hasattr(actual.dato, 'to_dict'):
                elementos.append(actual.dato.to_dict())
            else:
                elementos.append(actual.dato)
            actual = actual.siguiente
        return elementos
