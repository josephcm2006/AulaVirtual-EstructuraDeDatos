"""
ESTRUCTURA DE DATOS: ÁRBOL BINARIO DE BÚSQUEDA (BST)
¿Qué estructura utilizó?: Árbol Binario de Búsqueda (Binary Search Tree).
¿Por qué la eligió?: Porque permite almacenar las Materias de forma jerárquica y ordenada 
                    utilizando su 'código' como clave. Esto es fundamental para búsquedas rápidas.
¿Qué operación resuelve?: Búsqueda eficiente de materias por código, y listado alfabético 
                          (o por código) mediante recorrido In-Orden.
¿Qué ventajas ofrece?: Divide el espacio de búsqueda a la mitad en cada paso (si está balanceado), 
                       lo que lo hace exponencialmente más rápido que una búsqueda en lista lineal.
¿Qué complejidad aproximada tiene?: 
    - Inserción: O(log n) promedio, O(n) peor caso (árbol degenerado).
    - Búsqueda: O(log n) promedio, O(n) peor caso.
    - Recorrido (In-orden): O(n) ya que visita todos los nodos.
"""

class NodoArbol:
    def __init__(self, dato):
        self.dato = dato  # El dato será un objeto tipo Materia
        self.izquierdo = None
        self.derecho = None

class ArbolMaterias:
    def __init__(self):
        self.raiz = None

    def insertar(self, dato):
        """Inserta un nuevo nodo en el BST respetando el orden por código de materia."""
        if self.raiz is None:
            self.raiz = NodoArbol(dato)
        else:
            self._insertar_recursivo(self.raiz, dato)

    def _insertar_recursivo(self, nodo_actual, dato):
        # Comparamos por el atributo 'codigo' del dato (TAD Materia)
        if dato.codigo < nodo_actual.dato.codigo:
            if nodo_actual.izquierdo is None:
                nodo_actual.izquierdo = NodoArbol(dato)
            else:
                self._insertar_recursivo(nodo_actual.izquierdo, dato)
        elif dato.codigo > nodo_actual.dato.codigo:
            if nodo_actual.derecho is None:
                nodo_actual.derecho = NodoArbol(dato)
            else:
                self._insertar_recursivo(nodo_actual.derecho, dato)
        else:
            # Si el código es igual, no hacemos nada (evitamos duplicados)
            pass

    def buscar_por_codigo(self, codigo):
        """
        Busca una materia por su código.
        Complejidad Promedio: O(log n)
        """
        codigo_buscado = str(codigo).upper()
        return self._buscar_recursivo(self.raiz, codigo_buscado)

    def _buscar_recursivo(self, nodo_actual, codigo):
        if nodo_actual is None:
            return None
        
        if codigo == nodo_actual.dato.codigo:
            return nodo_actual.dato
        elif codigo < nodo_actual.dato.codigo:
            return self._buscar_recursivo(nodo_actual.izquierdo, codigo)
        else:
            return self._buscar_recursivo(nodo_actual.derecho, codigo)

    def recorrido_inorden(self):
        """
        Retorna una lista de elementos ordenados por código.
        Complejidad: O(n)
        """
        elementos = []
        self._inorden_recursivo(self.raiz, elementos)
        return elementos

    def _inorden_recursivo(self, nodo_actual, lista):
        if nodo_actual is not None:
            self._inorden_recursivo(nodo_actual.izquierdo, lista)
            if hasattr(nodo_actual.dato, 'to_dict'):
                lista.append(nodo_actual.dato.to_dict())
            else:
                lista.append(nodo_actual.dato)
            self._inorden_recursivo(nodo_actual.derecho, lista)
