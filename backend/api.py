from backend.modelos import Estudiante, Materia, Tarea, Accion
from backend.pila import PilaHistorial
from backend.cola import ColaTareas
from backend.lista_enlazada import ListaEnlazadaEstudiantes
from backend.arbol_bst import ArbolMaterias

class Api:
    def __init__(self):
        # Inicialización de las Estructuras de Datos
        self.historial = PilaHistorial()
        self.tareas_pendientes = ColaTareas()
        self.estudiantes = ListaEnlazadaEstudiantes()
        self.materias = ArbolMaterias()
        
        # Registrar el inicio del sistema en la pila
        self._registrar_accion("Sistema Sapiens iniciado")
        print("API de Sapiens inicializada. Estructuras listas.")

    def _registrar_accion(self, descripcion):
        """Método interno para registrar acciones en la Pila LIFO."""
        accion = Accion(descripcion)
        self.historial.push(accion)

    def login(self, email, password):
        self._registrar_accion(f"Intento de login: {email}")
        if email == "prueba@gmail.com" and password == "prueba123":
            self._registrar_accion("Login exitoso")
            return {"success": True, "message": "Inicio de sesión exitoso"}
        else:
            self._registrar_accion("Login fallido")
            return {"success": False, "message": "Credenciales incorrectas"}

    # --- METODOS PARA ESTUDIANTES (LISTA ENLAZADA) ---
    def agregar_estudiante(self, identificacion, nombre, carrera):
        if not identificacion or not nombre:
            return {"success": False, "message": "Datos incompletos"}
        
        # Verificamos si ya existe (Búsqueda O(n))
        if self.estudiantes.buscar_por_identificacion(identificacion):
            return {"success": False, "message": "El estudiante ya existe"}

        nuevo_estudiante = Estudiante(identificacion, nombre, carrera)
        self.estudiantes.insertar_al_final(nuevo_estudiante)
        self._registrar_accion(f"Estudiante registrado: {nombre}")
        return {"success": True, "message": "Estudiante agregado con éxito"}

    def obtener_estudiantes(self):
        return self.estudiantes.obtener_todos()

    # --- METODOS PARA MATERIAS (ARBOL BST) ---
    def agregar_materia(self, codigo, nombre, creditos, horario="Por definir"):
        if not codigo or not nombre:
            return {"success": False, "message": "Datos incompletos"}
            
        codigo_str = str(codigo).upper()
        # Búsqueda O(log n)
        if self.materias.buscar_por_codigo(codigo_str):
            return {"success": False, "message": "La materia ya existe"}

        nueva_materia = Materia(codigo_str, nombre, creditos, horario)
        self.materias.insertar(nueva_materia)
        self._registrar_accion(f"Materia registrada: {nombre} ({codigo_str})")
        return {"success": True, "message": "Materia agregada con éxito"}

    def buscar_materia(self, codigo):
        if not codigo:
            return {"success": False, "message": "Código vacío"}
        materia = self.materias.buscar_por_codigo(codigo)
        if materia:
            self._registrar_accion(f"Búsqueda exitosa de materia: {codigo}")
            return {"success": True, "data": materia.to_dict()}
        else:
            self._registrar_accion(f"Búsqueda fallida de materia: {codigo}")
            return {"success": False, "message": "Materia no encontrada"}

    def obtener_materias(self):
        # Retorna la lista en orden alfabético por código (Recorrido In-orden)
        return self.materias.recorrido_inorden()

    # --- METODOS PARA TAREAS (COLA) ---
    def agregar_tarea(self, descripcion):
        if not descripcion:
            return {"success": False, "message": "Descripción vacía"}
        
        id_tarea = self.tareas_pendientes.tamaño + 1
        nueva_tarea = Tarea(id_tarea, descripcion)
        self.tareas_pendientes.enqueue(nueva_tarea)
        self._registrar_accion(f"Tarea encolada: {descripcion}")
        return {"success": True, "message": "Tarea agregada a la cola"}

    def completar_tarea(self):
        if self.tareas_pendientes.esta_vacia():
            return {"success": False, "message": "No hay tareas pendientes"}
        
        tarea_completada = self.tareas_pendientes.dequeue()
        self._registrar_accion(f"Tarea completada: {tarea_completada.descripcion}")
        return {"success": True, "message": f"Tarea '{tarea_completada.descripcion}' completada", "tarea": tarea_completada.to_dict()}

    def obtener_tareas(self):
        return self.tareas_pendientes.obtener_elementos()

    # --- METODOS PARA HISTORIAL (PILA) ---
    def obtener_historial(self):
        return self.historial.obtener_elementos()