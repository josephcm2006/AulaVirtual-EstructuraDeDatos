// ==========================================
// REFERENCIAS AL DOM
// ==========================================

// Vistas
const loginView = document.getElementById('login-view');
const dashboardView = document.getElementById('dashboard-view');

// Formularios
const loginForm = document.getElementById('login-form');
const formEstudiante = document.getElementById('form-estudiante');
const formDocente = document.getElementById('form-docente');
const formMateria = document.getElementById('form-materia');
const formTarea = document.getElementById('form-tarea');

// Botones y Elementos
const btnSkipLogin = document.getElementById('btn-skip-login');
const btnLogout = document.getElementById('btn-logout');
const btnBuscarMateria = document.getElementById('btn-buscar-materia');
const btnCompletarTarea = document.getElementById('btn-completar-tarea');
const btnRefreshHistorial = document.getElementById('btn-refresh-historial');
const btnLimpiarHistorial = document.getElementById('btn-limpiar-historial');
const btnLimpiarNotificaciones = document.getElementById('btn-limpiar-notificaciones');

// Notificaciones
const btnNotificaciones = document.getElementById('btn-notificaciones');
const notifDropdown = document.getElementById('notif-dropdown');
const notifList = document.getElementById('notif-list');
const notifBadge = document.querySelector('.notif-badge');

// Navegación
const navButtons = document.querySelectorAll('.nav-btn[data-target]');
const pageContents = document.querySelectorAll('.page-content');

// ==========================================
// FUNCIONES DE CONTROL DE VISTAS (SPA)
// ==========================================

let userRole = 'docente'; // Rol actual de usuario (docente por defecto)
let currentUserEmail = ''; // Correo del usuario actual

function aplicarRolUI(rol) {
    // 1. Mostrar/ocultar botones de la barra lateral según el rol
    navButtons.forEach(btn => {
        const rolesPermitidos = btn.getAttribute('data-roles');
        if (rolesPermitidos) {
            const listaRoles = rolesPermitidos.split(',');
            if (listaRoles.includes(rol)) {
                btn.style.removeProperty('display');
            } else {
                btn.style.setProperty('display', 'none', 'important');
            }
        }
    });

    // 2. Mostrar/ocultar paneles en la sección de tareas y materias
    const panelAgregarTarea = document.getElementById('panel-agregar-tarea');
    const panelAtenderTarea = document.getElementById('panel-atender-tarea');
    const panelRegMateria = document.getElementById('panel-registrar-materia');
    const panelAdminActionsMaterias = document.getElementById('admin-actions-materias');

    if (rol === 'admin') {
        if (panelRegMateria) panelRegMateria.style.display = 'block';
        if (panelAdminActionsMaterias) panelAdminActionsMaterias.style.display = 'flex';
    } else {
        if (panelRegMateria) panelRegMateria.style.display = 'none';
        if (panelAdminActionsMaterias) panelAdminActionsMaterias.style.display = 'none';
    }

    if (rol === 'estudiante') {
        if (panelAgregarTarea) panelAgregarTarea.style.removeProperty('display');
        if (panelAtenderTarea) panelAtenderTarea.style.setProperty('display', 'none', 'important');
        navigateTo('mi-portal');
    } else if (rol === 'docente') {
        if (panelAgregarTarea) panelAgregarTarea.style.setProperty('display', 'none', 'important');
        if (panelAtenderTarea) panelAtenderTarea.style.removeProperty('display');
        navigateTo('mi-portal');
    } else if (rol === 'admin') {
        if (panelAgregarTarea) panelAgregarTarea.style.setProperty('display', 'none', 'important');
        if (panelAtenderTarea) panelAtenderTarea.style.setProperty('display', 'none', 'important');
        navigateTo('docentes-panel');
    }
}

async function cargarDatosPortal(email) {
    if (!email) return;
    try {
        const title = document.getElementById('welcome-title');
        const titTareas = document.getElementById('portal-tareas-titulo');
        const tblTareas = document.getElementById('portal-tareas-table-container');

        if (userRole === 'estudiante') {
            const student = await window.pywebview.api.obtener_datos_estudiante(email);
            if (student) {
                if (title) title.innerText = `¡Bienvenido, ${student.nombre}!`;
                if (titTareas) titTareas.style.display = 'block';
                if (tblTareas) tblTareas.style.display = 'block';

                // Generar Tareas Pendientes
                const materias = await window.pywebview.api.obtener_materias();
                const pendingTable = document.querySelector('#tabla-tareas-pendientes tbody');

                if (pendingTable) {
                    pendingTable.innerHTML = '';
                    const studentDeliveries = student.entregas || {};
                    const pendingTasks = [];

                    materias.forEach(mat => {
                        for (let weekNum = 1; weekNum <= 16; weekNum++) {
                            const weekTasks = mat.deberes[weekNum.toString()] || [];
                            weekTasks.forEach(task => {
                                const key = `${mat.codigo}-${weekNum}-${task.id}`;
                                const isSubmitted = studentDeliveries[key] && (studentDeliveries[key] === 'Entregado' || (typeof studentDeliveries[key] === 'object' && studentDeliveries[key].estado === 'Entregado'));

                                if (!isSubmitted) {
                                    pendingTasks.push({
                                        materiaCodigo: mat.codigo,
                                        materiaNombre: mat.nombre,
                                        semana: weekNum,
                                        task: task
                                    });
                                }
                            });
                        }
                    });

                    if (pendingTasks.length > 0) {
                        pendingTasks.forEach(pt => {
                            const limitStr = pt.task.fecha_limite ? pt.task.fecha_limite.replace('T', ' ') : 'Sin fecha';
                            pendingTable.innerHTML += `
                                <tr>
                                    <td><strong>${pt.materiaNombre}</strong> <span style="font-size: 0.8rem; color: var(--text-muted);">(${pt.materiaCodigo})</span></td>
                                    <td>${pt.task.titulo} (Semana ${pt.semana})</td>
                                    <td><span style="color: var(--primary); font-weight: 600;"><i class="far fa-calendar-times"></i> ${limitStr}</span></td>
                                    <td>
                                        <button class="action-btn" style="width: auto; margin: 0; padding: 0.3rem 0.8rem; font-size: 0.75rem; border-radius: 20px;" onclick="window.abrirDetalleMateria('${pt.materiaCodigo}', '${pt.materiaNombre.replace(/'/g, "\\'")}')">
                                            <i class="fas fa-chevron-right"></i> Entregar
                                        </button>
                                    </td>
                                </tr>
                            `;
                        });
                    } else {
                        pendingTable.innerHTML = `<tr><td colspan="4" style="text-align: center; color: var(--text-muted); padding: 2rem;">🎉 ¡Excelente! No tienes tareas pendientes.</td></tr>`;
                    }
                }
            }
        } else if (userRole === 'docente') {
            const docentes = await window.pywebview.api.obtener_docentes();
            const doc = docentes.find(d => `${d.identificacion}@gmail.com` === email);
            if (doc) {
                if (title) title.innerText = `¡Bienvenido, Docente ${doc.nombre}!`;
            } else {
                if (title) title.innerText = `¡Bienvenido al Portal Docente!`;
            }
            if (titTareas) titTareas.style.display = 'none';
            if (tblTareas) tblTareas.style.display = 'none';
        }

        // Renderizar Calendario Dinámico
        renderizarCalendario();
    } catch (e) {
        console.error("Error cargando perfil:", e);
    }
}

function showDashboard(rol, nombre, email) {
    userRole = rol || 'docente';
    currentUserEmail = email || (rol === 'estudiante' ? 'estudiante@gmail.com' : 'docente@gmail.com');
    loginView.style.display = 'none';
    dashboardView.style.display = 'flex';
    
    // Aplicar lógica de filtrado de interfaz por rol
    aplicarRolUI(userRole);
    
    // Cargar historial por defecto al entrar
    cargarHistorial();
    cargarMaterias(); // Para llenar el portal
    if (userRole === 'estudiante' || userRole === 'docente') {
        cargarDatosPortal(currentUserEmail);
    }
}

function showLogin() {
    dashboardView.style.display = 'none';
    loginView.style.display = 'flex';
}

function navigateTo(targetId) {
    pageContents.forEach(page => page.style.display = 'none');
    navButtons.forEach(btn => btn.classList.remove('active'));

    const targetElement = document.getElementById(targetId);
    if (targetElement) targetElement.style.display = 'block';

    const activeBtn = Array.from(navButtons).find(btn => btn.dataset.target === targetId);
    if (activeBtn) activeBtn.classList.add('active');

    // Cargar selectores de carreras cuando proceda
    if (targetId === 'estudiantes' || targetId === 'docentes-panel' || targetId === 'cursos' || targetId === 'asignacion-panel') {
        cargarSelectCarreras();
    }

    // Cargar datos dinámicos según la vista
    if (targetId === 'inicio') cargarHistorial();
    if (targetId === 'cursos' || targetId === 'mi-portal') {
        cargarMaterias();
        if (targetId === 'cursos') cargarDocentesSelect();
        if (targetId === 'mi-portal') cargarDatosPortal(currentUserEmail);
    }
    if (targetId === 'estudiantes') cargarEstudiantes();
    if (targetId === 'docentes-panel') cargarDocentes();
    if (targetId === 'carreras-panel') cargarCarreras();
    if (targetId === 'asignacion-panel') cargarAsignacionPanel();
    if (targetId === 'tareas') cargarTareas();
    if (targetId === 'mis-calificaciones') cargarMisCalificacionesPage();
    if (targetId === 'buzon') cargarBuzon();
}

// ==========================================
// LÓGICA CON PYWEBVIEW (ESTRUCTURAS DE DATOS)
// ==========================================

// --- HISTORIAL (PILA) ---
async function cargarHistorial() {
    const tabla = document.querySelector('#tabla-historial tbody');
    try {
        const historial = await window.pywebview.api.obtener_historial();

        // Llenar tabla en vista "Inicio"
        if (tabla) {
            tabla.innerHTML = '';
            historial.forEach(accion => {
                tabla.innerHTML += `
                        <tr>
                            <td>${accion.hora}</td>
                            <td>${accion.descripcion}</td>
                        </tr>
                    `;
            });
        }

        // Llenar dropdown de notificaciones (filtrado por usuario y destinatarios específicos)
        if (notifList) {
            notifList.innerHTML = '';
            
            const notifClearTime = parseInt(localStorage.getItem('notif_clear_time_' + currentUserEmail) || '0');
            const filteredNotifs = historial.filter(acc => {
                if ((acc.timestamp || 0) <= notifClearTime) return false;
                
                const desc = acc.descripcion.toLowerCase();
                // Omitir notificaciones de login y búsquedas para no saturar la campana
                if (desc.includes("login") || desc.includes("búsqueda") || desc.includes("intento de")) return false;
                
                // Filtrado por destinatario
                const dests = acc.destinatarios || [];
                if (dests.length === 0) return true; // Global
                
                const username = currentUserEmail ? currentUserEmail.split('@')[0] : '';
                return dests.includes(currentUserEmail) || dests.includes(userRole) || dests.includes(username);
            });
            
            if (filteredNotifs.length === 0) {
                notifList.innerHTML = '<li style="text-align: center; color: var(--text-muted); padding: 1rem; border-bottom: none;">No tienes nuevas notificaciones</li>';
                notifBadge.style.display = 'none';
            } else {
                filteredNotifs.forEach(accion => {
                    notifList.innerHTML += `
                            <li>
                                <strong>${accion.hora}</strong><br>
                                ${accion.descripcion}
                            </li>
                        `;
                });
                notifBadge.style.display = 'inline-block';
                notifBadge.innerText = filteredNotifs.length;
            }
        }

    } catch (e) { console.error(e); }
}

// --- ESTUDIANTES (LISTA ENLAZADA) ---
async function cargarEstudiantes() {
    const tabla = document.querySelector('#tabla-estudiantes tbody');
    try {
        const estudiantes = await window.pywebview.api.obtener_estudiantes();
        tabla.innerHTML = '';
        estudiantes.forEach(est => {
            tabla.innerHTML += `
                    <tr>
                        <td>${est.identificacion}</td>
                        <td>${est.nombre}</td>
                        <td>${est.carrera}</td>
                        <td>${est.semestre || '1'}</td>
                        <td>${est.fecha_registro}</td>
                    </tr>
                `;
        });
    } catch (e) { console.error(e); }
}

formEstudiante?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('est-id').value;
    const nombre = document.getElementById('est-nombre').value;
    const semestre = document.getElementById('est-semestre').value;

    const checkedCabs = document.querySelectorAll('.est-carrera-cb:checked');
    const carrerasSeleccionadas = Array.from(checkedCabs).map(cb => cb.value);

    if (carrerasSeleccionadas.length === 0) {
        alert("Por favor selecciona al menos una carrera para el estudiante.");
        return;
    }

    const res = await window.pywebview.api.agregar_estudiante(id, nombre, carrerasSeleccionadas, semestre, materiasSeleccionadasEstudiante);
    alert(res.message);
    if (res.success) {
        formEstudiante.reset();
        materiasSeleccionadasEstudiante = [];
        const badge = document.getElementById('materias-seleccionadas-estudiante-badge');
        if (badge) badge.innerText = "Ninguna materia seleccionada";
        cargarEstudiantes();
        cargarHistorial(); // Refrescar notificaciones
    }
});

// --- DOCENTES (LISTA ENLAZADA REUTILIZADA) ---
async function cargarDocentes() {
    const tabla = document.querySelector('#tabla-docentes tbody');
    if (!tabla) return;
    try {
        const docentes = await window.pywebview.api.obtener_docentes();
        tabla.innerHTML = '';
        docentes.forEach(doc => {
            tabla.innerHTML += `
                    <tr>
                        <td>${doc.identificacion}</td>
                        <td>${doc.nombre}</td>
                        <td>${doc.carrera}</td>
                        <td>${doc.fecha_registro}</td>
                    </tr>
                `;
        });
    } catch (e) { console.error(e); }
}

formDocente?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('doc-id').value;
    const nombre = document.getElementById('doc-nombre').value;
    const especialidad = document.getElementById('doc-especialidad').value;

    const checkedCabs = document.querySelectorAll('.doc-carrera-cb:checked');
    const carrerasSeleccionadas = Array.from(checkedCabs).map(cb => cb.value);

    if (carrerasSeleccionadas.length === 0) {
        alert("Por favor selecciona al menos una carrera para el docente.");
        return;
    }

    const res = await window.pywebview.api.agregar_docente(id, nombre, carrerasSeleccionadas, materiasSeleccionadasDocente, especialidad);
    alert(res.message);
    if (res.success) {
        formDocente.reset();
        materiasSeleccionadasDocente = [];
        const badge = document.getElementById('materias-seleccionadas-docente-badge');
        if (badge) badge.innerText = "Ninguna materia seleccionada";
        cargarDocentes();
        cargarHistorial(); // Refrescar notificaciones
    }
});

// --- MATERIAS (ÁRBOL BST) ---
async function cargarMaterias() {
    const tabla = document.querySelector('#tabla-materias tbody');
    const gridEstudiante = document.getElementById('student-subjects-grid');

    try {
        let materias = await window.pywebview.api.obtener_materias();
        
        // Filter materias if user is docente
        if (userRole === 'docente') {
            materias = materias.filter(mat => mat.docente_email === currentUserEmail);
        }
        // Filter materias if user is estudiante
        if (userRole === 'estudiante') {
            const studentId = currentUserEmail.split('@')[0];
            materias = materias.filter(mat => mat.estudiantes_inscritos && mat.estudiantes_inscritos.includes(studentId));
        }

        // Llenar tabla en vista "Cursos"
        if (tabla) {
            tabla.innerHTML = '';
            materias.forEach(mat => {
                const actionHtml = userRole === 'docente' ? `
                    <button class="action-btn secondary-btn" style="width: auto; margin: 0; padding: 0.3rem 0.6rem; font-size: 0.8rem; border-radius: 6px;" onclick="event.stopPropagation(); window.abrirModificarMateria('${mat.codigo}')">
                        <i class="fas fa-edit"></i> Modificar
                    </button>
                ` : '';
                
                tabla.innerHTML += `
                        <tr onclick="window.abrirDetalleMateria('${mat.codigo}', '${mat.nombre.replace(/'/g, "\\'")}')" style="cursor: pointer;">
                            <td><strong>${mat.codigo}</strong></td>
                            <td>${mat.nombre}</td>
                            <td>${mat.creditos}</td>
                            <td>${mat.horario || 'Por definir'}</td>
                            <td>${actionHtml}</td>
                        </tr>
                    `;
            });
        }

        // Llenar Grid en vista "Mi Portal"
        if (gridEstudiante) {
            gridEstudiante.innerHTML = '';
            materias.forEach(mat => {
                const icons = ['fa-laptop-code', 'fa-book', 'fa-flask', 'fa-calculator', 'fa-globe', 'fa-atom'];
                const icon = icons[mat.codigo.length % icons.length];
                
                let imageHtml = `<div class="subject-img"><i class="fas ${icon}"></i></div>`;
                if (mat.imagen) {
                    imageHtml = `<div class="subject-img" style="background-image: url('${mat.imagen}'); background-size: cover; background-position: center; opacity: 1;"></div>`;
                }

                gridEstudiante.innerHTML += `
                        <div class="subject-card" onclick="window.abrirDetalleMateria('${mat.codigo}', '${mat.nombre.replace(/'/g, "\\'")}')" style="cursor: pointer;">
                            ${imageHtml}
                            <div class="subject-info">
                                <h4>${mat.nombre}</h4>
                                <p><i class="fas fa-barcode"></i> Código: ${mat.codigo}</p>
                                <p><i class="far fa-clock"></i> Horario: ${mat.horario || 'Por definir'}</p>
                                <p><i class="fas fa-award"></i> Créditos: ${mat.creditos} | Paralelo: ${mat.paralelo || 'A'}</p>
                                <p><i class="fas fa-chalkboard-teacher"></i> Docente: ${mat.docente_nombre || 'Sin asignar'}</p>
                            </div>
                        </div>
                    `;
            });
        }

    } catch (e) { console.error(e); }
}

formMateria?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const codigo = document.getElementById('mat-codigo').value;
    const nombre = document.getElementById('mat-nombre').value;
    const creditos = document.getElementById('mat-creditos').value;
    const horario = document.getElementById('mat-horario').value;
    const paralelo = document.getElementById('mat-paralelo').value;
    const docenteSelect = document.getElementById('mat-docente');
    const docenteEmail = docenteSelect.value;
    const docenteNombre = docenteSelect.options[docenteSelect.selectedIndex]?.dataset.nombre || '';
    const semestre = document.getElementById('mat-semestre').value;

    const res = await window.pywebview.api.agregar_materia(codigo, nombre, parseInt(creditos), horario, paralelo, docenteEmail, docenteNombre, null, semestre, []);
    alert(res.message);
    if (res.success) {
        formMateria.reset();
        cargarMaterias();
        cargarHistorial(); // Refrescar notificaciones
    }
});

btnBuscarMateria?.addEventListener('click', async () => {
    const codigo = document.getElementById('search-codigo').value;
    const divRes = document.getElementById('resultado-busqueda');
    const res = await window.pywebview.api.buscar_materia(codigo);

    divRes.style.display = 'block';
    if (res.success) {
        divRes.innerHTML = `<i class="fas fa-check-circle" style="color: #10b981;"></i> <strong>Encontrada:</strong> ${res.data.nombre} (${res.data.creditos} créditos)<br>Horario: ${res.data.horario}`;
    } else {
        divRes.innerHTML = `<i class="fas fa-times-circle" style="color: #ef4444;"></i> ${res.message}`;
    }
});

// --- TAREAS (COLA) ---
async function cargarTareas() {
    const tabla = document.querySelector('#tabla-tareas tbody');
    try {
        const tareas = await window.pywebview.api.obtener_tareas();
        tabla.innerHTML = '';
        tareas.forEach(tar => {
            tabla.innerHTML += `
                    <tr>
                        <td>#${tar.id_tarea}</td>
                        <td>${tar.descripcion}</td>
                        <td>${tar.email_estudiante || 'N/D'}</td>
                        <td>${tar.fecha_creacion}</td>
                        <td><span style="color: #f59e0b; font-weight: bold;">${tar.estado}</span></td>
                    </tr>
                `;
        });
    } catch (e) { console.error(e); }
}

formTarea?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const desc = document.getElementById('tar-desc').value;

    const res = await window.pywebview.api.agregar_incidencia(currentUserEmail, desc);
    alert(res.message);
    if (res.success) {
        formTarea.reset();
        cargarTareas();
        cargarHistorial(); // Refrescar notificaciones
    }
});

btnCompletarTarea?.addEventListener('click', async () => {
    const respuestaMsg = document.getElementById('inc-respuesta-mensaje').value;
    if (!respuestaMsg) {
        alert("Por favor ingresa un mensaje de respuesta para resolver la incidencia.");
        return;
    }
    
    const res = await window.pywebview.api.atender_incidencia(currentUserEmail, respuestaMsg);
    alert(res.message);
    if (res.success) {
        document.getElementById('inc-respuesta-mensaje').value = '';
        cargarTareas();
        cargarHistorial(); // Refrescar notificaciones
    }
});


// ==========================================
// EVENTOS BASE Y TEMA
// ==========================================

window.addEventListener('pywebviewready', function () {
    console.log("Motor de Python conectado (Estructuras de datos listas)");

    // --- LOGIN ---
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const respuesta = await window.pywebview.api.login(email, password);

        if (respuesta.success) showDashboard(respuesta.role, respuesta.nombre, respuesta.email);
        else alert(`Error: ${respuesta.message}`);
    });
});

btnSkipLogin.addEventListener('click', () => showDashboard('docente', 'Docente Sapiens', 'docente@gmail.com'));
btnLogout.addEventListener('click', () => showLogin());
btnRefreshHistorial?.addEventListener('click', () => cargarHistorial());

btnLimpiarHistorial?.addEventListener('click', async () => {
    const ok = confirm("¿Estás seguro de que deseas limpiar todo el historial de registro de acciones?");
    if (ok) {
        try {
            const res = await window.pywebview.api.limpiar_historial();
            alert(res.message);
            await cargarHistorial();
        } catch (e) {
            console.error("Error al limpiar historial:", e);
        }
    }
});

btnLimpiarNotificaciones?.addEventListener('click', () => {
    localStorage.setItem('notif_clear_time_' + currentUserEmail, Date.now());
    cargarHistorial();
});

// Dropdown de notificaciones toggle
btnNotificaciones?.addEventListener('click', () => {
    if (notifDropdown.style.display === 'none') {
        notifDropdown.style.display = 'block';
        cargarHistorial(); // Asegurarnos de que esté actualizado
    } else {
        notifDropdown.style.display = 'none';
    }
});

// Cerrar dropdown al hacer clic fuera
document.addEventListener('click', (e) => {
    if (btnNotificaciones && notifDropdown && !btnNotificaciones.contains(e.target) && !notifDropdown.contains(e.target)) {
        notifDropdown.style.display = 'none';
    }
});

navButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
        const target = e.currentTarget.dataset.target;
        navigateTo(target);
    });
});

// Tema Oscuro/Claro
const themeToggleBtn = document.getElementById('theme-toggle');
themeToggleBtn.addEventListener('click', () => {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    if (currentTheme === 'dark') {
        document.documentElement.removeAttribute('data-theme');
        themeToggleBtn.innerHTML = '<i class="fas fa-moon"></i> Modo Oscuro';
        localStorage.setItem('theme', 'light');
    } else {
        document.documentElement.setAttribute('data-theme', 'dark');
        themeToggleBtn.innerHTML = '<i class="fas fa-sun"></i> Modo Claro';
        localStorage.setItem('theme', 'dark');
    }
});

const savedTheme = localStorage.getItem('theme');
if (savedTheme === 'dark') {
    document.documentElement.setAttribute('data-theme', 'dark');
    themeToggleBtn.innerHTML = '<i class="fas fa-sun"></i> Modo Claro';
}

// --- DETALLE DE MATERIA (SEMANAS Y DEBERES) ---
let activeMateriaCodigo = '';
let activeSemana = 1;
let selectedDeberId = '';

window.abrirDetalleMateria = async function(codigo, nombre) {
    activeMateriaCodigo = codigo;
    activeSemana = 1;
    
    // Configurar información de cabecera
    document.getElementById('det-materia-titulo').innerText = nombre;
    document.getElementById('det-materia-info').innerText = `Código: ${codigo}`;
    
    // Ocultar formulario de nueva tarea por si acaso
    document.getElementById('form-nueva-tarea-container').style.display = 'none';
    
    // Controlar visibilidad de botones alumnos/deberes
    const btnDeberes = document.getElementById('btn-mostrar-deberes');
    const btnAlumnos = document.getElementById('btn-mostrar-alumnos');
    const weeksBar = document.querySelector('.weeks-bar-container');
    
    if (userRole === 'docente') {
        if (btnDeberes) btnDeberes.style.display = 'inline-block';
        if (btnAlumnos) btnAlumnos.style.display = 'inline-block';
        btnDeberes?.classList.add('active');
        btnAlumnos?.classList.remove('active');
    } else {
        if (btnDeberes) btnDeberes.style.display = 'none';
        if (btnAlumnos) btnAlumnos.style.display = 'none';
    }
    
    // Mostrar semanas y contenido por defecto
    if (weeksBar) weeksBar.style.display = 'block';
    document.getElementById('titulo-semana-activa').innerText = `Semana 1`;
    
    // Dibujar las 16 semanas en el panel izquierdo
    dibujarSemanas();
    
    // Cambiar de vista
    navigateTo('detalle-materia');
    
    // Cargar los deberes de la semana activa (1)
    await cargarDeberesMateria(activeMateriaCodigo, activeSemana);
};

function dibujarSemanas() {
    const contenedor = document.getElementById('lista-semanas');
    if (!contenedor) return;
    contenedor.innerHTML = '';
    
    for (let i = 1; i <= 16; i++) {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'nav-btn';
        btn.style.width = 'auto';
        btn.style.padding = '0.6rem 1.2rem';
        btn.style.margin = '0 0.25rem';
        btn.style.textAlign = 'center';
        btn.style.fontSize = '0.9rem';
        btn.style.borderRadius = '30px';
        btn.style.whiteSpace = 'nowrap';
        btn.style.display = 'inline-block';
        btn.style.cursor = 'pointer';
        btn.innerHTML = `<i class="far fa-calendar-alt"></i> Sem ${i}`;
        
        if (i === activeSemana) {
            btn.classList.add('active');
            btn.style.background = 'var(--primary-gradient)';
            btn.style.color = 'white';
            btn.style.border = '2px solid var(--primary)';
            btn.style.boxShadow = '0 4px 10px var(--primary-glow)';
        } else {
            btn.style.background = 'transparent';
            btn.style.color = 'var(--text-main)';
            btn.style.border = '2px solid var(--input-border)';
        }
        
        btn.addEventListener('click', async () => {
            activeSemana = i;
            document.getElementById('titulo-semana-activa').innerText = `Semana ${i}`;
            document.getElementById('form-nueva-tarea-container').style.display = 'none';
            dibujarSemanas();
            await cargarDeberesMateria(activeMateriaCodigo, activeSemana);
        });
        
        contenedor.appendChild(btn);
    }
}

async function cargarDeberesMateria(codigo, semana) {
    const btnCrear = document.getElementById('btn-abrir-nueva-tarea');
    const containerDeberes = document.getElementById('lista-deberes');
    if (!containerDeberes) return;
    containerDeberes.innerHTML = '';
    
    // Resetear paneles de acciones de la derecha al cambiar de semana/materia
    document.getElementById('form-nueva-tarea-container').style.display = 'none';
    document.getElementById('panel-ver-entregas-container').style.display = 'none';
    document.getElementById('action-panel-placeholder').style.display = 'block';
    
    // Controlar visibilidad del botón "Crear Tarea" (solo docente)
    if (userRole === 'docente') {
        if (btnCrear) btnCrear.style.display = 'block';
    } else {
        if (btnCrear) btnCrear.style.display = 'none';
    }
    
    try {
        const materias = await window.pywebview.api.obtener_materias();
        const mat = materias.find(m => m.codigo === codigo);
        if (!mat) return;
        
        const deberesList = mat.deberes[semana.toString()] || [];
        
        // Obtener entregas si es estudiante
        let entregas = {};
        if (userRole === 'estudiante') {
            const student = await window.pywebview.api.obtener_datos_estudiante(currentUserEmail);
            if (student) entregas = student.entregas || {};
        }
        
        if (deberesList.length === 0) {
            containerDeberes.innerHTML = `<p style="text-align: center; color: var(--text-muted); padding: 2rem 0;">No hay tareas asignadas para esta semana.</p>`;
            return;
        }
        
        deberesList.forEach(deb => {
            let controlHtml = '';
            
            // Puntos, Límite, Formato
            const puntos = deb.puntos !== undefined ? deb.puntos : 10;
            const limite = deb.fecha_limite ? deb.fecha_limite.replace('T', ' ') : 'N/D';
            const formato = deb.formato || 'Cualquiera';
            
            let extraInfoHtml = `
                <div style="display: flex; gap: 0.5rem; flex-wrap: wrap; margin-top: 0.5rem;">
                    <span style="background: rgba(128, 0, 32, 0.1); color: var(--primary); padding: 0.2rem 0.6rem; border-radius: 20px; font-size: 0.75rem; font-weight: 600;">
                        <i class="fas fa-star"></i> ${puntos} Ptos
                    </span>
                    <span style="background: rgba(0, 0, 0, 0.05); color: var(--text-muted); padding: 0.2rem 0.6rem; border-radius: 20px; font-size: 0.75rem;">
                        <i class="far fa-clock"></i> Límite: ${limite}
                    </span>
                    <span style="background: rgba(0, 0, 0, 0.05); color: var(--text-muted); padding: 0.2rem 0.6rem; border-radius: 20px; font-size: 0.75rem;">
                        <i class="fas fa-file-code"></i> Formato: ${formato}
                    </span>
                </div>
            `;
            
            if (userRole === 'estudiante') {
                const key = `${codigo}-${semana}-${deb.id}`;
                const entrega = entregas[key];
                const entregado = entrega && (entrega === 'Entregado' || (typeof entrega === 'object' && entrega.estado === 'Entregado'));
                
                if (entregado) {
                    controlHtml = `
                        <div style="display: flex; flex-direction: column; align-items: flex-end; gap: 0.4rem;">
                            <span style="color: #10b981; font-weight: 600;"><i class="fas fa-check-double"></i> Entregado</span>
                    `;
                    if (typeof entrega === 'object' && entrega.archivo_ruta) {
                        controlHtml += `
                            <button class="action-btn secondary-btn" style="width: auto; margin-top: 0; padding: 0.4rem 0.8rem; font-size: 0.8rem; border-radius: 20px;" onclick="window.abrirArchivo('${entrega.archivo_ruta}')">
                                <i class="fas fa-external-link-alt"></i> Ver Archivo
                            </button>
                        `;
                    }
                    controlHtml += `</div>`;
                } else {
                    controlHtml = `<button class="action-btn" style="width: auto; margin-top: 0; padding: 0.5rem 1.2rem; font-size: 0.85rem;" onclick="window.abrirModalSubirTarea('${deb.id}', '${deb.titulo.replace(/'/g, "\\'")}', '${deb.descripcion ? deb.descripcion.replace(/'/g, "\\'") : ''}', '${formato}')"><i class="fas fa-upload"></i> Entregar</button>`;
                }
            } else if (userRole === 'docente') {
                controlHtml = `<button class="action-btn secondary-btn" style="width: auto; margin-top: 0; padding: 0.5rem 1.2rem; font-size: 0.85rem;" onclick="window.verEntregasTarea('${codigo}', ${semana}, '${deb.id}', '${deb.titulo.replace(/'/g, "\\'")}', '${deb.descripcion ? deb.descripcion.replace(/'/g, "\\'") : ''}', ${puntos}, '${limite}', '${formato}')"><i class="fas fa-users"></i> Ver Entregas</button>`;
            }
            
            containerDeberes.innerHTML += `
                <div style="background: var(--nav-hover); padding: 1.5rem; border-radius: 12px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem;">
                    <div style="flex: 1; min-width: 250px;">
                        <h4 style="margin-bottom: 0.3rem; color: var(--text-main); font-size: 1.1rem;">${deb.titulo}</h4>
                        <p style="color: var(--text-muted); font-size: 0.9rem; line-height: 1.4; margin-bottom: 0.4rem;">${deb.descripcion}</p>
                        ${extraInfoHtml}
                    </div>
                    <div>
                        ${controlHtml}
                    </div>
                </div>
            `;
        });
        
    } catch (e) {
        console.error("Error al cargar deberes:", e);
    }
}

// Abrir/Ver Entregas de Tarea (Docente)
window.verEntregasTarea = async function(codigo, semana, deberId, titulo, descripcion, puntos, limite, formato) {
    document.getElementById('action-panel-placeholder').style.display = 'none';
    document.getElementById('form-nueva-tarea-container').style.display = 'none';
    
    const panelVer = document.getElementById('panel-ver-entregas-container');
    panelVer.style.display = 'block';
    
    document.getElementById('ver-entregas-tarea-titulo').innerText = titulo;
    document.getElementById('ver-entregas-tarea-detalles').innerHTML = `
        <strong>Materia:</strong> ${codigo} | <strong>Semana:</strong> ${semana}<br>
        <strong>Puntos:</strong> ${puntos} | <strong>Fecha Límite:</strong> ${limite} | <strong>Formato:</strong> ${formato}
    `;
    
    const lista = document.getElementById('lista-entregas-estudiantes');
    if (!lista) return;
    lista.innerHTML = '<p style="text-align: center; padding: 1rem; color: var(--text-muted);">Cargando entregas...</p>';
    
    try {
        const entregas = await window.pywebview.api.obtener_entregas_deber(codigo, semana, deberId);
        lista.innerHTML = '';
        
        if (entregas.length === 0) {
            lista.innerHTML = '<p style="text-align: center; padding: 1rem; color: var(--text-muted);">No hay estudiantes registrados.</p>';
            return;
        }
        
        entregas.forEach(ent => {
            let statusHtml = '';
            
            if (ent.entrega) {
                const currentGrade = ent.entrega.nota !== undefined ? ent.entrega.nota : '';
                statusHtml = `
                    <div style="display: flex; flex-direction: column; align-items: flex-end; gap: 0.4rem;">
                        <span style="color: #10b981; font-weight: 600; display: block; font-size: 0.85rem; margin-bottom: 0.1rem;"><i class="fas fa-check-circle"></i> Entregado</span>
                        <span style="font-size: 0.75rem; color: var(--text-muted); display: block;">${ent.entrega.fecha_entrega || ''}</span>
                        
                        <div style="display: flex; gap: 0.3rem; align-items: center; margin-top: 0.2rem;">
                            <input type="number" id="grade-input-${ent.identificacion}" min="0" max="${puntos}" step="0.1" value="${currentGrade}" placeholder="Nota" style="width: 65px; padding: 0.3rem; border-radius: 8px; border: 2px solid var(--input-border); background: var(--input-bg); color: var(--text-main); text-align: center; font-size: 0.85rem; outline: none;">
                            <button class="action-btn" style="width: auto; margin: 0; padding: 0.3rem 0.6rem; font-size: 0.75rem; border-radius: 8px;" onclick="window.guardarCalificacionEntrega('${ent.identificacion}', '${codigo}', ${semana}, '${deberId}')">
                                Calificar
                            </button>
                        </div>
                        
                        ${ent.entrega.archivo_ruta ? `
                            <button class="action-btn secondary-btn" style="width: auto; margin-top: 0.2rem; padding: 0.3rem 0.6rem; font-size: 0.75rem; border-radius: 20px;" onclick="window.abrirArchivo('${ent.entrega.archivo_ruta}')">
                                <i class="fas fa-folder-open"></i> Abrir
                            </button>
                        ` : ''}
                    </div>
                `;
            } else {
                statusHtml = `
                    <div>
                        <span style="color: #ef4444; font-weight: 600; font-size: 0.85rem;"><i class="fas fa-exclamation-circle"></i> Sin Entregar</span>
                    </div>
                `;
            }
            
            lista.innerHTML += `
                <div style="background: var(--nav-hover); padding: 1rem; border-radius: 12px; display: flex; justify-content: space-between; align-items: center; gap: 1.2rem; flex-wrap: wrap; text-align: left;">
                    <div style="flex: 1.2; min-width: 220px;">
                        <strong style="color: var(--text-main); display: block; font-size: 0.95rem;">${ent.nombre}</strong>
                        <span style="color: var(--text-muted); font-size: 0.8rem; display: block;">ID: ${ent.identificacion} | Carrera: ${ent.carrera}</span>
                        ${ent.entrega && ent.entrega.archivo_nombre ? `<span style="font-size: 0.8rem; color: var(--text-muted); display: block; margin-top: 0.2rem; word-break: break-all;"><i class="far fa-file"></i> ${ent.entrega.archivo_nombre}</span>` : ''}
                    </div>
                    <div style="flex: 1; min-width: 150px; display: flex; justify-content: flex-end; align-items: center;">
                        ${statusHtml}
                    </div>
                </div>
            `;
        });
    } catch (err) {
        console.error("Error al obtener entregas:", err);
        lista.innerHTML = '<p style="text-align: center; padding: 1rem; color: #ef4444;">Error al cargar entregas.</p>';
    }
};

// Cerrar panel de entregas
document.getElementById('btn-cerrar-ver-entregas')?.addEventListener('click', () => {
    document.getElementById('panel-ver-entregas-container').style.display = 'none';
    document.getElementById('action-panel-placeholder').style.display = 'block';
});

// Helper para abrir archivo
window.abrirArchivo = async function(ruta) {
    if (!ruta) return;
    try {
        const res = await window.pywebview.api.abrir_archivo_entrega(ruta);
        if (!res.success) {
            alert(res.message);
        }
    } catch (err) {
        console.error("Error al abrir archivo:", err);
    }
};

// Eventos de creación de tareas (Docente)
const btnAbrirNuevaTarea = document.getElementById('btn-abrir-nueva-tarea');
const btnCancelarNuevaTarea = document.getElementById('btn-cancelar-nueva-tarea');
const btnGuardarNuevaTarea = document.getElementById('btn-guardar-nueva-tarea');
const formNuevaTareaContainer = document.getElementById('form-nueva-tarea-container');

btnAbrirNuevaTarea?.addEventListener('click', () => {
    document.getElementById('action-panel-placeholder').style.display = 'none';
    document.getElementById('panel-ver-entregas-container').style.display = 'none';
    formNuevaTareaContainer.style.display = 'block';
    
    document.getElementById('nueva-tar-titulo').value = '';
    document.getElementById('nueva-tar-desc').value = '';
    document.getElementById('nueva-tar-puntos').value = '10';
    document.getElementById('nueva-tar-fecha-limite').value = '';
    document.getElementById('nueva-tar-formato').value = '';
});

btnCancelarNuevaTarea?.addEventListener('click', () => {
    formNuevaTareaContainer.style.display = 'none';
    document.getElementById('action-panel-placeholder').style.display = 'block';
});

btnGuardarNuevaTarea?.addEventListener('click', async () => {
    const titulo = document.getElementById('nueva-tar-titulo').value;
    const desc = document.getElementById('nueva-tar-desc').value;
    const puntos = parseInt(document.getElementById('nueva-tar-puntos').value) || 10;
    const fechaLimite = document.getElementById('nueva-tar-fecha-limite').value;
    const formato = document.getElementById('nueva-tar-formato').value;
    
    if (!titulo || !desc) {
        alert("Por favor completa el título y la descripción.");
        return;
    }
    
    const res = await window.pywebview.api.agregar_deber(activeMateriaCodigo, activeSemana, titulo, desc, puntos, fechaLimite, formato);
    alert(res.message);
    if (res.success) {
        formNuevaTareaContainer.style.display = 'none';
        document.getElementById('action-panel-placeholder').style.display = 'block';
        await cargarDeberesMateria(activeMateriaCodigo, activeSemana);
    }
});

// Modal de Subida de Tareas (Estudiante)
const modalSubirTarea = document.getElementById('modal-subir-tarea');
const btnCerrarModal = document.getElementById('btn-cerrar-modal');
const btnConfirmarSubida = document.getElementById('btn-confirmar-subida');
const btnSeleccionarArchivo = document.getElementById('btn-seleccionar-archivo');
const nombreArchivoSeleccionado = document.getElementById('nombre-archivo-seleccionado');

let selectedFilePath = ''; // Ruta absoluta seleccionada del archivo

window.abrirModalSubirTarea = function(deberId, titulo, descripcion, formato) {
    selectedDeberId = deberId;
    document.getElementById('modal-tarea-titulo').innerText = titulo;
    document.getElementById('modal-tarea-desc').innerText = `${descripcion}\n\n[Formato requerido: ${formato || 'Cualquiera'}]`;
    document.getElementById('modal-tarea-estado').innerText = 'Estado: Pendiente';
    nombreArchivoSeleccionado.innerText = 'Ningún archivo seleccionado';
    selectedFilePath = '';
    
    if (modalSubirTarea) {
        modalSubirTarea.style.display = 'flex';
    }
};

btnCerrarModal?.addEventListener('click', () => {
    if (modalSubirTarea) modalSubirTarea.style.display = 'none';
});

// Selector de archivo a través de la API de python (Selector nativo)
btnSeleccionarArchivo?.addEventListener('click', async () => {
    try {
        const path = await window.pywebview.api.seleccionar_archivo();
        if (path) {
            selectedFilePath = path;
            const filename = path.split(/[/\\]/).pop();
            nombreArchivoSeleccionado.innerText = `Listo para subir: ${filename}`;
        }
    } catch (err) {
        console.error("Error al seleccionar archivo:", err);
    }
});

btnConfirmarSubida?.addEventListener('click', async () => {
    if (!selectedFilePath) {
        alert("Por favor selecciona un archivo primero.");
        return;
    }
    
    const res = await window.pywebview.api.subir_deber(currentUserEmail, activeMateriaCodigo, activeSemana, selectedDeberId, selectedFilePath);
    alert(res.message);
    if (res.success) {
        if (modalSubirTarea) modalSubirTarea.style.display = 'none';
        await cargarDeberesMateria(activeMateriaCodigo, activeSemana);
    }
});

// --- AUTO-RELLENO DE ACCESOS RÁPIDOS ---
document.querySelectorAll('.quick-login-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
        const email = e.currentTarget.dataset.email;
        document.getElementById('email').value = email;
        document.getElementById('password').value = '123456';
    });
});

// ==========================================
// NUEVAS FUNCIONALIDADES (CALENDARIO, CALIFICACIONES, BUZÓN, MODIFICAR MATERIAS)
// ==========================================

async function cargarDocentesSelect() {
    const select = document.getElementById('mat-docente');
    if (!select) return;
    try {
        const docentes = await window.pywebview.api.obtener_docentes();
        select.innerHTML = '<option value="">Seleccionar Docente...</option>';
        docentes.forEach(doc => {
            const email = `${doc.identificacion}@gmail.com`;
            select.innerHTML += `<option value="${email}" data-nombre="${doc.nombre}">${doc.nombre} (${doc.carrera})</option>`;
        });
    } catch (e) {
        console.error("Error cargando selector de docentes:", e);
    }
}

// 5. Calendario Dinámico con Fecha Exacta
function renderizarCalendario() {
    const calendarHeader = document.querySelector('.calendar-header h3');
    const calendarGrid = document.querySelector('.calendar-grid');
    if (!calendarHeader || !calendarGrid) return;
    
    const fechaActual = new Date();
    const anio = fechaActual.getFullYear();
    const mes = fechaActual.getMonth();
    const diaActual = fechaActual.getDate();
    
    const meses = [
        "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
        "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
    ];
    
    calendarHeader.innerHTML = `<i class="far fa-calendar-alt"></i> ${meses[mes]} ${anio}`;
    
    calendarGrid.innerHTML = `
        <div class="cal-day-header">Dom</div>
        <div class="cal-day-header">Lun</div>
        <div class="cal-day-header">Mar</div>
        <div class="cal-day-header">Mié</div>
        <div class="cal-day-header">Jue</div>
        <div class="cal-day-header">Vie</div>
        <div class="cal-day-header">Sáb</div>
    `;
    
    const primerDiaSemana = new Date(anio, mes, 1).getDay();
    const totalDiasMes = new Date(anio, mes + 1, 0).getDate();
    
    for (let i = 0; i < primerDiaSemana; i++) {
        calendarGrid.innerHTML += `<div class="cal-day empty"></div>`;
    }
    
    for (let dia = 1; dia <= totalDiasMes; dia++) {
        const esHoy = dia === diaActual;
        const claseHoy = esHoy ? 'active' : '';
        calendarGrid.innerHTML += `<div class="cal-day ${claseHoy}">${dia}</div>`;
    }
}

// 7. Calificaciones en Panel Lateral (Estudiante)
async function cargarMisCalificacionesPage() {
    const listContainer = document.getElementById('lista-materias-calificaciones');
    const valGeneral = document.getElementById('promedio-general-valor');
    if (!listContainer || !valGeneral) return;
    
    listContainer.innerHTML = '<p style="text-align: center; color: var(--text-muted);">Cargando...</p>';
    valGeneral.innerText = '0.00';
    
    document.getElementById('panel-detalle-calificaciones-materia').style.display = 'none';
    document.getElementById('panel-detalle-calificaciones-placeholder').style.display = 'block';
    
    try {
        const student = await window.pywebview.api.obtener_datos_estudiante(currentUserEmail);
        let materias = await window.pywebview.api.obtener_materias();
        
        if (!student) return;
        
        const studentId = currentUserEmail.split('@')[0];
        materias = materias.filter(mat => mat.estudiantes_inscritos && mat.estudiantes_inscritos.includes(studentId));
        
        const grades = student.calificaciones || [];
        
        let sum = 0;
        let count = 0;
        grades.forEach(c => {
            sum += c.nota;
            count++;
        });
        const finalAverage = count > 0 ? (sum / count).toFixed(2) : '0.00';
        valGeneral.innerText = finalAverage;
        
        listContainer.innerHTML = '';
        
        materias.forEach(mat => {
            const gradeObj = grades.find(g => g.materia.toUpperCase() === mat.nombre.toUpperCase() || g.materia.toUpperCase() === mat.codigo.toUpperCase());
            const hasGrade = gradeObj !== undefined;
            const noteText = hasGrade ? gradeObj.nota.toFixed(2) : '0.00';
            
            const badgeStyle = hasGrade && gradeObj.nota >= 7.0 
                ? 'background: rgba(16, 185, 129, 0.1); color: #10b981; border: 1px solid #10b981;'
                : 'background: rgba(0, 0, 0, 0.05); color: var(--text-muted); border: 1px solid var(--input-border);';
                
            listContainer.innerHTML += `
                <div style="display: flex; justify-content: space-between; align-items: center; padding: 1rem; background: var(--nav-hover); border-radius: 12px; cursor: pointer; transition: transform 0.2s;" onclick="window.mostrarDetalleCalificacionesMateria('${mat.codigo}', '${mat.nombre.replace(/'/g, "\\'")}')" onmouseover="this.style.transform='translateX(5px)'" onmouseout="this.style.transform='none'">
                    <div>
                        <strong style="color: var(--text-main); display: block; font-size: 0.95rem;">${mat.nombre}</strong>
                        <span style="font-size: 0.8rem; color: var(--text-muted);">${mat.codigo}</span>
                    </div>
                    <span style="padding: 0.3rem 0.8rem; border-radius: 20px; font-size: 0.85rem; font-weight: 700; ${badgeStyle}">
                        ${noteText}
                    </span>
                </div>
            `;
        });
    } catch (e) {
        console.error("Error al cargar calificaciones del estudiante:", e);
        listContainer.innerHTML = '<p style="color: #ef4444;">Error al cargar calificaciones.</p>';
    }
}

window.mostrarDetalleCalificacionesMateria = async function(codigo, nombre) {
    document.getElementById('panel-detalle-calificaciones-placeholder').style.display = 'none';
    const panelDetalle = document.getElementById('panel-detalle-calificaciones-materia');
    panelDetalle.style.display = 'block';
    
    document.getElementById('detalle-calif-materia-titulo').innerText = nombre;
    document.getElementById('detalle-calif-materia-subtitulo').innerText = `Código: ${codigo} | Resumen de todas las entregas`;
    
    const tbody = document.querySelector('#tabla-calificaciones-tareas tbody');
    if (!tbody) return;
    
    tbody.innerHTML = '<tr><td colspan="3" style="text-align: center; color: var(--text-muted);">Cargando...</td></tr>';
    
    try {
        const student = await window.pywebview.api.obtener_datos_estudiante(currentUserEmail);
        const materias = await window.pywebview.api.obtener_materias();
        const mat = materias.find(m => m.codigo === codigo);
        
        if (!student || !mat) return;
        
        tbody.innerHTML = '';
        const studentDeliveries = student.entregas || {};
        let tasksFound = false;
        
        for (let weekNum = 1; weekNum <= 16; weekNum++) {
            const weekTasks = mat.deberes[weekNum.toString()] || [];
            weekTasks.forEach(task => {
                tasksFound = true;
                const key = `${codigo}-${weekNum}-${task.id}`;
                const delivery = studentDeliveries[key];
                
                let dateStr = '-';
                let gradeStr = '<span style="color: var(--text-muted);">No entregado</span>';
                
                if (delivery) {
                    if (typeof delivery === 'object') {
                        dateStr = delivery.fecha_entrega || 'N/D';
                        if (delivery.nota !== undefined && delivery.nota !== null) {
                            const approved = delivery.nota >= 7.0;
                            gradeStr = `<strong style="color: ${approved ? '#10b981' : '#ef4444'};">${delivery.nota.toFixed(2)}</strong>`;
                        } else {
                            gradeStr = '<span style="color: #f59e0b; font-weight: 600;"><i class="fas fa-check-circle"></i> Entregado (Sin calificar)</span>';
                        }
                    } else {
                        dateStr = 'N/D';
                        gradeStr = '<span style="color: #f59e0b; font-weight: 600;"><i class="fas fa-check-circle"></i> Entregado (Sin calificar)</span>';
                    }
                }
                
                tbody.innerHTML += `
                    <tr>
                        <td>
                            <strong>${task.titulo}</strong>
                            <span style="display: block; font-size: 0.8rem; color: var(--text-muted);">Semana ${weekNum} | Max: ${task.puntos || 10} Ptos</span>
                        </td>
                        <td>${dateStr}</td>
                        <td>${gradeStr}</td>
                    </tr>
                `;
            });
        }
        
        if (!tasksFound) {
            tbody.innerHTML = '<tr><td colspan="3" style="text-align: center; color: var(--text-muted); padding: 2rem;">No hay tareas creadas para esta materia.</td></tr>';
        }
    } catch (e) {
        console.error("Error al detallar calificaciones materia:", e);
        tbody.innerHTML = '<tr><td colspan="3" style="text-align: center; color: #ef4444;">Error al cargar.</td></tr>';
    }
};

// 4. Buzón de Incidencias Resueltas
async function cargarBuzon() {
    const container = document.getElementById('lista-mensajes-buzon');
    if (!container) return;
    container.innerHTML = '<p style="text-align: center; color: var(--text-muted); padding: 2rem 0;">Cargando...</p>';
    
    try {
        const incidencias = await window.pywebview.api.obtener_incidencias_resueltas(currentUserEmail);
        container.innerHTML = '';
        
        if (incidencias.length === 0) {
            container.innerHTML = '<p style="text-align: center; color: var(--text-muted); padding: 3rem 0;"><i class="fas fa-inbox" style="font-size: 3rem; opacity: 0.3; margin-bottom: 1rem; display: block;"></i> Tu buzón está vacío.</p>';
            return;
        }
        
        incidencias.forEach(inc => {
            container.innerHTML += `
                <div style="background: var(--nav-hover); padding: 1.5rem; border-radius: 16px; box-shadow: 0 4px 15px rgba(0,0,0,0.05); margin-bottom: 1rem;">
                    <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.8rem; flex-wrap: wrap; gap: 0.5rem;">
                        <strong style="color: var(--text-main); font-size: 1.1rem;"><i class="fas fa-check-circle" style="color: #10b981;"></i> Incidencia #${inc.id_tarea} Resuelta</strong>
                        <span style="font-size: 0.8rem; color: var(--text-muted);">${inc.fecha_creacion}</span>
                    </div>
                    <p style="margin-bottom: 1.2rem; color: var(--text-main); font-style: italic; font-size: 0.95rem; background: var(--page-bg); padding: 0.8rem; border-radius: 10px;">
                        <strong>Tu reporte:</strong> "${inc.descripcion}"
                    </p>
                    <div style="background: rgba(16, 185, 129, 0.05); padding: 1rem; border-radius: 12px; border-left: 4px solid #10b981;">
                        <strong style="color: #10b981; display: block; font-size: 0.9rem; margin-bottom: 0.4rem;"><i class="fas fa-comment-dots"></i> Respuesta de ${inc.nombre_docente || 'Docente'}:</strong>
                        <p style="color: var(--text-main); font-size: 0.95rem; line-height: 1.5; margin: 0;">${inc.respuesta_docente}</p>
                    </div>
                </div>
            `;
        });
    } catch (e) {
        console.error("Error al cargar buzón de incidencias:", e);
        container.innerHTML = '<p style="text-align: center; color: #ef4444;">Error al cargar buzón de incidencias.</p>';
    }
}

// 6. Modificar Información de Materias (Docente)
let tempImagenPath = '';

window.abrirModificarMateria = async function(codigo) {
    const modal = document.getElementById('modal-modificar-materia');
    if (!modal) return;
    
    modal.style.display = 'flex';
    
    try {
        const materias = await window.pywebview.api.obtener_materias();
        const mat = materias.find(m => m.codigo === codigo);
        if (!mat) return;
        
        document.getElementById('mod-mat-nombre').value = mat.nombre;
        document.getElementById('mod-mat-codigo').value = mat.codigo;
        document.getElementById('mod-mat-creditos').value = mat.creditos;
        document.getElementById('mod-mat-horario').value = mat.horario || '';
        document.getElementById('mod-mat-paralelo').value = mat.paralelo || 'A';
        
        const preview = document.getElementById('mod-mat-img-preview');
        const imgName = document.getElementById('nombre-imagen-seleccionada');
        
        tempImagenPath = '';
        
        if (mat.imagen) {
            preview.src = mat.imagen;
            preview.style.display = 'block';
            imgName.innerText = mat.imagen.split('/').pop();
        } else {
            preview.src = '';
            preview.style.display = 'none';
            imgName.innerText = 'Sin imagen';
        }
    } catch (err) {
        console.error("Error al abrir modal modificar materia:", err);
    }
};

document.getElementById('btn-seleccionar-imagen-materia')?.addEventListener('click', async () => {
    try {
        const path = await window.pywebview.api.seleccionar_archivo();
        if (path) {
            const codigo = document.getElementById('mod-mat-codigo').value;
            const res = await window.pywebview.api.guardar_imagen_materia(codigo, path);
            alert(res.message);
            if (res.success) {
                tempImagenPath = res.imagen_path;
                const preview = document.getElementById('mod-mat-img-preview');
                preview.src = res.imagen_path;
                preview.style.display = 'block';
                document.getElementById('nombre-imagen-seleccionada').innerText = res.imagen_path.split('/').pop();
            }
        }
    } catch (err) {
        console.error("Error seleccionando imagen materia:", err);
    }
});

document.getElementById('btn-confirmar-modificacion')?.addEventListener('click', async () => {
    const codigo = document.getElementById('mod-mat-codigo').value;
    const creditos = parseInt(document.getElementById('mod-mat-creditos').value) || 1;
    const horario = document.getElementById('mod-mat-horario').value;
    const paralelo = document.getElementById('mod-mat-paralelo').value;
    
    try {
        const res = await window.pywebview.api.modificar_materia(codigo, creditos, horario, paralelo, tempImagenPath);
        alert(res.message);
        if (res.success) {
            document.getElementById('modal-modificar-materia').style.display = 'none';
            cargarMaterias();
        }
    } catch (err) {
        console.error("Error guardando modificaciones materia:", err);
    }
});

document.getElementById('btn-cerrar-modal-modificar')?.addEventListener('click', () => {
    document.getElementById('modal-modificar-materia').style.display = 'none';
});

// Toggle Deberes / Alumnos en detalle materia (Docente)
document.getElementById('btn-mostrar-deberes')?.addEventListener('click', async () => {
    document.getElementById('btn-mostrar-deberes').classList.add('active');
    document.getElementById('btn-mostrar-alumnos').classList.remove('active');
    
    const weeksBar = document.querySelector('.weeks-bar-container');
    if (weeksBar) weeksBar.style.display = 'block';
    
    document.getElementById('titulo-semana-activa').innerText = `Semana ${activeSemana}`;
    await cargarDeberesMateria(activeMateriaCodigo, activeSemana);
});

document.getElementById('btn-mostrar-alumnos')?.addEventListener('click', async () => {
    document.getElementById('btn-mostrar-alumnos').classList.add('active');
    document.getElementById('btn-mostrar-deberes').classList.remove('active');
    
    const weeksBar = document.querySelector('.weeks-bar-container');
    if (weeksBar) weeksBar.style.display = 'none';
    
    document.getElementById('titulo-semana-activa').innerText = `Alumnos Inscritos`;
    
    document.getElementById('form-nueva-tarea-container').style.display = 'none';
    document.getElementById('panel-ver-entregas-container').style.display = 'none';
    document.getElementById('action-panel-placeholder').style.display = 'block';
    
    const container = document.getElementById('lista-deberes');
    if (!container) return;
    
    container.innerHTML = '<p style="text-align: center; color: var(--text-muted);">Cargando estudiantes...</p>';
    
    try {
        const estudiantes = await window.pywebview.api.obtener_estudiantes_materia(activeMateriaCodigo);
        container.innerHTML = '';
        
        if (estudiantes.length === 0) {
            container.innerHTML = '<p style="text-align: center; color: var(--text-muted); padding: 2rem;">No hay estudiantes registrados.</p>';
            return;
        }
        
        estudiantes.forEach(est => {
            const gradeObj = (est.calificaciones || []).find(g => g.materia.toUpperCase() === activeMateriaCodigo.toUpperCase());
            const hasProm = gradeObj !== undefined;
            const promText = hasProm ? gradeObj.nota.toFixed(2) : 'Sin promedio';
            
            container.innerHTML += `
                <div style="background: var(--nav-hover); padding: 1.2rem; border-radius: 12px; display: flex; justify-content: space-between; align-items: center; gap: 1rem; margin-bottom: 0.8rem;">
                    <div>
                        <strong style="color: var(--text-main); font-size: 1rem; display: block;">${est.nombre}</strong>
                        <span style="color: var(--text-muted); font-size: 0.8rem; display: block;">ID: ${est.identificacion} | Carrera: ${est.carrera}</span>
                        <span style="background: rgba(128, 0, 32, 0.08); color: var(--primary); padding: 0.15rem 0.5rem; border-radius: 10px; font-size: 0.75rem; font-weight: 600; display: inline-block; margin-top: 0.3rem;">
                            Promedio Guardado: ${promText}
                        </span>
                    </div>
                    <div>
                        <button class="action-btn" style="width: auto; margin: 0; padding: 0.4rem 1rem; font-size: 0.8rem; border-radius: 20px;" onclick="window.calcularPromedioAlumno('${est.identificacion}', '${est.nombre.replace(/'/g, "\\'")}', '${activeMateriaCodigo}')">
                            <i class="fas fa-calculator"></i> Calcular Promedio
                        </button>
                    </div>
                </div>
            `;
        });
    } catch (err) {
        console.error("Error al cargar lista de alumnos:", err);
    }
});

// 8. Calcular Promedio (Docente)
window.calcularPromedioAlumno = async function(estId, estNombre, codigoMateria) {
    try {
        const student = await window.pywebview.api.obtener_datos_estudiante(`${estId}@gmail.com`);
        if (!student) {
            alert("No se pudieron cargar los datos del estudiante.");
            return;
        }
        
        const materias = await window.pywebview.api.obtener_materias();
        const mat = materias.find(m => m.codigo === codigoMateria);
        if (!mat) return;
        
        const studentDeliveries = student.entregas || {};
        let totalPuntosObtenidos = 0;
        let totalPuntosMaximos = 0;
        let totalTareasCount = 0;
        
        for (let weekNum = 1; weekNum <= 16; weekNum++) {
            const weekTasks = mat.deberes[weekNum.toString()] || [];
            weekTasks.forEach(task => {
                totalTareasCount++;
                const maxPoints = task.puntos || 10;
                totalPuntosMaximos += maxPoints;
                
                const key = `${codigoMateria}-${weekNum}-${task.id}`;
                const delivery = studentDeliveries[key];
                
                if (delivery && typeof delivery === 'object' && delivery.nota !== undefined && delivery.nota !== null) {
                    totalPuntosObtenidos += delivery.nota;
                } else {
                    totalPuntosObtenidos += 0;
                }
            });
        }
        
        let promedio = 0.0;
        if (totalTareasCount > 0 && totalPuntosMaximos > 0) {
            promedio = (totalPuntosObtenidos / totalPuntosMaximos) * 10;
        }
        
        const ok = confirm(`¿Estás seguro de registrar un promedio general de ${promedio.toFixed(2)}/10 para el estudiante ${estNombre} en la materia ${mat.nombre}?`);
        if (ok) {
            const res = await window.pywebview.api.guardar_promedio_materia(estId, codigoMateria, promedio.toFixed(2));
            alert(res.message);
            document.getElementById('btn-mostrar-alumnos').click();
        }
    } catch (err) {
        console.error("Error al calcular promedio alumno:", err);
        alert("Error al calcular el promedio.");
    }
};

// Calificar Entrega individual
window.guardarCalificacionEntrega = async function(studentId, codigo, semana, deberId) {
    const input = document.getElementById(`grade-input-${studentId}`);
    if (!input) return;
    const grade = parseFloat(input.value);
    if (isNaN(grade) || grade < 0) {
        alert("Por favor ingresa una nota válida mayor o igual a 0.");
        return;
    }
    
    try {
        const res = await window.pywebview.api.calificar_entrega(studentId, codigo, semana, deberId, grade);
        alert(res.message);
        const titulo = document.getElementById('ver-entregas-tarea-titulo').innerText;
        await window.verEntregasTarea(codigo, semana, deberId, titulo, '', 10, '', '');
    } catch (err) {
        console.error("Error al guardar calificación de entrega:", err);
    }
};

// ==========================================
// ASIGNACIÓN DE DOCENTES A MATERIAS (ADMIN)
// ==========================================

const modalAsignarDocente = document.getElementById('modal-asignar-docente');
const btnAbrirAsignarDocente = document.getElementById('btn-abrir-asignar-docente');
const btnConfirmarAsignacionDocente = document.getElementById('btn-confirmar-asignacion-docente');
const btnCerrarModalAsignar = document.getElementById('btn-cerrar-modal-asignar');

btnAbrirAsignarDocente?.addEventListener('click', async () => {
    if (!modalAsignarDocente) return;
    
    const matSelect = document.getElementById('asig-materia-select');
    const docSelect = document.getElementById('asig-docente-select');
    if (!matSelect || !docSelect) return;
    
    matSelect.innerHTML = '<option value="">Cargando materias...</option>';
    docSelect.innerHTML = '<option value="">Cargando docentes...</option>';
    
    modalAsignarDocente.style.display = 'flex';
    
    try {
        const materias = await window.pywebview.api.obtener_materias();
        const docentes = await window.pywebview.api.obtener_docentes();
        
        matSelect.innerHTML = '';
        materias.forEach(mat => {
            matSelect.innerHTML += `<option value="${mat.codigo}">${mat.nombre} (${mat.codigo})</option>`;
        });
        
        docSelect.innerHTML = '<option value="">Ninguno (Desasignar)</option>';
        docentes.forEach(doc => {
            const email = `${doc.identificacion}@gmail.com`;
            docSelect.innerHTML += `<option value="${email}">${doc.nombre} (${doc.carrera})</option>`;
        });
    } catch (err) {
        console.error("Error al cargar selector de asignación:", err);
    }
});

btnConfirmarAsignacionDocente?.addEventListener('click', async () => {
    const matSelect = document.getElementById('asig-materia-select');
    const docSelect = document.getElementById('asig-docente-select');
    if (!matSelect || !docSelect) return;
    
    const matCodigo = matSelect.value;
    const docEmail = docSelect.value;
    
    if (!matCodigo) {
        alert("Por favor selecciona una materia.");
        return;
    }
    
    try {
        const res = await window.pywebview.api.asignar_docente_materia(matCodigo, docEmail);
        alert(res.message);
        if (res.success) {
            modalAsignarDocente.style.display = 'none';
            cargarMaterias();
        }
    } catch (err) {
        console.error("Error al asignar docente a materia:", err);
    }
});

btnCerrarModalAsignar?.addEventListener('click', () => {
    if (modalAsignarDocente) modalAsignarDocente.style.display = 'none';
});

// ==========================================
// INSCRIPCIÓN DE ESTUDIANTES A MATERIAS (ADMIN)
// ==========================================

const modalInscribirEstudiantes = document.getElementById('modal-inscribir-estudiantes');
const btnAbrirInscribirEstudiantes = document.getElementById('btn-abrir-inscribir-estudiantes');
const btnConfirmarInscripcionEstudiantes = document.getElementById('btn-confirmar-inscripcion-estudiantes');
const btnCerrarModalInscribir = document.getElementById('btn-cerrar-modal-inscribir');
const insMateriaSelect = document.getElementById('ins-materia-select');
const insEstudiantesListContainer = document.getElementById('ins-estudiantes-list-container');

async function actualizarListaEstudiantesElegibles() {
    if (!insMateriaSelect || !insEstudiantesListContainer) return;
    const matCodigo = insMateriaSelect.value;
    if (!matCodigo) {
        insEstudiantesListContainer.innerHTML = '<p style="text-align: center; color: var(--text-muted); padding: 1rem;">Selecciona una materia primero.</p>';
        return;
    }
    
    insEstudiantesListContainer.innerHTML = '<p style="text-align: center; color: var(--text-muted); padding: 1rem;">Cargando estudiantes elegibles...</p>';
    
    try {
        const elegibles = await window.pywebview.api.obtener_estudiantes_elegibles_materia(matCodigo);
        insEstudiantesListContainer.innerHTML = '';
        
        if (elegibles.length === 0) {
            insEstudiantesListContainer.innerHTML = '<p style="text-align: center; color: var(--text-muted); padding: 1rem;">No hay estudiantes elegibles (todos ya están en este curso/paralelos).</p>';
            return;
        }
        
        elegibles.forEach(est => {
            insEstudiantesListContainer.innerHTML += `
                <div style="display: flex; align-items: center; gap: 0.8rem; padding: 0.6rem; border-bottom: 1px solid var(--input-border); justify-content: flex-start; text-align: left;">
                    <input type="checkbox" class="enroll-student-cb" value="${est.identificacion}" id="cb-enroll-${est.identificacion}" style="width: auto; margin: 0; cursor: pointer;">
                    <label for="cb-enroll-${est.identificacion}" style="cursor: pointer; color: var(--text-main); margin: 0; font-size: 0.9rem; flex: 1;">
                        <strong>${est.nombre}</strong> (ID: ${est.identificacion} | Carrera: ${est.carrera} | Semestre: ${est.semestre || '1'})
                    </label>
                </div>
            `;
        });
    } catch (err) {
        console.error("Error al obtener elegibles:", err);
        insEstudiantesListContainer.innerHTML = '<p style="text-align: center; color: var(--text-muted); padding: 1rem;">Error al cargar estudiantes elegibles.</p>';
    }
}

insMateriaSelect?.addEventListener('change', actualizarListaEstudiantesElegibles);

btnAbrirInscribirEstudiantes?.addEventListener('click', async () => {
    if (!modalInscribirEstudiantes) return;
    
    insMateriaSelect.innerHTML = '<option value="">Cargando materias...</option>';
    insEstudiantesListContainer.innerHTML = '';
    
    modalInscribirEstudiantes.style.display = 'flex';
    
    try {
        const materias = await window.pywebview.api.obtener_materias();
        insMateriaSelect.innerHTML = '';
        materias.forEach(mat => {
            insMateriaSelect.innerHTML += `<option value="${mat.codigo}">${mat.nombre} (${mat.codigo})</option>`;
        });
        
        // Cargar inmediatamente la lista del primer curso cargado
        await actualizarListaEstudiantesElegibles();
    } catch (err) {
        console.error("Error al iniciar inscripción modal:", err);
    }
});

btnConfirmarInscripcionEstudiantes?.addEventListener('click', async () => {
    const matCodigo = insMateriaSelect.value;
    if (!matCodigo) {
        alert("Selecciona una materia.");
        return;
    }
    
    const checkboxes = document.querySelectorAll('.enroll-student-cb:checked');
    if (checkboxes.length === 0) {
        alert("Por favor selecciona al menos un estudiante para inscribir.");
        return;
    }
    
    const idsSeleccionados = Array.from(checkboxes).map(cb => cb.value);
    
    try {
        const res = await window.pywebview.api.inscribir_estudiantes_materia(matCodigo, idsSeleccionados);
        alert(res.message);
        if (res.success) {
            modalInscribirEstudiantes.style.display = 'none';
            // Refrescar materias y el listado de alumnos si el detalle está abierto
            cargarMaterias();
            if (document.getElementById('btn-mostrar-alumnos').classList.contains('active')) {
                document.getElementById('btn-mostrar-alumnos').click();
            }
        }
    } catch (err) {
        console.error("Error al inscribir estudiantes:", err);
    }
});

btnCerrarModalInscribir?.addEventListener('click', () => {
    if (modalInscribirEstudiantes) modalInscribirEstudiantes.style.display = 'none';
});

// ==========================================
// SELECCIÓN DE MATERIAS Y CARRERAS DESDE REGISTROS / MATERIAS
// ==========================================

let materiasSeleccionadasEstudiante = [];
let materiasSeleccionadasDocente = [];

// Selectores de Carreras globales
async function cargarSelectCarreras() {
    try {
        const carreras = await window.pywebview.api.obtener_carreras();
        const containerEst = document.getElementById('est-carreras-checkboxes');
        const containerDoc = document.getElementById('doc-carreras-checkboxes');
        const selectAsig = document.getElementById('asig-panel-carrera-select');
        
        // Populate Asignación select
        let optionsHtml = '<option value="">Seleccione una carrera...</option>';
        carreras.forEach(c => {
            const nombre = typeof c === 'object' ? c.nombre : c;
            optionsHtml += `<option value="${nombre}">${nombre}</option>`;
        });
        
        let selectedAsig = selectAsig ? selectAsig.value : '';
        if (selectAsig) {
            selectAsig.innerHTML = optionsHtml;
            if (selectedAsig) selectAsig.value = selectedAsig;
        }
        
        // Populate Estudiante checkbox list
        if (containerEst) {
            containerEst.innerHTML = '';
            carreras.forEach(c => {
                const nombre = typeof c === 'object' ? c.nombre : c;
                containerEst.innerHTML += `
                    <div style="display: flex; align-items: center; gap: 0.5rem;">
                        <input type="checkbox" class="est-carrera-cb" value="${nombre}" id="cb-est-car-${nombre}" style="width: auto; margin: 0; cursor: pointer;">
                        <label for="cb-est-car-${nombre}" style="margin: 0; font-size: 0.85rem; cursor: pointer; color: var(--text-main);">${nombre}</label>
                    </div>
                `;
            });
            
            // Enforce maximum 2 checkboxes checked
            const cbs = containerEst.querySelectorAll('.est-carrera-cb');
            cbs.forEach(cb => {
                cb.addEventListener('change', () => {
                    const checked = containerEst.querySelectorAll('.est-carrera-cb:checked');
                    if (checked.length > 2) {
                        cb.checked = false;
                        alert("Un estudiante solo puede registrarse en un máximo de 2 carreras.");
                    }
                });
            });
        }
        
        // Populate Docente checkbox list
        if (containerDoc) {
            containerDoc.innerHTML = '';
            carreras.forEach(c => {
                const nombre = typeof c === 'object' ? c.nombre : c;
                containerDoc.innerHTML += `
                    <div style="display: flex; align-items: center; gap: 0.5rem;">
                        <input type="checkbox" class="doc-carrera-cb" value="${nombre}" id="cb-doc-car-${nombre}" style="width: auto; margin: 0; cursor: pointer;">
                        <label for="cb-doc-car-${nombre}" style="margin: 0; font-size: 0.85rem; cursor: pointer; color: var(--text-main);">${nombre}</label>
                    </div>
                `;
            });
        }
    } catch (err) {
        console.error("Error al cargar selectores de carreras:", err);
    }
}

// --- GESTIÓN DE CARRERAS (PANEL ADMIN) ---
async function cargarCarreras() {
    const tabla = document.querySelector('#tabla-carreras tbody');
    if (!tabla) return;
    try {
        const carreras = await window.pywebview.api.obtener_carreras();
        tabla.innerHTML = '';
        if (carreras.length === 0) {
            tabla.innerHTML = '<tr><td colspan="4" style="text-align: center; color: var(--text-muted); padding: 1rem;">No hay carreras registradas.</td></tr>';
            return;
        }
        carreras.forEach(car => {
            const name = typeof car === 'object' ? car.nombre : car;
            const sems = typeof car === 'object' ? car.semestres : 10;
            const desc = typeof car === 'object' ? car.descripcion : 'Sin descripción';
            
            tabla.innerHTML += `
                <tr>
                    <td style="font-weight: 600; padding: 1rem; color: var(--text-main); border-bottom: 1px solid var(--input-border);">${name}</td>
                    <td style="padding: 1rem; color: var(--text-main); border-bottom: 1px solid var(--input-border);">${sems} Semestres</td>
                    <td style="padding: 1rem; color: var(--text-muted); border-bottom: 1px solid var(--input-border); font-size: 0.85rem; max-width: 250px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${desc}</td>
                    <td style="padding: 1rem; border-bottom: 1px solid var(--input-border);">
                        <button class="action-btn secondary-btn" style="width: auto; margin: 0; padding: 0.35rem 0.7rem; font-size: 0.8rem; border-radius: 6px;" onclick="window.abrirGestionMateriasCarrera('${name.replace(/'/g, "\\'")}', ${sems}, '${desc.replace(/'/g, "\\'")}')">
                            <i class="fas fa-tasks"></i> Materias
                        </button>
                    </td>
                </tr>
            `;
        });
    } catch (err) {
        console.error("Error al cargar carreras:", err);
    }
}

const formCarrera = document.getElementById('form-carrera');
formCarrera?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const nombre = document.getElementById('car-nombre').value;
    const semestres = parseInt(document.getElementById('car-semestres').value) || 10;
    const descripcion = document.getElementById('car-descripcion').value;
    try {
        const res = await window.pywebview.api.agregar_carrera(nombre, semestres, descripcion);
        alert(res.message);
        if (res.success) {
            formCarrera.reset();
            await cargarCarreras();
            await cargarSelectCarreras();
            cargarHistorial();
        }
    } catch (err) {
        console.error("Error al registrar carrera:", err);
    }
});

// Modals y botones de materias vinculadas (Estudiante / Docente)
const modalMateriasReg = document.getElementById('modal-seleccionar-materias-registro');
const btnMateriasEst = document.getElementById('btn-seleccionar-materias-estudiante');
const btnMateriasDoc = document.getElementById('btn-seleccionar-materias-docente');
const containerMateriasReg = document.getElementById('materias-registro-list-container');
const btnConfirmarMateriasReg = document.getElementById('btn-confirmar-materias-registro');
const btnCerrarMateriasReg = document.getElementById('btn-cerrar-materias-registro');

let tipoRegistroActivo = ''; // 'estudiante' o 'docente'

function abrirModalMateriasRegistro(tipo) {
    if (!modalMateriasReg || !containerMateriasReg) return;
    tipoRegistroActivo = tipo;
    containerMateriasReg.innerHTML = '<p style="text-align: center; color: var(--text-muted); padding: 1rem;">Cargando materias...</p>';
    modalMateriasReg.style.display = 'flex';
    
    window.pywebview.api.obtener_materias().then(materias => {
        containerMateriasReg.innerHTML = '';
        if (materias.length === 0) {
            containerMateriasReg.innerHTML = '<p style="text-align: center; color: var(--text-muted); padding: 1rem;">No hay materias registradas en el catálogo.</p>';
            return;
        }
        
        const seleccionadas = tipo === 'estudiante' ? materiasSeleccionadasEstudiante : materiasSeleccionadasDocente;
        
        materias.forEach(mat => {
            const isChecked = seleccionadas.includes(mat.codigo) ? 'checked' : '';
            containerMateriasReg.innerHTML += `
                <div style="display: flex; align-items: center; gap: 0.8rem; padding: 0.6rem; border-bottom: 1px solid var(--input-border); text-align: left; justify-content: flex-start;">
                    <input type="checkbox" class="reg-materia-cb" value="${mat.codigo}" ${isChecked} id="cb-reg-mat-${mat.codigo}" style="width: auto; margin: 0; cursor: pointer;">
                    <label for="cb-reg-mat-${mat.codigo}" style="cursor: pointer; color: var(--text-main); margin: 0; font-size: 0.9rem; flex: 1;">
                        <strong>${mat.nombre}</strong> (${mat.codigo} | Semestre: ${mat.semestre || '1'} | Paralelo: ${mat.paralelo})
                    </label>
                </div>
            `;
        });
        
        // Agregar listeners para limitar a máximo 5
        const cbs = containerMateriasReg.querySelectorAll('.reg-materia-cb');
        cbs.forEach(cb => {
            cb.addEventListener('change', () => {
                const checked = containerMateriasReg.querySelectorAll('.reg-materia-cb:checked');
                if (checked.length > 5) {
                    cb.checked = false;
                    alert("Solo puedes seleccionar un máximo de 5 materias.");
                }
            });
        });
    }).catch(err => {
        console.error("Error al cargar materias de registro:", err);
    });
}

btnMateriasEst?.addEventListener('click', () => abrirModalMateriasRegistro('estudiante'));
btnMateriasDoc?.addEventListener('click', () => abrirModalMateriasRegistro('docente'));

btnConfirmarMateriasReg?.addEventListener('click', () => {
    const checked = containerMateriasReg.querySelectorAll('.reg-materia-cb:checked');
    const ids = Array.from(checked).map(cb => cb.value);
    
    if (tipoRegistroActivo === 'estudiante') {
        materiasSeleccionadasEstudiante = ids;
        const badge = document.getElementById('materias-seleccionadas-estudiante-badge');
        if (badge) {
            badge.innerHTML = ids.length > 0 
                ? ids.map(id => `<span style="background: var(--primary); color: white; padding: 4px 10px; border-radius: 20px; font-size: 0.8rem; display: inline-block; margin: 2px; font-weight: bold;">${id}</span>`).join(' ') 
                : "Ninguna materia seleccionada";
        }
    } else if (tipoRegistroActivo === 'docente') {
        materiasSeleccionadasDocente = ids;
        const badge = document.getElementById('materias-seleccionadas-docente-badge');
        if (badge) {
            badge.innerHTML = ids.length > 0 
                ? ids.map(id => `<span style="background: var(--primary); color: white; padding: 4px 10px; border-radius: 20px; font-size: 0.8rem; display: inline-block; margin: 2px; font-weight: bold;">${id}</span>`).join(' ') 
                : "Ninguna materia seleccionada";
        }
    }
    
    if (modalMateriasReg) modalMateriasReg.style.display = 'none';
});

btnCerrarMateriasReg?.addEventListener('click', () => {
    if (modalMateriasReg) modalMateriasReg.style.display = 'none';
});

// Modals y botones de carreras vinculadas a una materia
const modalCarrerasMat = document.getElementById('modal-seleccionar-carreras-materia');
const btnCarrerasMat = document.getElementById('btn-seleccionar-carreras-materia');
const containerCarrerasMat = document.getElementById('carreras-materia-list-container');
const btnConfirmarCarrerasMat = document.getElementById('btn-confirmar-carreras-materia');
const btnCerrarCarrerasMat = document.getElementById('btn-cerrar-carreras-materia');

btnCarrerasMat?.addEventListener('click', () => {
    if (!modalCarrerasMat || !containerCarrerasMat) return;
    containerCarrerasMat.innerHTML = '<p style="text-align: center; color: var(--text-muted); padding: 1rem;">Cargando carreras...</p>';
    modalCarrerasMat.style.display = 'flex';
    
    window.pywebview.api.obtener_carreras().then(carreras => {
        containerCarrerasMat.innerHTML = '';
        if (carreras.length === 0) {
            containerCarrerasMat.innerHTML = '<p style="text-align: center; color: var(--text-muted); padding: 1rem;">No hay carreras registradas aún.</p>';
            return;
        }
        
        carreras.forEach(car => {
            const isChecked = carrerasSeleccionadasMateria.includes(car) ? 'checked' : '';
            containerCarrerasMat.innerHTML += `
                <div style="display: flex; align-items: center; gap: 0.8rem; padding: 0.6rem; border-bottom: 1px solid var(--input-border); text-align: left; justify-content: flex-start;">
                    <input type="checkbox" class="mat-carrera-cb" value="${car}" ${isChecked} id="cb-mat-car-${car.replace(/\s+/g, '_')}" style="width: auto; margin: 0; cursor: pointer;">
                    <label for="cb-mat-car-${car.replace(/\s+/g, '_')}" style="cursor: pointer; color: var(--text-main); margin: 0; font-size: 0.9rem; flex: 1;">
                        <strong>${car}</strong>
                    </label>
                </div>
            `;
        });
    }).catch(err => {
        console.error("Error al obtener carreras vinculadas:", err);
    });
});

btnConfirmarCarrerasMat?.addEventListener('click', () => {
    const checked = containerCarrerasMat.querySelectorAll('.mat-carrera-cb:checked');
    carrerasSeleccionadasMateria = Array.from(checked).map(cb => cb.value);
    const badge = document.getElementById('carreras-seleccionadas-materia-badge');
    if (badge) {
        badge.innerHTML = carrerasSeleccionadasMateria.length > 0 
            ? carrerasSeleccionadasMateria.map(c => `<span style="background: var(--primary); color: white; padding: 4px 10px; border-radius: 20px; font-size: 0.8rem; display: inline-block; margin: 2px; font-weight: bold;">${c}</span>`).join(' ') 
            : "Ninguna carrera seleccionada";
    }
    if (modalCarrerasMat) modalCarrerasMat.style.display = 'none';
});

btnCerrarCarrerasMat?.addEventListener('click', () => {
    if (modalCarrerasMat) modalCarrerasMat.style.display = 'none';
});

// ==========================================
// MODAL GESTIÓN DE MATERIAS DE LA CARRERA
// ==========================================
let mcmCarreraActiva = '';
let mcmSemestreActivo = 1;
let mcmDuracionSemestres = 10;

const modalMcm = document.getElementById('modal-carrera-materias');
const containerMcmSemestres = document.getElementById('mcm-semestres-list-container');
const btnCerrarMcm = document.getElementById('btn-cerrar-carrera-materias');

const modalMcc = document.getElementById('modal-crear-materia-contextual');
const formMcc = document.getElementById('form-crear-materia-contextual');

window.abrirGestionMateriasCarrera = function(nombre, semestres, descripcion) {
    mcmCarreraActiva = nombre;
    mcmDuracionSemestres = parseInt(semestres) || 10;
    
    document.getElementById('mcm-carrera-nombre').innerText = nombre;
    document.getElementById('mcm-carrera-desc').innerText = descripcion || 'Sin descripción';
    
    if (modalMcm) modalMcm.style.display = 'flex';
    window.renderCarreraMaterias();
};

window.renderCarreraMaterias = async function() {
    if (!containerMcmSemestres) return;
    containerMcmSemestres.innerHTML = '<p style="text-align: center; color: var(--text-muted); padding: 1rem;">Cargando materias...</p>';
    
    try {
        const materias = await window.pywebview.api.obtener_materias();
        containerMcmSemestres.innerHTML = '';
        
        for (let i = 1; i <= mcmDuracionSemestres; i++) {
            // Filtrar materias vinculadas a esta carrera y a este semestre
            const vinculadas = materias.filter(m => m.carreras && m.carreras.includes(mcmCarreraActiva) && m.semestre.toString() === i.toString());
            
            // Agrupar por código base único
            const baseGroups = new Map();
            vinculadas.forEach(mat => {
                const baseCode = mat.codigo.split('-')[0].toUpperCase();
                if (!baseGroups.has(baseCode)) {
                    baseGroups.set(baseCode, []);
                }
                baseGroups.get(baseCode).push(mat);
            });
            
            let listHtml = '';
            if (baseGroups.size === 0) {
                listHtml = '<p style="font-size: 0.85rem; color: var(--text-muted); margin: 0.5rem 0;">No hay materias vinculadas para este semestre.</p>';
            } else {
                baseGroups.forEach((mats, baseCode) => {
                    const repMat = mats[0];
                    const existingPars = mats.map(m => m.paralelo.toUpperCase());
                    
                    let parsHtml = '';
                    ["A", "B", "C"].forEach(p => {
                        if (existingPars.includes(p)) {
                            const mat = mats.find(m => m.paralelo.toUpperCase() === p);
                            parsHtml += `
                                <div style="display: flex; align-items: center; justify-content: space-between; padding: 0.4rem 0.8rem; background: var(--page-bg); border: 1px solid var(--input-border); border-radius: 8px; margin-bottom: 0.3rem;">
                                    <span style="font-size: 0.85rem; color: var(--text-main);">
                                        <span style="background: var(--primary); color: white; padding: 0.15rem 0.4rem; border-radius: 4px; font-size: 0.75rem; margin-right: 0.4rem; font-weight: bold;">${p}</span>
                                        <strong>${mat.codigo}</strong> - ${mat.nombre}
                                    </span>
                                    <div style="display: flex; gap: 0.4rem;">
                                        <button class="action-btn" style="width: auto; margin: 0; padding: 0.2rem 0.5rem; font-size: 0.75rem; border-radius: 4px; background: var(--primary); color: white;" onclick="window.abrirDetalleParaleloModal('${mat.codigo}')">
                                            <i class="fas fa-users-cog"></i> Gestionar
                                        </button>
                                        <button class="action-btn secondary-btn" style="width: auto; margin: 0; padding: 0.2rem 0.5rem; font-size: 0.75rem; border-radius: 4px; border-color: #fca5a5; color: #ef4444;" onclick="window.desasociarMateriaCarrera('${mcmCarreraActiva.replace(/'/g, "\\'")}', '${mat.codigo}')">
                                            <i class="fas fa-unlink"></i> Quitar
                                        </button>
                                    </div>
                                </div>
                            `;
                        } else {
                            parsHtml += `
                                <div style="display: flex; align-items: center; justify-content: space-between; padding: 0.3rem 0.8rem; border: 1px dashed var(--input-border); border-radius: 8px; margin-bottom: 0.3rem; opacity: 0.85; background: rgba(0,0,0,0.02);">
                                    <span style="font-size: 0.85rem; color: var(--text-muted);">Paralelo ${p} no creado</span>
                                    <button class="action-btn success-btn" style="width: auto; margin: 0; padding: 0.15rem 0.5rem; font-size: 0.75rem; border-radius: 4px;" onclick="window.crearParaleloRapido('${baseCode}', '${repMat.nombre.replace(/'/g, "\\'")}', ${repMat.creditos}, '${p}', ${i})">
                                        <i class="fas fa-plus"></i> Crear Paralelo ${p}
                                    </button>
                                </div>
                            `;
                        }
                    });
                    
                    listHtml += `
                        <div style="margin-bottom: 1rem; border-left: 3px solid var(--primary); padding-left: 0.6rem;">
                            <strong style="font-size: 0.9rem; color: var(--text-main); display: block; margin-bottom: 0.4rem;">${baseCode} - ${repMat.nombre}</strong>
                            ${parsHtml}
                        </div>
                    `;
                });
            }
            
            let buttonHtml = '';
            if (baseGroups.size < 5) {
                buttonHtml = `
                    <button class="action-btn success-btn" style="width: auto; margin: 0.5rem 0 0 0; padding: 0.4rem 0.8rem; font-size: 0.8rem;" onclick="window.abrirCrearMateriaContextualModal(${i})">
                        <i class="fas fa-plus-circle"></i> + Crear Materia (Semestre ${i})
                    </button>
                `;
            } else {
                buttonHtml = `
                    <span style="font-size: 0.8rem; color: #ef4444; font-weight: bold; display: block; margin-top: 0.5rem;">
                        <i class="fas fa-exclamation-circle"></i> Límite de 5 materias alcanzado para este semestre.
                    </span>
                `;
            }
            
            containerMcmSemestres.innerHTML += `
                <div style="padding: 1rem; border: 1px solid var(--input-border); border-radius: 12px; background: var(--nav-hover); text-align: left;">
                    <h4 style="margin: 0 0 0.8rem 0; border-bottom: 1.5px solid var(--primary); padding-bottom: 0.3rem; color: var(--text-main); font-size: 0.95rem;">Semestre ${i}</h4>
                    <div style="margin-bottom: 0.5rem;">
                        ${listHtml}
                    </div>
                    ${buttonHtml}
                </div>
            `;
        }
    } catch (err) {
        console.error("Error al renderizar materias de la carrera:", err);
    }
};

window.desasociarMateriaCarrera = async function(carrera, codigo) {
    if (confirm(`¿Estás seguro de que deseas desvincular la materia ${codigo} de la carrera ${carrera}?`)) {
        try {
            const res = await window.pywebview.api.desasociar_materia_carrera(carrera, codigo);
            alert(res.message);
            if (res.success) {
                window.renderCarreraMaterias();
                cargarMaterias();
            }
        } catch (e) {
            console.error("Error al desasociar materia de la carrera:", e);
        }
    }
};

window.abrirCrearMateriaContextualModal = function(semestre) {
    mcmSemestreActivo = semestre;
    document.getElementById('mcc-contexto-texto').innerText = `Crear materia directamente para el Semestre ${semestre} de la carrera: ${mcmCarreraActiva}`;
    if (modalMcc) modalMcc.style.display = 'flex';
};

window.crearParaleloRapido = async function(baseCodigo, nombre, creditos, paralelo, semestre) {
    try {
        const res = await window.pywebview.api.agregar_materia(
            baseCodigo,
            nombre,
            parseInt(creditos),
            "Por definir",
            paralelo,
            null,
            null,
            null,
            semestre.toString(),
            [mcmCarreraActiva]
        );
        alert(res.message);
        if (res.success) {
            window.renderCarreraMaterias();
            cargarMaterias();
        }
    } catch (err) {
        console.error("Error al crear paralelo rápido:", err);
    }
};

formMcc?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const baseCodigo = document.getElementById('mcc-mat-codigo').value;
    const nombre = document.getElementById('mcc-mat-nombre').value;
    const creditos = parseInt(document.getElementById('mcc-mat-creditos').value) || 5;
    const paralelo = document.getElementById('mcc-mat-paralelo').value;
    const horario = document.getElementById('mcc-mat-horario').value;

    try {
        const res = await window.pywebview.api.agregar_materia(
            baseCodigo,
            nombre,
            creditos,
            horario,
            paralelo,
            null,
            null,
            null,
            mcmSemestreActivo.toString(),
            [mcmCarreraActiva]
        );
        alert(res.message);
        if (res.success) {
            if (modalMcc) modalMcc.style.display = 'none';
            formMcc.reset();
            window.renderCarreraMaterias();
            cargarMaterias();
        }
    } catch (err) {
        console.error("Error al crear materia contextual:", err);
    }
});

document.getElementById('btn-cerrar-crear-materia-contextual')?.addEventListener('click', () => {
    if (modalMcc) modalMcc.style.display = 'none';
});

btnCerrarMcm?.addEventListener('click', () => {
    if (modalMcm) modalMcm.style.display = 'none';
});

// ==========================================
// DETALLE DE PARALELO (ASIGNACIÓN DOCENTE / ESTUDIANTE)
// ==========================================
let detMateriaCodigoBase = '';
let detParaleloSeleccionado = 'A';
let detMateriaCompleto = '';

window.abrirDetalleParaleloModal = function(codigo) {
    detMateriaCodigoBase = codigo.split('-')[0].toUpperCase();
    detParaleloSeleccionado = codigo.split('-')[1].toUpperCase();
    detMateriaCompleto = codigo;
    
    const modal = document.getElementById('modal-paralelo-detalle');
    if (modal) modal.style.display = 'flex';
    
    window.renderParaleloDetalles();
};

window.renderParaleloDetalles = async function() {
    // Highlight parallel buttons
    const parBtns = document.querySelectorAll('#modal-paralelo-detalle .asig-par-btn');
    parBtns.forEach(btn => {
        const p = btn.dataset.paralelo;
        if (p === detParaleloSeleccionado) {
            btn.style.background = 'var(--primary)';
            btn.style.color = 'white';
        } else {
            btn.style.background = 'var(--nav-hover)';
            btn.style.color = 'var(--text-main)';
        }
    });
    
    const container = document.getElementById('asig-modal-paralelo-contenido');
    if (!container) return;
    container.innerHTML = '<p style="text-align: center; color: var(--text-muted); padding: 1rem;">Cargando detalles...</p>';
    
    try {
        const materias = await window.pywebview.api.obtener_materias();
        const mat = materias.find(m => m.codigo === detMateriaCompleto);
        
        const baseMat = materias.find(m => m.codigo.startsWith(detMateriaCodigoBase));
        const matName = baseMat ? baseMat.nombre : 'Materia';
        
        document.getElementById('asig-modal-detalles-titulo').innerText = `${detMateriaCodigoBase} - ${matName}`;
        document.getElementById('asig-modal-detalles-subtitulo').innerText = `Carrera: ${mcmCarreraActiva} | Semestre: ${mcmSemestreActivo} | Código Completo: ${detMateriaCompleto}`;
        
        if (!mat) {
            container.innerHTML = `
                <div style="text-align: center; padding: 2rem 1rem; border: 2px dashed var(--input-border); border-radius: 12px; background: var(--input-bg);">
                    <i class="fas fa-exclamation-triangle" style="font-size: 2rem; color: var(--primary); opacity: 0.6; margin-bottom: 0.8rem; display: block;"></i>
                    <h4 style="margin-bottom: 0.5rem; color: var(--text-main); font-size: 1rem;">Paralelo ${detParaleloSeleccionado} no creado</h4>
                    <p style="font-size: 0.8rem; color: var(--text-muted); margin-bottom: 1.2rem; line-height: 1.4;">
                        Este paralelo aún no está registrado. ¿Deseas inicializarlo utilizando los datos de esta materia?
                    </p>
                    <button type="button" id="btn-modal-crear-paralelo" class="action-btn" style="width: auto; margin: 0 auto; padding: 0.5rem 1.2rem;"><i class="fas fa-plus-circle"></i> Inicializar Paralelo ${detParaleloSeleccionado}</button>
                </div>
            `;
            
            document.getElementById('btn-modal-crear-paralelo')?.addEventListener('click', async () => {
                await window.crearParaleloRapido(detMateriaCodigoBase, matName, baseMat ? baseMat.creditos : 5, detParaleloSeleccionado, mcmSemestreActivo);
                window.renderParaleloDetalles();
            });
            return;
        }
        
        const docNombre = mat.docente_nombre || 'Sin asignar';
        const docEmail = mat.docente_email || '';
        const inscritos = mat.estudiantes_inscritos || [];
        
        container.innerHTML = `
            <div style="padding: 1rem; border: 1px solid var(--input-border); border-radius: 12px; background: var(--nav-hover); margin-bottom: 1.2rem; text-align: left;">
                <h4 style="margin: 0 0 0.8rem 0; color: var(--text-main); font-size: 0.95rem; border-bottom: 1.5px solid var(--primary); padding-bottom: 0.3rem;"><i class="fas fa-chalkboard-teacher"></i> Docente Asignado</h4>
                <div style="display: flex; align-items: center; justify-content: space-between; gap: 1rem; flex-wrap: wrap;">
                    <div>
                        <strong style="color: var(--text-main); font-size: 0.9rem;">${docNombre}</strong>
                        <span style="font-size: 0.75rem; color: var(--text-muted); display: block;">${docEmail || 'No asignado'}</span>
                    </div>
                    <button type="button" id="btn-modal-abrir-docente" class="action-btn secondary-btn" style="width: auto; margin: 0; padding: 0.4rem 0.8rem; font-size: 0.8rem;"><i class="fas fa-user-edit"></i> Cambiar Docente</button>
                </div>
                
                <div id="modal-cambio-docente-container" style="display: none; margin-top: 1rem; padding-top: 1rem; border-top: 1px solid var(--input-border);">
                    <div class="form-group" style="margin-bottom: 0.8rem;">
                        <label style="font-size: 0.8rem;">Selecciona el Docente:</label>
                        <select id="modal-panel-docente-select" style="width: 100%; padding: 0.6rem; border-radius: 8px; border: 1px solid var(--input-border); background: var(--input-bg); color: var(--text-main); font-family: inherit; font-size: 0.85rem; outline: none;"></select>
                    </div>
                    <div style="display: flex; gap: 0.5rem; justify-content: flex-end;">
                        <button type="button" id="btn-modal-guardar-docente" class="action-btn success-btn" style="width: auto; margin: 0; padding: 0.35rem 0.8rem; font-size: 0.75rem; border-radius: 6px;">Guardar</button>
                        <button type="button" id="btn-modal-cancelar-docente" class="action-btn secondary-btn" style="width: auto; margin: 0; padding: 0.35rem 0.8rem; font-size: 0.75rem; border-radius: 6px;">Cancelar</button>
                    </div>
                </div>
            </div>
            
            <div style="padding: 1rem; border: 1px solid var(--input-border); border-radius: 12px; background: var(--nav-hover); text-align: left;">
                <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1.5px solid var(--primary); padding-bottom: 0.3rem; margin-bottom: 0.8rem;">
                    <h4 style="margin: 0; color: var(--text-main); font-size: 0.95rem;"><i class="fas fa-user-graduate"></i> Estudiantes Inscritos (${inscritos.length})</h4>
                    <button type="button" id="btn-modal-inscribir-alumnos" class="action-btn success-btn" style="width: auto; margin: 0; padding: 0.25rem 0.6rem; font-size: 0.75rem; border-radius: 4px;"><i class="fas fa-plus"></i> Inscribir</button>
                </div>
                
                <div id="modal-inscripcion-estudiantes-container" style="display: none; margin-bottom: 1rem; padding: 0.8rem; border: 1px solid var(--input-border); border-radius: 8px; background: var(--page-bg);">
                    <p style="font-size: 0.8rem; color: var(--text-muted); margin-bottom: 0.6rem;">Selecciona estudiantes de la carrera a inscribir:</p>
                    <div id="modal-panel-elegibles-container" style="max-height: 120px; overflow-y: auto; margin-bottom: 0.8rem; border: 1px solid var(--input-border); border-radius: 6px; padding: 0.4rem; background: var(--input-bg);">
                        <!-- List of eligible students -->
                    </div>
                    <div style="display: flex; gap: 0.5rem; justify-content: flex-end;">
                        <button type="button" id="btn-modal-confirmar-estudiantes" class="action-btn success-btn" style="width: auto; margin: 0; padding: 0.35rem 0.8rem; font-size: 0.75rem; border-radius: 6px;">Inscribir Seleccionados</button>
                        <button type="button" id="btn-modal-cancelar-estudiantes" class="action-btn secondary-btn" style="width: auto; margin: 0; padding: 0.35rem 0.8rem; font-size: 0.75rem; border-radius: 6px;">Cancelar</button>
                    </div>
                </div>
                
                <div id="modal-alumnos-list-container" style="display: flex; flex-direction: column; gap: 0.4rem; max-height: 200px; overflow-y: auto;">
                    <!-- Enrolled students list -->
                </div>
            </div>
        `;
        
        const alumnosListContainer = document.getElementById('modal-alumnos-list-container');
        if (inscritos.length === 0) {
            alumnosListContainer.innerHTML = '<p style="text-align: center; color: var(--text-muted); padding: 1rem; font-size: 0.8rem; margin: 0;">No hay alumnos inscritos en este paralelo.</p>';
        } else {
            const todosEstudiantes = await window.pywebview.api.obtener_estudiantes();
            const inscritosData = todosEstudiantes.filter(est => inscritos.includes(est.identificacion));
            
            inscritosData.forEach(est => {
                alumnosListContainer.innerHTML += `
                    <div style="display: flex; align-items: center; justify-content: space-between; padding: 0.4rem 0.6rem; background: var(--page-bg); border: 1px solid var(--input-border); border-radius: 8px;">
                        <div>
                            <strong style="color: var(--text-main); font-size: 0.85rem;">${est.nombre}</strong>
                            <span style="font-size: 0.7rem; color: var(--text-muted); display: block;">ID: ${est.identificacion} | Semestre: ${est.semestre || '1'}</span>
                        </div>
                        <button type="button" class="btn-modal-quitar-estudiante action-btn secondary-btn" data-id="${est.identificacion}" style="width: auto; margin: 0; padding: 0.2rem 0.5rem; font-size: 0.7rem; border-radius: 4px; border-color: #fca5a5; color: #ef4444;"><i class="fas fa-user-minus"></i> Quitar</button>
                    </div>
                `;
            });
            
            document.querySelectorAll('.btn-modal-quitar-estudiante').forEach(btnQuitar => {
                btnQuitar.addEventListener('click', async () => {
                    if (confirm(`¿Estás seguro de que deseas desinscribir a este estudiante del paralelo ${detParaleloSeleccionado}?`)) {
                        try {
                            const qRes = await window.pywebview.api.desinscribir_estudiante_materia(detMateriaCompleto, btnQuitar.dataset.id);
                            alert(qRes.message);
                            if (qRes.success) {
                                window.renderParaleloDetalles();
                                window.renderCarreraMaterias();
                            }
                        } catch (eq) {
                            console.error("Error al desinscribir:", eq);
                        }
                    }
                });
            });
        }
        
        const containerCambioDoc = document.getElementById('modal-cambio-docente-container');
        const selectDocentePanel = document.getElementById('modal-panel-docente-select');
        
        document.getElementById('btn-modal-abrir-docente')?.addEventListener('click', async () => {
            if (!containerCambioDoc || !selectDocentePanel) return;
            containerCambioDoc.style.display = 'block';
            selectDocentePanel.innerHTML = '<option value="">Cargando docentes...</option>';
            
            try {
                let docentes = await window.pywebview.api.obtener_docentes();
                docentes = docentes.filter(d => {
                    const cList = Array.isArray(d.carrera) ? d.carrera : [d.carrera];
                    return cList.includes(mcmCarreraActiva);
                });
                
                selectDocentePanel.innerHTML = '<option value="">Ninguno (Desasignar)</option>';
                docentes.forEach(d => {
                    const email = `${d.identificacion}@gmail.com`;
                    const isSelected = mat.docente_email === email ? 'selected' : '';
                    selectDocentePanel.innerHTML += `<option value="${email}" ${isSelected}>${d.nombre} (${d.especialidad || 'General'})</option>`;
                });
            } catch (edoc) {
                console.error("Error al cargar docentes:", edoc);
            }
        });
        
        document.getElementById('btn-modal-cancelar-docente')?.addEventListener('click', () => {
            if (containerCambioDoc) containerCambioDoc.style.display = 'none';
        });
        
        document.getElementById('btn-modal-guardar-docente')?.addEventListener('click', async () => {
            if (!selectDocentePanel) return;
            const docEmail = selectDocentePanel.value;
            
            try {
                const dRes = await window.pywebview.api.asignar_docente_materia(detMateriaCompleto, docEmail);
                alert(dRes.message);
                if (dRes.success) {
                    window.renderParaleloDetalles();
                    window.renderCarreraMaterias();
                    cargarMaterias();
                }
            } catch (edoc2) {
                console.error("Error al guardar docente:", edoc2);
            }
        });
        
        const containerInscEst = document.getElementById('modal-inscripcion-estudiantes-container');
        const containerElegibles = document.getElementById('modal-panel-elegibles-container');
        
        document.getElementById('btn-modal-inscribir-alumnos')?.addEventListener('click', async () => {
            if (!containerInscEst || !containerElegibles) return;
            containerInscEst.style.display = 'block';
            containerElegibles.innerHTML = '<p style="text-align: center; color: var(--text-muted); font-size: 0.8rem; padding: 0.5rem;">Cargando elegibles...</p>';
            
            try {
                const elegibles = await window.pywebview.api.obtener_estudiantes_elegibles_materia(detMateriaCompleto, mcmCarreraActiva);
                containerElegibles.innerHTML = '';
                if (elegibles.length === 0) {
                    containerElegibles.innerHTML = '<p style="text-align: center; color: var(--text-muted); font-size: 0.8rem; padding: 0.5rem;">No hay estudiantes elegibles.</p>';
                    return;
                }
                
                elegibles.forEach(est => {
                    containerElegibles.innerHTML += `
                        <div style="display: flex; align-items: center; gap: 0.4rem; padding: 0.3rem 0.5rem; border-bottom: 1px solid var(--input-border);">
                            <input type="checkbox" class="asig-eleg-cb" value="${est.identificacion}" id="asig-cb-el-${est.identificacion}" style="width: auto; margin: 0; cursor: pointer;">
                            <label for="asig-cb-el-${est.identificacion}" style="cursor: pointer; font-size: 0.8rem; color: var(--text-main); margin: 0; flex: 1;">
                                <strong>${est.nombre}</strong> (ID: ${est.identificacion} | Semestre: ${est.semestre || '1'})
                            </label>
                         </div>
                    `;
                });
            } catch (eele) {
                console.error("Error al cargar elegibles:", eele);
            }
        });
        
        document.getElementById('btn-modal-cancelar-estudiantes')?.addEventListener('click', () => {
            if (containerInscEst) containerInscEst.style.display = 'none';
        });
        
        document.getElementById('btn-modal-confirmar-estudiantes')?.addEventListener('click', async () => {
            const checked = containerElegibles.querySelectorAll('.asig-eleg-cb:checked');
            if (checked.length === 0) {
                alert("Por favor selecciona al menos un estudiante.");
                return;
            }
            
            const ids = Array.from(checked).map(cb => cb.value);
            try {
                const iRes = await window.pywebview.api.inscribir_estudiantes_materia(detMateriaCompleto, ids);
                alert(iRes.message);
                if (iRes.success) {
                    window.renderParaleloDetalles();
                    window.renderCarreraMaterias();
                }
            } catch (eins) {
                console.error("Error al inscribir estudiantes:", eins);
            }
        });
        
    } catch (err) {
        console.error("Error al cargar detalles de paralelo:", err);
    }
};

document.querySelectorAll('#modal-paralelo-detalle .asig-par-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        detParaleloSeleccionado = btn.dataset.paralelo;
        detMateriaCompleto = `${detMateriaCodigoBase}-${detParaleloSeleccionado}`;
        window.renderParaleloDetalles();
    });
});

document.getElementById('btn-cerrar-modal-paralelo-detalle')?.addEventListener('click', () => {
    const modal = document.getElementById('modal-paralelo-detalle');
    if (modal) modal.style.display = 'none';
});

// ==========================================
// RESIZER DE BARRA LATERAL (SIDEBAR)
// ==========================================
(function() {
    const sidebar = document.querySelector('.sidebar');
    const resizer = document.getElementById('sidebar-resizer');

    if (sidebar && resizer) {
        let isResizing = false;
        
        resizer.addEventListener('mousedown', (e) => {
            isResizing = true;
            document.body.style.cursor = 'col-resize';
            document.body.style.userSelect = 'none';
            e.preventDefault();
        });
        
        document.addEventListener('mousemove', (e) => {
            if (!isResizing) return;
            
            let newWidth = e.clientX;
            
            // Límites para el ancho del sidebar
            if (newWidth < 80) {
                newWidth = 80;
            } else if (newWidth > 450) {
                newWidth = 450;
            }
            
            sidebar.style.width = `${newWidth}px`;
            sidebar.style.minWidth = `${newWidth}px`;
            sidebar.style.maxWidth = `${newWidth}px`;
            
            // Si es menor a 160px, colapsar textos para vista compacta
            const spans = sidebar.querySelectorAll('.sidebar-nav span, .sidebar-header h2, .sidebar-footer span');
            const logo = sidebar.querySelector('.sidebar-logo');
            const header = sidebar.querySelector('.sidebar-header');
            
            if (newWidth < 160) {
                spans.forEach(s => s.style.display = 'none');
                if (logo) logo.style.margin = '0 auto';
                if (header) {
                    header.style.justifyContent = 'center';
                    header.style.paddingBottom = '0';
                }
                sidebar.style.padding = '2rem 0.5rem';
            } else {
                spans.forEach(s => s.style.removeProperty('display'));
                if (logo) logo.style.removeProperty('margin');
                if (header) {
                    header.style.removeProperty('justify-content');
                    header.style.removeProperty('padding-bottom');
                }
                sidebar.style.padding = '2rem 1.5rem';
            }
        });
        
        document.addEventListener('mouseup', () => {
            if (isResizing) {
                isResizing = false;
                document.body.style.cursor = 'default';
                document.body.style.userSelect = 'auto';
            }
        });
    }
})();
