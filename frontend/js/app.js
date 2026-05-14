// 1. Seleccionamos nuestros elementos del DOM
const botonPrueba = document.getElementById('btn-prueba');

// 2. Esperamos a que el puente entre Python y JS esté 100% listo
window.addEventListener('pywebviewready', function() {
    
    console.log("¡El motor de Python está conectado y listo!");

    // 3. Ahora sí, asignamos los eventos a los botones
    botonPrueba.addEventListener('click', async () => {
        try {
            // Llamamos a la función de Python
            const respuesta = await window.pywebview.api.hacer_ping("Hola desde app.js");
            alert(respuesta);
        } catch (error) {
            console.error("Error al comunicarse con Python:", error);
        }
    });

});