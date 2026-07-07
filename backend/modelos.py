import datetime

class Estudiante:
    def __init__(self, identificacion, nombre, carrera, semestre="1", fecha_registro=None, calificaciones=None, entregas=None):
        self.identificacion = identificacion
        self.nombre = nombre
        if isinstance(carrera, list):
            self.carreras = carrera
        else:
            self.carreras = [carrera] if carrera else []
        self.carrera = self.carreras[0] if self.carreras else ""
        self.semestre = semestre
        self.fecha_registro = fecha_registro or datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        self.calificaciones = calificaciones or [
            {"materia": "Estructuras de Datos", "nota": 9.5},
            {"materia": "Álgebra Lineal", "nota": 8.0},
            {"materia": "Programación Orientada a Objetos", "nota": 10.0}
        ]
        self.entregas = entregas or {}

    def to_dict(self):
        return {
            "identificacion": self.identificacion,
            "nombre": self.nombre,
            "carrera": self.carreras,
            "semestre": self.semestre,
            "fecha_registro": self.fecha_registro,
            "calificaciones": self.calificaciones,
            "entregas": self.entregas
        }


class Materia:
    def __init__(self, codigo, nombre, creditos, horario="Por definir", deberes=None, paralelo="A", docente_email=None, docente_nombre=None, imagen=None, estudiantes_inscritos=None, semestre="1", carreras=None):
        self.codigo = str(codigo).upper()  # Clave de ordenamiento
        self.nombre = nombre
        self.creditos = creditos
        self.horario = horario
        self.deberes = deberes or {str(i): [] for i in range(1, 17)}
        self.paralelo = paralelo
        self.docente_email = docente_email
        self.docente_nombre = docente_nombre
        self.imagen = imagen
        self.estudiantes_inscritos = estudiantes_inscritos or []
        self.semestre = str(semestre)
        self.carreras = carreras or []

    def to_dict(self):
        return {
            "codigo": self.codigo,
            "nombre": self.nombre,
            "creditos": self.creditos,
            "horario": self.horario,
            "deberes": self.deberes,
            "paralelo": self.paralelo,
            "docente_email": self.docente_email,
            "docente_nombre": self.docente_nombre,
            "imagen": self.imagen,
            "estudiantes_inscritos": self.estudiantes_inscritos,
            "semestre": self.semestre,
            "carreras": self.carreras
        }


class Tarea:
    def __init__(self, id_tarea, descripcion, email_estudiante=None, respuesta_docente="", nombre_docente=None):
        self.id_tarea = id_tarea
        self.descripcion = descripcion
        self.estado = "Pendiente"
        self.fecha_creacion = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        self.email_estudiante = email_estudiante
        self.respuesta_docente = respuesta_docente
        self.nombre_docente = nombre_docente

    def to_dict(self):
        return {
            "id_tarea": self.id_tarea,
            "descripcion": self.descripcion,
            "estado": self.estado,
            "fecha_creacion": self.fecha_creacion,
            "email_estudiante": self.email_estudiante,
            "respuesta_docente": self.respuesta_docente,
            "nombre_docente": self.nombre_docente
        }


class Accion:
    def __init__(self, descripcion, destinatarios=None):
        self.descripcion = descripcion
        self.destinatarios = destinatarios if destinatarios is not None else []
        self.hora = datetime.datetime.now().strftime("%H:%M:%S")
        self.timestamp = int(datetime.datetime.now().timestamp() * 1000)

    def to_dict(self):
        return {
            "descripcion": self.descripcion,
            "hora": self.hora,
            "timestamp": getattr(self, 'timestamp', int(datetime.datetime.now().timestamp() * 1000)),
            "destinatarios": getattr(self, 'destinatarios', [])
        }


class Docente:
    def __init__(self, identificacion, nombre, carrera, especialidad="General", fecha_registro=None):
        self.identificacion = identificacion
        self.nombre = nombre
        if isinstance(carrera, list):
            self.carreras = carrera
        else:
            self.carreras = [carrera] if carrera else []
        self.carrera = self.carreras[0] if self.carreras else ""
        self.especialidad = especialidad
        self.fecha_registro = fecha_registro or datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    def to_dict(self):
        return {
            "identificacion": self.identificacion,
            "nombre": self.nombre,
            "carrera": self.carreras,
            "especialidad": self.especialidad,
            "fecha_registro": self.fecha_registro
        }
