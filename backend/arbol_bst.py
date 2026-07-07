class NodoArbol:
    def __init__(self, dato):
        self.dato = dato 
        self.izquierdo = None
        self.derecho = None

class ArbolMaterias:
    def __init__(self):
        self.raiz = None

    def insertar(self, dato):
        if self.raiz is None:
            self.raiz = NodoArbol(dato)
        else:
            self._insertar_recursivo(self.raiz, dato)

    def _insertar_recursivo(self, nodo_actual, dato):
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
            pass

    def buscar_por_codigo(self, codigo):
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
