
/* =====================================================
   Q'CHULA JEWELRY
   Carrito, catálogo, WhatsApp y detalles visuales
   ===================================================== */


/* 1. CONFIGURACIÓN GENERAL */

const WHATSAPP_QCHULA = "573227495239";
const CLAVE_CARRITO = "carritoQChula";


/* 2. UTILIDADES GENERALES */

function formatearPrecio(precio) {
    return new Intl.NumberFormat("es-CO", {
        style: "currency",
        currency: "COP",
        maximumFractionDigits: 0
    }).format(Number(precio) || 0);
}

function escaparHTML(texto) {
    return String(texto).replace(/[&<>"']/g, caracter => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[caracter]);
}


/* 3. OBTENER Y GUARDAR EL CARRITO */

// También recupera productos de la clave antigua "carrito"
// si todavía no existe el nuevo carrito de Q'Chula.

function obtenerCarritoGuardado() {
    try {
        let datos = localStorage.getItem(CLAVE_CARRITO);

        if (datos === null) {
            const antiguo = localStorage.getItem("carrito");

            if (antiguo !== null) {
                datos = antiguo;
            }
        }

        const productos = JSON.parse(datos || "[]");

        if (!Array.isArray(productos)) return [];

        return productos
            .filter(producto =>
                producto &&
                typeof producto.nombre === "string" &&
                Number.isFinite(Number(producto.precio)) &&
                Number(producto.precio) >= 0
            )
            .map(producto => ({
                nombre: producto.nombre,
                precio: Number(producto.precio),
                cantidad: Math.max(
                    1,
                    Math.floor(Number(producto.cantidad) || 1)
                ),
                imagen: typeof producto.imagen === "string"
                    ? producto.imagen
                    : ""
            }));
    } catch (error) {
        console.error("Error al recuperar el carrito:", error);
        return [];
    }
}

let carrito = obtenerCarritoGuardado();

function guardarCarrito() {
    try {
        localStorage.setItem(
            CLAVE_CARRITO,
            JSON.stringify(carrito)
        );

        return true;
    } catch (error) {
        console.error("Error al guardar el carrito:", error);
        alert("No se pudieron guardar los cambios del carrito.");
        return false;
    }
}

function guardarYActualizar() {
    if (!guardarCarrito()) return;

    mostrarCarrito();
    actualizarContadorCarrito();
    actualizarMiniCarrito();
}


/* 4. AGREGAR PRODUCTOS */

function agregarAlCarrito(nombre, precio, imagen = "") {
    nombre = String(nombre || "").trim();
    precio = Number(precio);

    if (
        !nombre ||
        !Number.isFinite(precio) ||
        precio < 0
    ) {
        alert("No se pudo agregar este producto.");
        return;
    }

    const existente = carrito.find(producto =>
        producto.nombre === nombre &&
        producto.precio === precio
    );

    if (existente) {
        existente.cantidad += 1;

        if (!existente.imagen && imagen) {
            existente.imagen = imagen;
        }
    } else {
        carrito.push({
            nombre,
            precio,
            cantidad: 1,
            imagen: imagen || ""
        });
    }

    if (!guardarCarrito()) return;

    mostrarCarrito();
    actualizarContadorCarrito();
    actualizarMiniCarrito();
    abrirMiniCarrito();

    mostrarNotificacion(
        `${nombre} se agregó a tu carrito.`
    );
}


/* 5. CAMBIAR LA CANTIDAD */

function cambiarCantidad(nombre, cambio, precio = null) {
    const producto = carrito.find(item =>
        item.nombre === nombre &&
        (precio === null || item.precio === Number(precio))
    );

    if (!producto) return;

    producto.cantidad += Number(cambio);

    if (producto.cantidad <= 0) {
        carrito = carrito.filter(item => item !== producto);
    }

    guardarYActualizar();
}


/* 6. ELIMINAR PRODUCTOS */

function eliminarDelCarrito(nombre, precio = null) {
    carrito = carrito.filter(producto =>
        !(
            producto.nombre === nombre &&
            (precio === null || producto.precio === Number(precio))
        )
    );

    guardarYActualizar();
}

/* 7. VACIAR EL CARRITO */

function vaciarCarrito() {
    if (carrito.length === 0) {
        mostrarNotificacion("Tu carrito ya está vacío ♡");
        return;
    }

    // Evitar crear dos confirmaciones al mismo tiempo.
    if (document.getElementById("confirmacionVaciarCarrito")) {
        return;
    }

    const confirmacion = document.createElement("div");
    confirmacion.id = "confirmacionVaciarCarrito";
    confirmacion.className = "qchula-confirmacion-fondo";

    confirmacion.innerHTML = `
        <section
            class="qchula-confirmacion"
            role="dialog"
            aria-modal="true"
            aria-labelledby="tituloConfirmacionVaciar"
        >
            <span class="qchula-confirmacion-icono" aria-hidden="true">♡</span>

            <h2 id="tituloConfirmacionVaciar">
                ¿Quieres vaciar tu carrito?
            </h2>

            <p>
                Se eliminarán todos los accesorios que has seleccionado.
            </p>

            <div class="qchula-confirmacion-botones">
                <button
                    type="button"
                    id="cancelarVaciadoCarrito"
                    class="qchula-btn-cancelar"
                >
                    Seguir comprando
                </button>

                <button
                    type="button"
                    id="confirmarVaciadoCarrito"
                    class="qchula-btn-confirmar"
                >
                    Sí, vaciar carrito
                </button>
            </div>
        </section>
    `;

    document.body.appendChild(confirmacion);

    document.getElementById("cancelarVaciadoCarrito")
        .addEventListener("click", () => {
            confirmacion.remove();
        });

    document.getElementById("confirmarVaciadoCarrito")
        .addEventListener("click", () => {
            carrito = [];

            if (guardarCarrito()) {
                mostrarCarrito();
                actualizarContadorCarrito();
                actualizarMiniCarrito();

                confirmacion.remove();

                mostrarNotificacion(
                    "Tu carrito se ha vaciado correctamente ♡"
                );
            }
        });

    document.getElementById("cancelarVaciadoCarrito").focus();
}

/* 8. CALCULAR TOTALES */

function calcularTotalCarrito() {
    return carrito.reduce(
        (total, producto) =>
            total + producto.precio * producto.cantidad,
        0
    );
}

function calcularCantidadTotal() {
    return carrito.reduce(
        (total, producto) => total + producto.cantidad,
        0
    );
}


/* 9. CONTADOR DEL CARRITO */

function actualizarContadorCarrito() {
    const contador = document.getElementById("contadorCarrito");

    if (!contador) return;

    const cantidad = calcularCantidadTotal();

    contador.textContent = cantidad;
    contador.hidden = cantidad === 0;
    contador.setAttribute(
        "aria-label",
        `${cantidad} productos en el carrito`
    );
}


/* 10. MOSTRAR PRODUCTOS EN carrito.html */

function mostrarCarrito() {
    const lista = document.getElementById("listaCarrito");
    const total = document.getElementById("totalCarrito");

    if (!lista || !total) return;

    const botonVaciar = document.getElementById("vaciarCarrito");
    const botonPedido = document.getElementById("finalizarPedido");

    if (carrito.length === 0) {
        lista.innerHTML = `
            <div class="carrito-vacio">
                <p class="carrito-vacio-icono" aria-hidden="true">♡</p>
                <h3>Tu carrito está esperando</h3>
                <p>Aún no has agregado tus accesorios favoritos.</p>
                <a href="productos.html" class="btn">
                    Explorar productos
                </a>
            </div>
        `;

        total.textContent = formatearPrecio(0);

        if (botonVaciar) botonVaciar.disabled = true;
        if (botonPedido) botonPedido.disabled = true;

        return;
    }

    lista.innerHTML = carrito.map((producto, indice) => {
        const nombre = escaparHTML(producto.nombre);
        const imagen = producto.imagen
            ? escaparHTML(producto.imagen)
            : "";

        const subtotal = producto.precio * producto.cantidad;

        return `
            <article class="carrito-producto">

                ${
                    imagen
                        ? `
                            <img
                                class="carrito-producto-imagen"
                                src="${imagen}"
                                alt="${nombre}"
                                loading="lazy"
                            >
                        `
                        : ""
                }

                <div class="carrito-producto-info">
                    <h3>${nombre}</h3>

                    <p>${formatearPrecio(producto.precio)} c/u</p>

                    <p>
                        Subtotal:
                        <strong>${formatearPrecio(subtotal)}</strong>
                    </p>
                </div>

                <div class="carrito-cantidad">
                    <button
                        type="button"
                        data-accion-carrito="restar"
                        data-indice="${indice}"
                        aria-label="Disminuir cantidad de ${nombre}"
                    >−</button>

                    <span>${producto.cantidad}</span>

                    <button
                        type="button"
                        data-accion-carrito="sumar"
                        data-indice="${indice}"
                        aria-label="Aumentar cantidad de ${nombre}"
                    >+</button>
                </div>

                <button
                    type="button"
                    class="carrito-eliminar"
                    data-accion-carrito="eliminar"
                    data-indice="${indice}"
                >
                    Eliminar
                </button>

            </article>
        `;
    }).join("");

    total.textContent = formatearPrecio(calcularTotalCarrito());

    if (botonVaciar) botonVaciar.disabled = false;
    if (botonPedido) botonPedido.disabled = false;
}


/* 11. BOTONES DE carrito.html */

function manejarBotonesCarrito(evento) {
    const boton = evento.target.closest("[data-accion-carrito]");

    if (!boton) return;

    const indice = Number(boton.dataset.indice);
    const producto = carrito[indice];

    if (!producto) return;

    const accion = boton.dataset.accionCarrito;

    if (accion === "sumar") {
        cambiarCantidad(producto.nombre, 1, producto.precio);
    }

    if (accion === "restar") {
        cambiarCantidad(producto.nombre, -1, producto.precio);
    }

    if (accion === "eliminar") {
        eliminarDelCarrito(producto.nombre, producto.precio);
    }
}


/* 12. FINALIZAR PEDIDO POR WHATSAPP */

function finalizarPedidoWhatsApp() {
    if (carrito.length === 0) {
        alert("Tu carrito está vacío. Agrega algún accesorio primero.");
        return;
    }

    if (!/^\d{10,15}$/.test(WHATSAPP_QCHULA)) {
        alert("Revisa el número de WhatsApp configurado en script.js.");
        return;
    }

    let mensaje = "¡Hola, Q'Chula! 💗 Quiero hacer este pedido:\n\n";

    carrito.forEach((producto, indice) => {
        const subtotal = producto.precio * producto.cantidad;

        mensaje += `${indice + 1}. ${producto.nombre}\n`;
        mensaje += `Cantidad: ${producto.cantidad}\n`;
        mensaje += `Precio unitario: ${formatearPrecio(producto.precio)}\n`;
        mensaje += `Subtotal: ${formatearPrecio(subtotal)}\n\n`;
    });

    mensaje += `TOTAL DE LOS PRODUCTOS: ${formatearPrecio(calcularTotalCarrito())}\n\n`;
    mensaje += "¿Me confirman la disponibilidad y el valor del envío? ✨";

    const url =
        `https://wa.me/${WHATSAPP_QCHULA}?text=${encodeURIComponent(mensaje)}`;

    window.open(url, "_blank", "noopener,noreferrer");
}


/* 13. BÚSQUEDA Y FILTROS DE CATÁLOGO */

function filtrarProductos() {
    const buscador = document.getElementById("buscadorProductos");
    const filtroCategoria = document.getElementById("filtroCategoria");
    const filtroPrecio = document.getElementById("filtroPrecio");

    const busqueda = buscador
        ? buscador.value.trim().toLowerCase()
        : "";

    const categoria = filtroCategoria
        ? filtroCategoria.value
        : "todos";

    const precioMaximo = filtroPrecio && filtroPrecio.value
        ? Number(filtroPrecio.value)
        : Infinity;

    document.querySelectorAll(".producto-card").forEach(tarjeta => {
        const nombre = (
            tarjeta.dataset.nombre ||
            tarjeta.querySelector(".producto-nombre, h3, h4")?.textContent ||
            ""
        ).toLowerCase();

        const categoriaProducto = tarjeta.dataset.categoria || "todos";
        const precioProducto = Number(tarjeta.dataset.precio || 0);

        const coincideBusqueda = nombre.includes(busqueda);
        const coincideCategoria =
            categoria === "todos" || categoriaProducto === categoria;

        const coincidePrecio =
            precioMaximo === Infinity ||
            precioProducto <= precioMaximo;

        tarjeta.hidden = !(
            coincideBusqueda &&
            coincideCategoria &&
            coincidePrecio
        );
    });
}


/* 14. FILTROS POR BOTONES DEL CATÁLOGO */

function iniciarFiltrosCatalogo() {
    const botones = document.querySelectorAll(".filtro-btn");
    const productos = document.querySelectorAll(".producto-catalogo");
    const contador = document.getElementById("contadorProductos");
    const mensajeVacio = document.getElementById("sinProductos");

    if (!botones.length || !productos.length) return;

    function filtrar(categoria) {
        let cantidadVisible = 0;

        productos.forEach(producto => {
            const coincide =
                categoria === "todos" ||
                producto.dataset.categoria === categoria;

            producto.hidden = !coincide;

            if (coincide) cantidadVisible++;
        });

        if (contador) {
            contador.textContent =
                `${cantidadVisible} ${
                    cantidadVisible === 1 ? "producto" : "productos"
                }`;
        }

        if (mensajeVacio) {
            mensajeVacio.hidden = cantidadVisible !== 0;
        }
    }

    botones.forEach(boton => {
        boton.addEventListener("click", () => {
            const categoria = boton.dataset.filtro || "todos";

            botones.forEach(otro => {
                otro.classList.remove("activo");
                otro.setAttribute("aria-pressed", "false");
            });

            boton.classList.add("activo");
            boton.setAttribute("aria-pressed", "true");

            filtrar(categoria);
        });
    });

    const botonActivo = document.querySelector(".filtro-btn.activo");
    filtrar(botonActivo?.dataset.filtro || "todos");
}


/* 15. NOTIFICACIONES */

function mostrarNotificacion(mensaje) {
    let notificacion = document.getElementById("notificacionQChula");

    if (!notificacion) {
        // No interrumpir la compra con ventanas emergentes.
        console.info(mensaje);
        return;
    }

    notificacion.textContent = mensaje;
    notificacion.hidden = false;
    notificacion.setAttribute("role", "status");
    notificacion.setAttribute("aria-live", "polite");
    notificacion.classList.add("mostrar");

    if (notificacion._ocultar) {
        clearTimeout(notificacion._ocultar);
    }

    notificacion._ocultar = setTimeout(() => {
        notificacion.classList.remove("mostrar");
        notificacion.hidden = true;
    }, 2800);
}


/* 16. ANIMACIONES AL DESPLAZARSE */

function iniciarAnimaciones() {
    const elementos = document.querySelectorAll("[data-reveal]");

    if (!("IntersectionObserver" in window)) {
        elementos.forEach(elemento => elemento.classList.add("visible"));
        return;
    }

    const observador = new IntersectionObserver((entradas, observer) => {
        entradas.forEach(entrada => {
            if (entrada.isIntersecting) {
                entrada.target.classList.add("visible");
                observer.unobserve(entrada.target);
            }
        });
    }, {
        threshold: 0.12
    });

    elementos.forEach(elemento => observador.observe(elemento));
}


/* 17. EFECTO DE LA BARRA DE NAVEGACIÓN */

function iniciarEfectoNavbar() {
    const navbar = document.querySelector(".navbar");

    if (!navbar) return;

    const actualizar = () => {
        navbar.classList.toggle(
            "navbar-scrolled",
            window.scrollY > 30
        );
    };

    actualizar();

    window.addEventListener("scroll", actualizar, {
        passive: true
    });
}


/* 18. MINI CARRITO LATERAL */

function crearMiniCarrito() {
    if (document.getElementById("miniCarrito")) return;

    const fondo = document.createElement("div");
    fondo.className = "mini-carrito-fondo";
    fondo.id = "miniCarritoFondo";
    fondo.setAttribute("aria-hidden", "true");

    const panel = document.createElement("aside");
    panel.className = "mini-carrito";
    panel.id = "miniCarrito";
    panel.setAttribute("role", "dialog");
    panel.setAttribute("aria-modal", "true");
    panel.setAttribute("aria-labelledby", "miniCarritoTitulo");
    panel.setAttribute("aria-hidden", "true");
    panel.setAttribute("inert", "");

    panel.innerHTML = `
        <div class="mini-carrito-cabecera">
            <h2 id="miniCarritoTitulo">Tu carrito ♡</h2>

            <button
                class="mini-carrito-cerrar"
                id="cerrarMiniCarrito"
                type="button"
                aria-label="Cerrar carrito"
            >&times;</button>
        </div>

        <div
            class="mini-carrito-mensaje"
            id="miniCarritoMensaje"
            role="status"
            aria-live="polite"
        >
            Tu estilo empieza con los pequeños detalles.
        </div>

        <div class="mini-carrito-lista" id="miniCarritoLista"></div>

        <div class="mini-carrito-pie">
            <div class="mini-carrito-total">
                <span>Subtotal</span>
                <strong id="miniCarritoTotal">$0</strong>
            </div>

            <p class="mini-carrito-aclaracion">
                La disponibilidad y el valor del envío se confirman al realizar el pedido.
            </p>

            <div class="mini-carrito-acciones">
                <a href="carrito.html" class="mini-carrito-ver">
                    Ver mi carrito
                </a>

                <a href="productos.html" class="mini-carrito-seguir">
                    Seguir comprando
                </a>
            </div>
        </div>
    `;

    document.body.append(fondo, panel);

    document.getElementById("cerrarMiniCarrito")
        .addEventListener("click", cerrarMiniCarrito);

    fondo.addEventListener("click", cerrarMiniCarrito);

    // Clics en los controles del panel lateral.
    panel.addEventListener("click", evento => {
        const boton = evento.target.closest("[data-accion-mini]");

        if (!boton) return;

        const indice = Number(boton.dataset.indice);
        const producto = carrito[indice];

        if (!producto) return;

        switch (boton.dataset.accionMini) {
            case "sumar":
                cambiarCantidad(producto.nombre, 1, producto.precio);
                break;

            case "restar":
                cambiarCantidad(producto.nombre, -1, producto.precio);
                break;

            case "eliminar":
                eliminarDelCarrito(producto.nombre, producto.precio);
                break;
        }
    });

    document.addEventListener("keydown", evento => {
        const mini = document.getElementById("miniCarrito");

        if (!mini || !mini.classList.contains("abierto")) return;

        if (evento.key === "Escape") {
            cerrarMiniCarrito();
        }
    });

    actualizarMiniCarrito();
}


/* 19. ACTUALIZAR EL MINI CARRITO */

function actualizarMiniCarrito() {
    const lista = document.getElementById("miniCarritoLista");
    const total = document.getElementById("miniCarritoTotal");
    const mensaje = document.getElementById("miniCarritoMensaje");

    if (!lista || !total || !mensaje) return;

    if (carrito.length === 0) {
        lista.innerHTML = `
            <div class="mini-carrito-vacio">
                <span aria-hidden="true">♡</span>
                <p>Tu carrito está esperando algo especial.</p>
            </div>
        `;

        total.textContent = formatearPrecio(0);
        mensaje.textContent = "Todavía no has añadido productos.";
        return;
    }

    lista.innerHTML = carrito.map((producto, indice) => {
        const nombre = escaparHTML(producto.nombre);
        const imagen = producto.imagen
            ? escaparHTML(producto.imagen)
            : "";

        const subtotal = producto.precio * producto.cantidad;

        return `
            <article class="mini-carrito-item">

                ${
                    imagen
                        ? `
                            <img
                                class="mini-carrito-imagen"
                                src="${imagen}"
                                alt="${nombre}"
                                loading="lazy"
                            >
                        `
                        : ""
                }

                <div class="mini-carrito-info">
                    <h3>${nombre}</h3>

                    <p class="mini-carrito-precio">
                        ${formatearPrecio(producto.precio)} c/u
                    </p>

                    <p class="mini-carrito-subtotal-producto">
                        Subtotal: <strong>${formatearPrecio(subtotal)}</strong>
                    </p>

                    <div class="mini-carrito-controles">
                        <button
                            type="button"
                            class="mini-carrito-cantidad"
                            data-accion-mini="restar"
                            data-indice="${indice}"
                            aria-label="Disminuir cantidad de ${nombre}"
                        >−</button>

                        <span aria-label="Cantidad">
                            ${producto.cantidad}
                        </span>

                        <button
                            type="button"
                            class="mini-carrito-cantidad"
                            data-accion-mini="sumar"
                            data-indice="${indice}"
                            aria-label="Aumentar cantidad de ${nombre}"
                        >+</button>
                    </div>
                </div>

                <button
                    type="button"
                    class="mini-carrito-eliminar"
                    data-accion-mini="eliminar"
                    data-indice="${indice}"
                    aria-label="Eliminar ${nombre}"
                >
                    Eliminar
                </button>

            </article>
        `;
    }).join("");

    total.textContent = formatearPrecio(calcularTotalCarrito());

    mensaje.textContent =
        `${calcularCantidadTotal()} ${
            calcularCantidadTotal() === 1
                ? "unidad en tu carrito."
                : "unidades en tu carrito."
        }`;
}


/* 20. ABRIR Y CERRAR EL MINI CARRITO */

function abrirMiniCarrito() {
    crearMiniCarrito();
    actualizarMiniCarrito();

    const panel = document.getElementById("miniCarrito");
    const fondo = document.getElementById("miniCarritoFondo");

    if (!panel || !fondo) return;

    panel.removeAttribute("inert");
    panel.classList.add("abierto");
    fondo.classList.add("abierto");

    panel.setAttribute("aria-hidden", "false");
    document.body.classList.add("mini-carrito-abierto");

    document.getElementById("cerrarMiniCarrito")?.focus();
}

function cerrarMiniCarrito() {
    const panel = document.getElementById("miniCarrito");
    const fondo = document.getElementById("miniCarritoFondo");

    if (!panel || !fondo) return;

    panel.classList.remove("abierto");
    fondo.classList.remove("abierto");

    panel.setAttribute("aria-hidden", "true");
    panel.setAttribute("inert", "");

    document.body.classList.remove("mini-carrito-abierto");
}


/* 21. INICIAR TODO */

document.addEventListener("DOMContentLoaded", () => {
    mostrarCarrito();
    actualizarContadorCarrito();

    crearMiniCarrito();
    actualizarMiniCarrito();

    iniciarFiltrosCatalogo();
    iniciarAnimaciones();
    iniciarEfectoNavbar();

    // Búsqueda y filtros desplegables, si existen en la página.
    ["buscadorProductos", "filtroCategoria", "filtroPrecio"]
        .forEach(id => {
            const control = document.getElementById(id);

            if (control) {
                control.addEventListener("input", filtrarProductos);
                control.addEventListener("change", filtrarProductos);
            }
        });

    // Acciones del carrito de la página carrito.html.
    document.addEventListener("click", manejarBotonesCarrito);

    const botonPedido = document.getElementById("finalizarPedido");

    if (botonPedido) {
        botonPedido.addEventListener("click", finalizarPedidoWhatsApp);
    }

    const botonVaciar = document.getElementById("vaciarCarrito");

    if (botonVaciar) {
        botonVaciar.addEventListener("click", vaciarCarrito);
    }
});
