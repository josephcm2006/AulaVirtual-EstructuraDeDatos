// ==========================================
// REFERENCIAS AL DOM
// ==========================================

// Vistas
const loginView = document.getElementById('login-view');
const dashboardView = document.getElementById('dashboard-view');

// Formularios
const loginForm = document.getElementById('login-form');
const formEstudiante = document.getElementById('form-estudiante');
const formMateria = document.getElementById('form-materia');
const formTarea = document.getElementById('form-tarea');

// Botones y Elementos
const btnSkipLogin = document.getElementById('btn-skip-login');
const btnLogout = document.getElementById('btn-logout');
const btnBuscarMateria = document.getElementById('btn-buscar-materia');
const btnCompletarTarea = document.getElementById('btn-completar-tarea');
const btnRefreshHistorial = document.getElementById('btn-refresh-historial');

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

function showDashboard() {
    loginView.style.display = 'none';
    dashboardView.style.display = 'flex';
    // Cargar historial por defecto al entrar
    cargarHistorial();
    cargarMaterias(); // Para llenar el portal del estudiante
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

    // Cargar datos dinámicos según la vista
    if (targetId === 'inicio') cargarHistorial();
    if (targetId === 'cursos' || targetId === 'mi-portal') cargarMaterias();
    if (targetId === 'estudiantes') cargarEstudiantes();
    if (targetId === 'tareas') cargarTareas();
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

        // Llenar dropdown de notificaciones
        if (notifList) {
            notifList.innerHTML = '';
            historial.forEach(accion => {
                notifList.innerHTML += `
                        <li>
                            <strong>${accion.hora}</strong><br>
                            ${accion.descripcion}
                        </li>
                    `;
            });
            notifBadge.innerText = historial.length;
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
    const carrera = document.getElementById('est-carrera').value;

    const res = await window.pywebview.api.agregar_estudiante(id, nombre, carrera);
    alert(res.message);
    if (res.success) {
        formEstudiante.reset();
        cargarEstudiantes();
        cargarHistorial(); // Refrescar notificaciones
    }
});

// --- MATERIAS (ÁRBOL BST) ---
async function cargarMaterias() {
    const tabla = document.querySelector('#tabla-materias tbody');
    const gridEstudiante = document.getElementById('student-subjects-grid');

    try {
        // Retorna la lista in-orden (orden alfabético por código)
        const materias = await window.pywebview.api.obtener_materias();

        // Llenar tabla en vista "Cursos"
        if (tabla) {
            tabla.innerHTML = '';
            materias.forEach(mat => {
                tabla.innerHTML += `
                        <tr>
                            <td><strong>${mat.codigo}</strong></td>
                            <td>${mat.nombre}</td>
                            <td>${mat.creditos}</td>
                            <td>${mat.horario || 'Por definir'}</td>
                        </tr>
                    `;
            });
        }

        // Llenar Grid en vista "Mi Portal"
        if (gridEstudiante) {
            gridEstudiante.innerHTML = '';
            materias.forEach(mat => {
                // Seleccionar un icono al azar basado en el código
                const icons = ['fa-laptop-code', 'fa-book', 'fa-flask', 'fa-calculator', 'fa-globe', 'fa-atom'];
                const icon = icons[mat.codigo.length % icons.length];

                gridEstudiante.innerHTML += `
                        <div class="subject-card">
                            <div class="subject-img">
                                <i class="fas ${icon}"></i>
                            </div>
                            <div class="subject-info">
                                <h4>${mat.nombre}</h4>
                                <p><i class="fas fa-barcode"></i> Código: ${mat.codigo}</p>
                                <p><i class="far fa-clock"></i> ${mat.horario || 'Por definir'}</p>
                                <p><i class="fas fa-award"></i> Créditos: ${mat.creditos}</p>
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

    const res = await window.pywebview.api.agregar_materia(codigo, nombre, parseInt(creditos), horario);
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

    const res = await window.pywebview.api.agregar_tarea(desc);
    if (res.success) {
        formTarea.reset();
        cargarTareas();
        cargarHistorial(); // Refrescar notificaciones
    }
});

btnCompletarTarea?.addEventListener('click', async () => {
    const res = await window.pywebview.api.completar_tarea();
    alert(res.message);
    if (res.success) {
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

        if (respuesta.success) showDashboard();
        else alert(`Error: ${respuesta.message}`);
    });
});

btnSkipLogin.addEventListener('click', () => showDashboard());
btnLogout.addEventListener('click', () => showLogin());
btnRefreshHistorial?.addEventListener('click', () => cargarHistorial());

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
