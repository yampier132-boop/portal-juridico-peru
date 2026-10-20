import { camposComunes, tiposPublicacion } from "./schema.js";

const acceso = document.querySelector("#acceso");
const editor = document.querySelector("#editor");
const tipo = document.querySelector("#tipo");
const formulario = document.querySelector("#formulario");
const mensajeAcceso = document.querySelector("#mensaje-acceso");
const mensajePublicacion = document.querySelector("#mensaje-publicacion");
const botonPublicar = document.querySelector("#publicar");
const camposEspecificos = document.querySelector("#campos-especificos");

function mostrarMensaje(elemento, texto, error = false) {
  elemento.textContent = texto;
  elemento.dataset.error = String(error);
}

function crearCampo(campo) {
  const etiqueta = document.createElement("label");
  etiqueta.className = "campo";
  etiqueta.append(document.createTextNode(campo.etiqueta));

  let control;
  if (campo.tipo === "textarea") {
    control = document.createElement("textarea");
    control.rows = 5;
  } else if (campo.tipo === "select") {
    control = document.createElement("select");
    const opcionVacia = document.createElement("option");
    opcionVacia.value = "";
    opcionVacia.textContent = "Selecciona una materia";
    control.append(opcionVacia);
    campo.opciones.forEach((valor) => {
      const opcion = document.createElement("option");
      opcion.value = valor;
      opcion.textContent = valor;
      control.append(opcion);
    });
  } else {
    control = document.createElement("input");
    control.type = campo.tipo;
  }

  control.name = campo.id;
  control.required = campo.requerido;
  if (campo.maximo) control.maxLength = campo.maximo;
  etiqueta.append(control);
  return etiqueta;
}

camposComunes.forEach((campo) => {
  document.querySelector("#campos-comunes").append(crearCampo(campo));
});

tiposPublicacion.forEach((publicacion) => {
  const opcion = document.createElement("option");
  opcion.value = publicacion.id;
  opcion.textContent = publicacion.nombre;
  tipo.append(opcion);
});

function actualizarCamposEspecificos() {
  const publicacion = tiposPublicacion.find((item) => item.id === tipo.value);
  camposEspecificos.replaceChildren(...publicacion.campos.map(crearCampo));
  document.querySelector("#descripcion-tipo").textContent = publicacion.descripcion;
  document.querySelector("#titulo-campos").textContent = `Información para ${publicacion.nombre}`;
}

tipo.addEventListener("change", actualizarCamposEspecificos);
actualizarCamposEspecificos();

async function obtenerSesion() {
  const respuesta = await fetch("/auth/session", { credentials: "same-origin" });
  if (!respuesta.ok) throw new Error("No se pudo comprobar la sesión de administración.");
  return respuesta.json();
}

function mostrarEditor(usuario) {
  acceso.hidden = true;
  editor.hidden = false;
  document.querySelector("#usuario-actual").textContent = `Sesión iniciada como ${usuario}.`;
}

async function iniciarSesion() {
  mostrarMensaje(mensajeAcceso, "Conectando con GitHub…");
  window.location.assign("/auth/login");
}

const loginButton = document.querySelector("#iniciar-sesion");
loginButton.addEventListener("click", iniciarSesion);

document.querySelector("#cerrar-sesion").addEventListener("click", async () => {
  const respuesta = await fetch("/auth/logout", { method: "POST", credentials: "same-origin" });
  if (!respuesta.ok) {
    mostrarMensaje(mensajePublicacion, "No se pudo cerrar la sesión. Intenta nuevamente.", true);
    return;
  }
  window.location.reload();
});

document.querySelector("#limpiar").addEventListener("click", () => {
  window.setTimeout(() => {
    tipo.value = tiposPublicacion[0].id;
    actualizarCamposEspecificos();
    mostrarMensaje(mensajePublicacion, "");
  }, 0);
});

formulario.addEventListener("submit", async (evento) => {
  evento.preventDefault();
  if (!formulario.reportValidity()) return;

  const seleccion = tiposPublicacion.find((item) => item.id === tipo.value);
  const formData = new FormData(formulario);
  const datos = Object.fromEntries(formData.entries());
  const details = Object.fromEntries(
    seleccion.campos.map((campo) => [campo.id, String(datos[campo.id] || "").trim()]),
  );
  const publicacion = {
    type: seleccion.id,
    title: String(datos.titulo).trim(),
    summary: String(datos.resumen).trim(),
    author: String(datos.autor).trim(),
    publishedAt: String(datos.fechaPublicacionPortal),
    materia: String(datos.materia),
    sourceName: String(datos.fuentePrincipal || "").trim(),
    sourceUrl: String(datos.enlacePrincipal || "").trim(),
    details,
  };

  botonPublicar.disabled = true;
  mostrarMensaje(mensajePublicacion, "Validando y guardando la publicación…");
  try {
    const respuesta = await fetch("/publish", {
      method: "POST",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(publicacion),
    });
    const resultado = await respuesta.json();
    if (!respuesta.ok) throw new Error(resultado.error || "No se pudo guardar la publicación.");

    formulario.reset();
    tipo.value = tiposPublicacion[0].id;
    actualizarCamposEspecificos();
    mostrarMensaje(mensajePublicacion, "Publicación guardada. El portal se actualizará cuando termine el despliegue de GitHub Pages.");
  } catch (error) {
    mostrarMensaje(mensajePublicacion, error.message || "Error inesperado al publicar.", true);
  } finally {
    botonPublicar.disabled = false;
  }
});

try {
  const sesion = await obtenerSesion();
  if (sesion.authenticated) {
    mostrarEditor(sesion.login);
  } else if (sesion.configured === false) {
    loginButton.disabled = true;
    mostrarMensaje(mensajeAcceso, "El panel todavía requiere configuración en Cloudflare antes de poder iniciar sesión.", true);
  } else {
    const authStatus = new URLSearchParams(window.location.search).get("auth");
    if (authStatus === "unauthorized") {
      mostrarMensaje(mensajeAcceso, "Esta cuenta de GitHub no está autorizada para administrar De Ley.", true);
    } else if (authStatus === "cancelled") {
      mostrarMensaje(mensajeAcceso, "Se canceló el inicio de sesión con GitHub.", true);
    }
    if (authStatus) window.history.replaceState({}, "", window.location.pathname);
  }
} catch (error) {
  mostrarMensaje(mensajeAcceso, `${error.message} Revisa la conexión y vuelve a cargar la página.`, true);
}
