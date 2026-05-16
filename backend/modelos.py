import datetime

class Estudiante:
    """
    TAD Estudiante: Abstracción de un estudiante universitario.
    Contiene atributos básicos que se utilizarán dentro de las estructuras de datos.
    """
    def __init__(self, identificacion, nombre, carrera):
        self.identificacion = identificacion
        self.nombre = nombre
        self.carrera = carrera
        self.fecha_registro = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    def to_dict(self):
        return {
            "identificacion": self.identificacion,
            "nombre": self.nombre,
            "carrera": self.carrera,
            "fecha_registro": self.fecha_registro
        }


class Materia:
    """
    TAD Materia: Abstracción de un curso/asignatura.
    Utilizaremos el 'codigo' como clave primaria para búsquedas y para
    ordenar el Árbol Binario de Búsqueda.
    """
    def __init__(self, codigo, nombre, creditos, horario="Por definir"):
        self.codigo = str(codigo).upper()  # Clave de ordenamiento
        self.nombre = nombre
        self.creditos = creditos
        self.horario = horario

    def to_dict(self):
        return {
            "codigo": self.codigo,
            "nombre": self.nombre,
            "creditos": self.creditos,
            "horario": self.horario
        }


class Tarea:
    """
    TAD Tarea: Abstracción de una solicitud o tarea pendiente.
    Se utilizará principalmente en la estructura Cola.
    """
    def __init__(self, id_tarea, descripcion):
        self.id_tarea = id_tarea
        self.descripcion = descripcion
        self.estado = "Pendiente"
        self.fecha_creacion = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    def to_dict(self):
        return {
            "id_tarea": self.id_tarea,
            "descripcion": self.descripcion,
            "estado": self.estado,
            "fecha_creacion": self.fecha_creacion
        }


class Accion:
    """
    TAD Accion: Representa un evento en el sistema para el historial.
    Se utilizará en la Pila.
    """
    def __init__(self, descripcion):
        self.descripcion = descripcion
        self.hora = datetime.datetime.now().strftime("%H:%M:%S")

    def to_dict(self):
        return {
            "descripcion": self.descripcion,
            "hora": self.hora
        }
