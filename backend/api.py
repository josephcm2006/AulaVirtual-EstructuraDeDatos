import json
import os
import datetime
import webview
from backend.modelos import Estudiante, Materia, Tarea, Accion, Docente
from backend.pila import PilaHistorial
from backend.cola import ColaTareas
from backend.lista_enlazada import ListaEnlazadaEstudiantes
from backend.arbol_bst import ArbolMaterias

class Api:
    def __init__(self):
        self.historial = PilaHistorial()
        self.tareas_pendientes = ColaTareas()
        self.estudiantes = ListaEnlazadaEstudiantes()
        self.docentes = ListaEnlazadaEstudiantes()
        self.materias = ArbolMaterias()
        self.incidencias_resueltas = []
        self.carreras = ["Ingeniería en Sistemas", "Software", "Tecnologias de la Información", "Biología"]
        
        # Ruta del archivo JSON para credenciales de usuarios
        self.ruta_usuarios = os.path.join(os.path.dirname(__file__), 'usuarios.json')
        self._inicializar_usuarios()
        
        # Ruta de la base de datos JSON
        self.ruta_db = os.path.join(os.path.dirname(__file__), 'db.json')
        self._cargar_db()
        
        self._registrar_accion("Sistema Sapiens iniciado")
        print("API de Sapiens inicializada. Estructuras listas.")

    def _inicializar_usuarios(self):
        if not os.path.exists(self.ruta_usuarios):
            default_users = {
                "estudiante@gmail.com": {"password": "123456", "role": "estudiante", "nombre": "Joseph Coello"},
                "docente@gmail.com": {"password": "123456", "role": "docente", "nombre": "Docente Sapiens"},
                "admin@gmail.com": {"password": "123456", "role": "admin", "nombre": "Administrador Sapiens"}
            }
            try:
                with open(self.ruta_usuarios, 'w', encoding='utf-8') as f:
                    json.dump(default_users, f, indent=4, ensure_ascii=False)
            except Exception as e:
                print(f"Error inicializando usuarios.json: {e}")

    def _cargar_usuarios(self):
        self._inicializar_usuarios()
        try:
            with open(self.ruta_usuarios, 'r', encoding='utf-8') as f:
                return json.load(f)
        except Exception as e:
            print(f"Error cargando usuarios: {e}")
            return {}

    def _guardar_usuarios(self, usuarios):
        try:
            with open(self.ruta_usuarios, 'w', encoding='utf-8') as f:
                json.dump(usuarios, f, indent=4, ensure_ascii=False)
        except Exception as e:
            print(f"Error guardando usuarios: {e}")

    def _cargar_db(self):
        if not os.path.exists(self.ruta_db):
            return
        try:
            with open(self.ruta_db, 'r', encoding='utf-8') as f:
                data = json.load(f)
            
            # Cargar carreras
            carreras_raw = data.get("carreras", ["Ingeniería en Sistemas", "Software", "Tecnologias de la Información", "Biología"])
            self.carreras = []
            for c in carreras_raw:
                if isinstance(c, dict):
                    self.carreras.append(c)
                else:
                    self.carreras.append({
                        "nombre": str(c),
                        "semestres": 10,
                        "descripcion": "Sin descripción"
                    })

            # Cargar estudiantes
            for est_data in data.get("estudiantes", []):
                est = Estudiante(
                    identificacion=est_data["identificacion"],
                    nombre=est_data["nombre"],
                    carrera=est_data["carrera"],
                    semestre=est_data.get("semestre", "1"),
                    fecha_registro=est_data.get("fecha_registro"),
                    calificaciones=est_data.get("calificaciones"),
                    entregas=est_data.get("entregas")
                )
                self.estudiantes.insertar_al_final(est)

            # Cargar docentes
            for doc_data in data.get("docentes", []):
                doc = Docente(
                    identificacion=doc_data["identificacion"],
                    nombre=doc_data["nombre"],
                    carrera=doc_data["carrera"],
                    especialidad=doc_data.get("especialidad", "General"),
                    fecha_registro=doc_data.get("fecha_registro")
                )
                self.docentes.insertar_al_final(doc)
                
            # Cargar materias
            for mat_data in data.get("materias", []):
                mat = Materia(
                    codigo=mat_data["codigo"],
                    nombre=mat_data["nombre"],
                    creditos=mat_data["creditos"],
                    horario=mat_data.get("horario", "Por definir"),
                    deberes=mat_data.get("deberes"),
                    paralelo=mat_data.get("paralelo", "A"),
                    docente_email=mat_data.get("docente_email"),
                    docente_nombre=mat_data.get("docente_nombre"),
                    imagen=mat_data.get("imagen"),
                    estudiantes_inscritos=mat_data.get("estudiantes_inscritos", []),
                    semestre=mat_data.get("semestre", "1"),
                    carreras=mat_data.get("carreras", [])
                )
                self.materias.insertar(mat)
                
            # Cargar tareas (incidencias pendientes)
            for tar_data in data.get("tareas", []):
                tar = Tarea(
                    tar_data["id_tarea"],
                    tar_data["descripcion"],
                    email_estudiante=tar_data.get("email_estudiante"),
                    respuesta_docente=tar_data.get("respuesta_docente", ""),
                    nombre_docente=tar_data.get("nombre_docente")
                )
                tar.estado = tar_data.get("estado", "Pendiente")
                tar.fecha_creacion = tar_data.get("fecha_creacion")
                self.tareas_pendientes.enqueue(tar)

            # Cargar incidencias resueltas
            self.incidencias_resueltas = []
            for inc_data in data.get("incidencias_resueltas", []):
                inc = Tarea(
                    inc_data["id_tarea"],
                    inc_data["descripcion"],
                    email_estudiante=inc_data.get("email_estudiante"),
                    respuesta_docente=inc_data.get("respuesta_docente", ""),
                    nombre_docente=inc_data.get("nombre_docente")
                )
                inc.estado = inc_data.get("estado", "Atendida")
                inc.fecha_creacion = inc_data.get("fecha_creacion")
                self.incidencias_resueltas.append(inc)
                
            # Cargar historial (inverso para mantener el push LIFO)
            historial_list = data.get("historial", [])
            for acc_data in reversed(historial_list):
                acc = Accion(acc_data["descripcion"], acc_data.get("destinatarios"))
                acc.hora = acc_data.get("hora")
                acc.timestamp = acc_data.get("timestamp", int(datetime.datetime.now().timestamp() * 1000))
                self.historial.push(acc)
                
        except Exception as e:
            print(f"Error cargando db.json: {e}")

    def _guardar_db(self):
        try:
            data = {
                "estudiantes": self.estudiantes.obtener_todos(),
                "docentes": self.docentes.obtener_todos(),
                "materias": self.materias.recorrido_inorden(),
                "tareas": self.tareas_pendientes.obtener_elementos(),
                "incidencias_resueltas": [inc.to_dict() for inc in self.incidencias_resueltas],
                "historial": self.historial.obtener_elementos(),
                "carreras": self.carreras
            }
            with open(self.ruta_db, 'w', encoding='utf-8') as f:
                json.dump(data, f, indent=4, ensure_ascii=False)
        except Exception as e:
            print(f"Error guardando db.json: {e}")

    def _registrar_accion(self, descripcion, destinatarios=None):
        accion = Accion(descripcion, destinatarios)
        self.historial.push(accion)
        self._guardar_db()

    def login(self, email, password):
        self._registrar_accion(f"Intento de login: {email}", destinatarios=["admin_log"])
        
        usuarios = self._cargar_usuarios()
        
        if email in usuarios and usuarios[email]["password"] == password:
            role = usuarios[email]["role"]
            nombre = usuarios[email].get("nombre", "Usuario")
            self._registrar_accion(f"Login exitoso como {role}: {email}", destinatarios=["admin_log"])
            return {
                "success": True, 
                "message": "Inicio de sesión exitoso", 
                "role": role,
                "nombre": nombre,
                "email": email
            }
        else:
            self._registrar_accion(f"Login fallido para: {email}", destinatarios=["admin_log"])
            return {"success": False, "message": "Credenciales incorrectas"}

    def agregar_carrera(self, nombre, semestres=10, descripcion=""):
        if not nombre:
            return {"success": False, "message": "El nombre de la carrera no puede estar vacío"}
        nombre_clean = nombre.strip()
        for c in self.carreras:
            if c["nombre"].lower() == nombre_clean.lower():
                return {"success": False, "message": "La carrera ya existe"}
        self.carreras.append({
            "nombre": nombre_clean,
            "semestres": int(semestres),
            "descripcion": descripcion
        })
        self._guardar_db()
        self._registrar_accion(f"Carrera registrada: {nombre_clean}", destinatarios=["admin", "docente", "estudiante"])
        return {"success": True, "message": f"Carrera '{nombre_clean}' creada con éxito"}

    def obtener_carreras(self):
        return self.carreras

    def agregar_estudiante(self, identificacion, nombre, carrera, semestre="1", materias=None):
        if not identificacion or not nombre or not carrera or not semestre:
            return {"success": False, "message": "Datos incompletos"}

        if self.estudiantes.buscar_por_identificacion(identificacion):
            return {"success": False, "message": "El estudiante ya existe"}

        carreras_list = carrera if isinstance(carrera, list) else [carrera]
        if len(carreras_list) < 1 or len(carreras_list) > 2:
            return {"success": False, "message": "Debe seleccionar entre 1 y 2 carreras para el estudiante"}

        if materias:
            if len(materias) > 5:
                return {"success": False, "message": "Un estudiante solo puede pertenecer a un máximo de 5 materias"}
            # Check parallel rule
            base_subjects = {}
            for mat_code in materias:
                base = mat_code.split('-')[0].upper()
                if base in base_subjects:
                    return {"success": False, "message": "Un estudiante no puede estar en 2 paralelos distintos de la misma materia"}
                base_subjects[base] = mat_code

        nuevo_estudiante = Estudiante(identificacion, nombre, carreras_list, semestre=semestre, calificaciones=[])
        self.estudiantes.insertar_al_final(nuevo_estudiante)
        
        email_estudiante = f"{identificacion}@gmail.com"
        usuarios = self._cargar_usuarios()
        usuarios[email_estudiante] = {
            "password": "123456",
            "role": "estudiante",
            "nombre": nombre
        }
        self._guardar_usuarios(usuarios)
        
        # Enrol in selected materias
        if materias:
            for mat_code in materias:
                materia = self.materias.buscar_por_codigo(mat_code.upper())
                if materia:
                    if identificacion not in materia.estudiantes_inscritos:
                        materia.estudiantes_inscritos.append(identificacion)

        self._guardar_db()
        self._registrar_accion(f"Estudiante registrado: {nombre} ({email_estudiante})", destinatarios=["admin", email_estudiante])
        return {"success": True, "message": f"Estudiante registrado con éxito. Su usuario es: {email_estudiante}"}

    def obtener_estudiantes(self):
        return self.estudiantes.obtener_todos()

    def agregar_docente(self, identificacion, nombre, carrera, materias=None, especialidad="General"):
        if not identificacion or not nombre or not carrera:
            return {"success": False, "message": "Datos incompletos"}

        if self.docentes.buscar_por_identificacion(identificacion):
            return {"success": False, "message": "El docente ya existe"}

        if materias and len(materias) > 5:
            return {"success": False, "message": "Un docente solo puede ser asignado a un máximo de 5 materias"}

        carreras_list = carrera if isinstance(carrera, list) else [carrera]
        nuevo_docente = Docente(identificacion, nombre, carreras_list, especialidad=especialidad)
        self.docentes.insertar_al_final(nuevo_docente)
        
        email_docente = f"{identificacion}@gmail.com"
        usuarios = self._cargar_usuarios()
        usuarios[email_docente] = {
            "password": "123456",
            "role": "docente",
            "nombre": nombre
        }
        self._guardar_usuarios(usuarios)
        
        # Assign to selected materias
        if materias:
            for mat_code in materias:
                materia = self.materias.buscar_por_codigo(mat_code.upper())
                if materia:
                    materia.docente_email = email_docente
                    materia.docente_nombre = nombre

        self._guardar_db()
        self._registrar_accion(f"Docente registrado: {nombre} ({email_docente})", destinatarios=["admin", email_docente])
        return {"success": True, "message": f"Docente registrado con éxito. Su usuario es: {email_docente}"}

    def asociar_materia_carrera(self, nombre_carrera, codigo_materia, semestre):
        materia = self.materias.buscar_por_codigo(codigo_materia.upper())
        if not materia:
            return {"success": False, "message": "Materia no encontrada"}
        
        # Enforce maximum 5 subjects per semester in a career
        todas_materias = self.materias.recorrido_inorden()
        conteo = 0
        for mat in todas_materias:
            if nombre_carrera in mat.get("carreras", []) and str(mat.get("semestre", "1")) == str(semestre):
                conteo += 1
                
        if nombre_carrera in materia.carreras and str(materia.semestre) == str(semestre):
            return {"success": True, "message": "La materia ya está vinculada a esta carrera en este semestre"}
            
        if conteo >= 5:
            return {"success": False, "message": f"No se pueden vincular más de 5 materias al semestre {semestre} de la carrera '{nombre_carrera}'"}

        if nombre_carrera not in materia.carreras:
            materia.carreras.append(nombre_carrera)
        materia.semestre = str(semestre)
        
        self._guardar_db()
        self._registrar_accion(f"Materia {codigo_materia} vinculada a carrera {nombre_carrera} en semestre {semestre}", destinatarios=["admin"])
        return {"success": True, "message": f"Materia '{materia.nombre}' vinculada con éxito a la carrera '{nombre_carrera}'"}

    def desasociar_materia_carrera(self, nombre_carrera, codigo_materia):
        materia = self.materias.buscar_por_codigo(codigo_materia.upper())
        if not materia:
            return {"success": False, "message": "Materia no encontrada"}
            
        if nombre_carrera in materia.carreras:
            materia.carreras.remove(nombre_carrera)
            self._guardar_db()
            self._registrar_accion(f"Materia {codigo_materia} desvinculada de carrera {nombre_carrera}", destinatarios=["admin"])
            return {"success": True, "message": f"Materia '{materia.nombre}' desvinculada con éxito de la carrera '{nombre_carrera}'"}
            
        return {"success": False, "message": "La materia no estaba vinculada a esta carrera"}

    def obtener_docentes(self):
        return self.docentes.obtener_todos()

    def obtener_datos_estudiante(self, email):
        usuarios = self._cargar_usuarios()
        nombre = "Estudiante"
        if email in usuarios:
            nombre = usuarios[email].get("nombre", "Estudiante")
            
        identificacion = email.split('@')[0]
        est = self.estudiantes.buscar_por_identificacion(identificacion)
        if est:
            data = est.to_dict()
            data["nombre"] = nombre
            return data
        return None

    def agregar_materia(self, codigo, nombre, creditos, horario="Por definir", paralelo="A", docente_email=None, docente_nombre=None, imagen=None, semestre="1", carreras=None):
        if not codigo or not nombre or not paralelo:
            return {"success": False, "message": "Datos incompletos"}
            
        codigo_str = f"{str(codigo).upper()}-{str(paralelo).upper()}"
        if self.materias.buscar_por_codigo(codigo_str):
            return {"success": False, "message": f"La materia con código {codigo.upper()} y paralelo {paralelo} ya existe"}

        nueva_materia = Materia(
            codigo=codigo_str, 
            nombre=nombre, 
            creditos=creditos, 
            horario=horario, 
            paralelo=paralelo, 
            docente_email=docente_email, 
            docente_nombre=docente_nombre, 
            imagen=imagen,
            semestre=semestre,
            carreras=carreras
        )
        self.materias.insertar(nueva_materia)
        self._guardar_db()
        self._registrar_accion(f"Materia registrada por administrador: {nombre} ({codigo_str})", destinatarios=["admin"])
        return {"success": True, "message": "Materia agregada con éxito"}

    def buscar_materia(self, codigo):
        if not codigo:
            return {"success": False, "message": "Código vacío"}
        materia = self.materias.buscar_por_codigo(codigo)
        if materia:
            self._registrar_accion(f"Búsqueda exitosa de materia: {codigo}", destinatarios=["admin_log"])
            return {"success": True, "data": materia.to_dict()}
        else:
            self._registrar_accion(f"Búsqueda fallida de materia: {codigo}", destinatarios=["admin_log"])
            return {"success": False, "message": "Materia no encontrada"}

    def obtener_materias(self):
        return self.materias.recorrido_inorden()

    def agregar_tarea(self, descripcion):
        if not descripcion:
            return {"success": False, "message": "Descripción vacía"}
        
        id_tarea = self.tareas_pendientes.tamaño + 1
        nueva_tarea = Tarea(id_tarea, descripcion)
        self.tareas_pendientes.enqueue(nueva_tarea)
        self._registrar_accion(f"Solicitud registrada: {descripcion}", destinatarios=["admin"])
        return {"success": True, "message": "Solicitud registrada con éxito"}

    def completar_tarea(self):
        if self.tareas_pendientes.esta_vacia():
            return {"success": False, "message": "No hay solicitudes pendientes en espera"}
        
        tarea_completada = self.tareas_pendientes.dequeue()
        self._registrar_accion(f"Solicitud atendida: {tarea_completada.descripcion}", destinatarios=["admin"])
        return {"success": True, "message": f"Solicitud '{tarea_completada.descripcion}' atendida con éxito", "tarea": tarea_completada.to_dict()}

    def obtener_tareas(self):
        return self.tareas_pendientes.obtener_elementos()

    def obtener_historial(self):
        return self.historial.obtener_elementos()

    def limpiar_historial(self):
        while not self.historial.esta_vacia():
            self.historial.pop()
        self._guardar_db()
        return {"success": True, "message": "Historial de registro de acciones limpiado con éxito"}

    def set_window(self, window):
        self._window = window

    def seleccionar_archivo(self):
        window = getattr(self, '_window', None) or webview.active_window()
        if window:
            file_types = ('Todos los archivos (*.*)',)
            result = window.create_file_dialog(webview.OPEN_DIALOG, allow_multiple=False, file_types=file_types)
            if result and len(result) > 0:
                return result[0]
        return None

    def agregar_deber(self, codigo_materia, semana, titulo, descripcion, puntos=10, fecha_limite="", formato=""):
        materia = self.materias.buscar_por_codigo(codigo_materia.upper())
        if not materia:
            return {"success": False, "message": "Materia no encontrada"}
        
        semana_str = str(semana)
        if semana_str not in materia.deberes:
            materia.deberes[semana_str] = []
            
        deber = {
            "id": f"deb-{semana}-{len(materia.deberes[semana_str]) + 1}",
            "titulo": titulo,
            "descripcion": descripcion,
            "puntos": puntos,
            "fecha_limite": fecha_limite,
            "formato": formato
        }
        materia.deberes[semana_str].append(deber)
        
        # Get list of enrolled students
        est_ids = getattr(materia, 'estudiantes_inscritos', [])
        dest_list = [f"{est_id}@gmail.com" for est_id in est_ids]
        dest_list.append("admin")
        if materia.docente_email:
            dest_list.append(materia.docente_email)

        self._registrar_accion(f"Nueva tarea en {codigo_materia} - Semana {semana}: {titulo}", destinatarios=dest_list)
        return {"success": True, "message": "Tarea creada con éxito"}

    def subir_deber(self, email_estudiante, codigo_materia, semana, deber_id, ruta_archivo):
        if not ruta_archivo or not os.path.exists(ruta_archivo):
            return {"success": False, "message": "Archivo no seleccionado o no encontrado"}
            
        import shutil
        import datetime
        
        # Obtener workspace_dir
        workspace_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        tareas_dir = os.path.join(workspace_dir, 'tareas_entregadas')
        if not os.path.exists(tareas_dir):
            os.makedirs(tareas_dir)
            
        identificacion = email_estudiante.split('@')[0]
        est = self.estudiantes.buscar_por_identificacion(identificacion)
        if not est:
            return {"success": False, "message": "Estudiante no encontrado"}
            
        nombre_archivo = os.path.basename(ruta_archivo)
        import re
        nombre_estudiante_clean = re.sub(r'[^a-zA-Z0-9_]', '_', est.nombre)
        nombre_archivo_clean = re.sub(r'[^a-zA-Z0-9_\.-]', '_', nombre_archivo)
        
        dest_filename = f"{nombre_estudiante_clean}_{nombre_archivo_clean}"
        dest_dir = os.path.join(tareas_dir, codigo_materia.upper(), f"Semana_{semana}", deber_id)
        if not os.path.exists(dest_dir):
            os.makedirs(dest_dir)
            
        dest_path = os.path.join(dest_dir, dest_filename)
        
        try:
            shutil.copy2(ruta_archivo, dest_path)
        except Exception as e:
            return {"success": False, "message": f"Error al guardar el archivo: {str(e)}"}
            
        key = f"{codigo_materia.upper()}-{semana}-{deber_id}"
        rel_path = os.path.relpath(dest_path, workspace_dir)
        
        est.entregas[key] = {
            "estado": "Entregado",
            "archivo_nombre": nombre_archivo,
            "archivo_ruta": rel_path.replace("\\", "/"),
            "fecha_entrega": datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        }
        
        # Obtener email del docente
        materia = self.materias.buscar_por_codigo(codigo_materia.upper())
        docente_email = materia.docente_email if materia else None
        dest_list = [email_estudiante, "admin"]
        if docente_email:
            dest_list.append(docente_email)

        self._guardar_db()
        self._registrar_accion(f"Estudiante {est.nombre} entregó tarea en {codigo_materia}: {nombre_archivo}", destinatarios=dest_list)
        return {"success": True, "message": "Tarea subida con éxito y guardada en la carpeta de entregas."}

    def abrir_archivo_entrega(self, ruta_relativa):
        workspace_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        abs_path = os.path.abspath(os.path.join(workspace_dir, ruta_relativa))
        if os.path.exists(abs_path):
            import platform
            import subprocess
            try:
                if platform.system() == 'Windows':
                    os.startfile(abs_path)
                elif platform.system() == 'Darwin':
                    subprocess.Popen(['open', abs_path])
                else:
                    subprocess.Popen(['xdg-open', abs_path])
                return {"success": True, "message": "Archivo abierto"}
            except Exception as e:
                return {"success": False, "message": f"Error al abrir archivo: {str(e)}"}
        else:
            return {"success": False, "message": "El archivo no existe en el sistema."}

    def obtener_entregas_deber(self, codigo_materia, semana, deber_id):
        key = f"{codigo_materia.upper()}-{semana}-{deber_id}"
        resultados = []
        
        materia = self.materias.buscar_por_codigo(codigo_materia.upper())
        inscritos = materia.estudiantes_inscritos if materia else []
        
        lista_estudiantes = self.estudiantes.obtener_todos()
        lista_estudiantes = [est for est in lista_estudiantes if est["identificacion"] in inscritos]
        for est_data in lista_estudiantes:
            entregas = est_data.get("entregas", {})
            entrega = entregas.get(key)
            
            detalles_entrega = None
            if entrega:
                if isinstance(entrega, dict):
                    detalles_entrega = entrega
                else:
                    detalles_entrega = {
                        "estado": "Entregado",
                        "archivo_nombre": "Archivo de simulación",
                        "archivo_ruta": "",
                        "fecha_entrega": "N/D"
                    }
                    
            resultados.append({
                "identificacion": est_data["identificacion"],
                "nombre": est_data["nombre"],
                "carrera": est_data["carrera"],
                "entrega": detalles_entrega
            })
            
        return resultados

    def calificar_entrega(self, estudiante_id, codigo_materia, semana, deber_id, nota):
        est = self.estudiantes.buscar_por_identificacion(estudiante_id)
        if not est:
            return {"success": False, "message": "Estudiante no encontrado"}
            
        key = f"{codigo_materia.upper()}-{semana}-{deber_id}"
        
        # Verify if delivery exists, if not, create it as graded
        if key not in est.entregas:
            est.entregas[key] = {
                "estado": "Entregado",
                "archivo_nombre": "Calificado sin archivo",
                "archivo_ruta": "",
                "fecha_entrega": datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
                "nota": float(nota)
            }
        else:
            if not isinstance(est.entregas[key], dict):
                est.entregas[key] = {
                    "estado": "Entregado",
                    "archivo_nombre": "Archivo de simulación",
                    "archivo_ruta": "",
                    "fecha_entrega": "N/D",
                    "nota": float(nota)
                }
            else:
                est.entregas[key]["nota"] = float(nota)
                
        # Obtener email del docente
        materia = self.materias.buscar_por_codigo(codigo_materia.upper())
        docente_email = materia.docente_email if materia else None
        dest_list = [f"{estudiante_id}@gmail.com", "admin"]
        if docente_email:
            dest_list.append(docente_email)

        self._guardar_db()
        self._registrar_accion(f"Calificación registrada para {est.nombre} en {codigo_materia}: {nota}", destinatarios=dest_list)
        return {"success": True, "message": "Calificación guardada con éxito"}

    def guardar_promedio_materia(self, estudiante_id, codigo_materia, promedio):
        est = self.estudiantes.buscar_por_identificacion(estudiante_id)
        if not est:
            return {"success": False, "message": "Estudiante no encontrado"}
            
        materia_obj = self.materias.buscar_por_codigo(codigo_materia.upper())
        materia_nombre = materia_obj.nombre if materia_obj else codigo_materia
        
        encontrado = False
        for c in est.calificaciones:
            if c["materia"].upper() == materia_nombre.upper() or c["materia"].upper() == codigo_materia.upper():
                c["nota"] = float(promedio)
                encontrado = True
                break
                
        if not encontrado:
            est.calificaciones.append({
                "materia": materia_nombre,
                "nota": float(promedio)
            })
            
        dest_list = [f"{estudiante_id}@gmail.com", "admin"]
        if materia_obj and materia_obj.docente_email:
            dest_list.append(materia_obj.docente_email)

        self._guardar_db()
        self._registrar_accion(f"Promedio general de {codigo_materia} guardado para {est.nombre}: {promedio}", destinatarios=dest_list)
        return {"success": True, "message": f"Promedio de {promedio} registrado con éxito para {est.nombre}"}

    def agregar_incidencia(self, email_estudiante, descripcion):
        if not descripcion:
            return {"success": False, "message": "Descripción vacía"}
        
        id_tarea = self.tareas_pendientes.tamaño + 1
        nueva_tarea = Tarea(
            id_tarea, 
            descripcion, 
            email_estudiante=email_estudiante,
            respuesta_docente="",
            nombre_docente=""
        )
        self.tareas_pendientes.enqueue(nueva_tarea)
        self._guardar_db()
        self._registrar_accion(f"Incidencia #{id_tarea} reportada por {email_estudiante}", destinatarios=[email_estudiante, "admin", "docente"])
        return {"success": True, "message": "Incidencia reportada con éxito a la cola de espera"}

    def atender_incidencia(self, email_docente, respuesta_docente):
        if self.tareas_pendientes.esta_vacia():
            return {"success": False, "message": "No hay incidencias en la cola"}
            
        usuarios = self._cargar_usuarios()
        nombre_docente = usuarios.get(email_docente, {}).get("nombre", "Docente")
        
        incidencia = self.tareas_pendientes.dequeue()
        incidencia.estado = "Atendida"
        incidencia.respuesta_docente = respuesta_docente
        incidencia.nombre_docente = nombre_docente
        
        if not hasattr(self, 'incidencias_resueltas'):
            self.incidencias_resueltas = []
            
        self.incidencias_resueltas.append(incidencia)
        self._guardar_db()
        
        self._registrar_accion(f"El docente {nombre_docente} ha respondido a tu incidencia #{incidencia.id_tarea}", destinatarios=[incidencia.email_estudiante, email_docente, "admin"])
        return {"success": True, "message": f"Incidencia #{incidencia.id_tarea} resuelta y respondida con éxito."}

    def obtener_incidencias_resueltas(self, email_estudiante):
        if not hasattr(self, 'incidencias_resueltas'):
            self.incidencias_resueltas = []
        res = [inc.to_dict() for inc in self.incidencias_resueltas if inc.email_estudiante == email_estudiante]
        res.reverse()
        return res

    def guardar_imagen_materia(self, codigo_materia, ruta_imagen):
        if not ruta_imagen or not os.path.exists(ruta_imagen):
            return {"success": False, "message": "Imagen no encontrada"}
            
        import shutil
        workspace_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        assets_dir = os.path.join(workspace_dir, 'frontend', 'assets', 'materias')
        if not os.path.exists(assets_dir):
            os.makedirs(assets_dir)
            
        ext = os.path.splitext(ruta_imagen)[1]
        dest_filename = f"{codigo_materia.upper().replace('-', '_')}{ext}"
        dest_path = os.path.join(assets_dir, dest_filename)
        
        try:
            shutil.copy2(ruta_imagen, dest_path)
            rel_path = f"assets/materias/{dest_filename}"
            
            materia = self.materias.buscar_por_codigo(codigo_materia.upper())
            if materia:
                materia.imagen = rel_path
                self._guardar_db()
                return {"success": True, "imagen_path": rel_path, "message": "Imagen guardada con éxito"}
            return {"success": False, "message": "Materia no encontrada"}
        except Exception as e:
            return {"success": False, "message": f"Error al guardar imagen: {str(e)}"}

    def modificar_materia(self, codigo, creditos, horario, paralelo, imagen=None):
        materia = self.materias.buscar_por_codigo(codigo.upper())
        if not materia:
            return {"success": False, "message": "Materia no encontrada"}
            
        materia.creditos = int(creditos)
        materia.horario = horario
        materia.paralelo = paralelo
        if imagen:
            materia.imagen = imagen

        # Obtener lista de destinatarios (docente y estudiantes inscritos)
        est_ids = getattr(materia, 'estudiantes_inscritos', [])
        dest_list = [f"{est_id}@gmail.com" for est_id in est_ids]
        dest_list.append("admin")
        if materia.docente_email:
            dest_list.append(materia.docente_email)

        self._guardar_db()
        self._registrar_accion(f"Materia {materia.nombre} ({materia.codigo}) modificada por docente", destinatarios=dest_list)
        return {"success": True, "message": "Materia modificada con éxito"}

    def asignar_docente_materia(self, codigo_materia, docente_email):
        materia = self.materias.buscar_por_codigo(codigo_materia.upper())
        if not materia:
            return {"success": False, "message": "Materia no encontrada"}
            
        docente_nombre = "Sin asignar"
        if docente_email:
            usuarios = self._cargar_usuarios()
            docente_nombre = usuarios.get(docente_email, {}).get("nombre", "Docente")
        else:
            docente_email = None
            
        materia.docente_email = docente_email
        materia.docente_nombre = docente_nombre
        
        dest_list = ["admin"]
        if docente_email:
            dest_list.append(docente_email)

        self._guardar_db()
        self._registrar_accion(f"Docente {docente_nombre} asignado a materia {materia.nombre} ({materia.codigo})", destinatarios=dest_list)
        return {"success": True, "message": f"Docente {docente_nombre} asignado con éxito a la materia"}

    def obtener_estudiantes_materia(self, codigo_materia):
        materia = self.materias.buscar_por_codigo(codigo_materia.upper())
        if not materia:
            return []
        inscritos = materia.estudiantes_inscritos
        todos = self.estudiantes.obtener_todos()
        return [est for est in todos if est["identificacion"] in inscritos]

    def obtener_estudiantes_elegibles_materia(self, codigo_materia, carrera_contexto=None):
        codigo_base = codigo_materia.split('-')[0].upper()
        inscritos_misma_materia = set()
        todas_materias = self.materias.recorrido_inorden()
        for mat in todas_materias:
            m_base = mat["codigo"].split('-')[0].upper()
            if m_base == codigo_base:
                for est_id in mat.get("estudiantes_inscritos", []):
                    inscritos_misma_materia.add(est_id)
        todos_estudiantes = self.estudiantes.obtener_todos()
        
        elegibles = []
        for est in todos_estudiantes:
            if est["identificacion"] in inscritos_misma_materia:
                continue
            if carrera_contexto:
                c_list = est.get("carrera", [])
                if isinstance(c_list, str):
                    c_list = [c_list]
                if carrera_contexto not in c_list:
                    continue
            elegibles.append(est)
        return elegibles

    def inscribir_estudiantes_materia(self, codigo_materia, lista_estudiante_ids):
        materia = self.materias.buscar_por_codigo(codigo_materia.upper())
        if not materia:
            return {"success": False, "message": "Materia no encontrada"}
        
        base_code = codigo_materia.split('-')[0].upper()
        todas_materias = self.materias.recorrido_inorden()
        
        for est_id in lista_estudiante_ids:
            for mat in todas_materias:
                m_base = mat["codigo"].split('-')[0].upper()
                m_code = mat["codigo"].upper()
                if m_base == base_code and m_code != codigo_materia.upper():
                    if est_id in mat.get("estudiantes_inscritos", []):
                        est_obj = self.estudiantes.buscar_por_identificacion(est_id)
                        nombre_est = est_obj.nombre if est_obj else est_id
                        return {"success": False, "message": f"El estudiante {nombre_est} ya está inscrito en el paralelo {mat['paralelo']} de esta materia."}

        for est_id in lista_estudiante_ids:
            if est_id not in materia.estudiantes_inscritos:
                materia.estudiantes_inscritos.append(est_id)
                
        # Notificar a estudiantes, docente y admin
        dest_list = ["admin"]
        if materia.docente_email:
            dest_list.append(materia.docente_email)
        dest_list.extend([f"{est_id}@gmail.com" for est_id in lista_estudiante_ids])

        self._guardar_db()
        self._registrar_accion(f"Inscripción de {len(lista_estudiante_ids)} estudiantes en {materia.codigo}", destinatarios=dest_list)
        return {"success": True, "message": f"{len(lista_estudiante_ids)} estudiantes inscritos con éxito en la materia"}

    def desinscribir_estudiante_materia(self, codigo_materia, estudiante_id):
        materia = self.materias.buscar_por_codigo(codigo_materia.upper())
        if not materia:
            return {"success": False, "message": "Materia no encontrada"}
            
        # Notificar a estudiante, docente y admin
        dest_list = ["admin", f"{estudiante_id}@gmail.com"]
        if materia.docente_email:
            dest_list.append(materia.docente_email)

        if estudiante_id in materia.estudiantes_inscritos:
            materia.estudiantes_inscritos.remove(estudiante_id)
            self._guardar_db()
            self._registrar_accion(f"Estudiante {estudiante_id} desinscrito de {materia.codigo}", destinatarios=dest_list)
            return {"success": True, "message": "Estudiante removido de la materia con éxito"}
        return {"success": False, "message": "El estudiante no estaba inscrito en esta materia"}