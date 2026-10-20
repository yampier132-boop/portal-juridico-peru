import { camposComunes, materias, tiposPublicacion } from "./schema.js";

const acceso = document.querySelector("#acceso");
const editor = document.querySelector("#editor");
const tipo = document.querySelector("#tipo");
const formulario = document.querySelector("#formulario");
const mensajeAcceso = document.querySelector("#mensaje-acceso");
const mensajePublicacion = document.querySelector("#mensaje-publicacion");
const botonPublicar = document.querySelector("#publicar");
const camposComunesContenedor = document.querySelector("#campos-comunes");
const camposEspecificos = document.querySelector("#campos-especificos");
const portadaIa = document.querySelector("#portada-ia");
const avisoPortada = document.querySelector("#aviso-portada");
const promptPortada = document.querySelector("#prompt-portada");
const imagenPortada = document.querySelector("#imagen-portada");
const textoAlternativo = document.querySelector("#texto-alternativo");
const vistaPreviaPortada = document.querySelector("#vista-previa-portada");
let urlVistaPrevia = "";

function mostrarMensaje(elemento, texto, error = false) {
  elemento.textContent = texto;
  elemento.dataset.error = String(error);
}

function crearCampo(campo) {
  if (campo.id === "materia" && campo.multiplePara?.includes(tipo.value)) {
    const grupo = document.createElement("fieldset");
    grupo.className = "campo-multiple";
    grupo.dataset.campoComun = campo.id;
    const leyenda = document.createElement("legend");
    leyenda.textContent = campo.etiquetaMultiple;
    const opciones = document.createElement("div");
    opciones.className = "opciones-multiples";
    materias.forEach((materia) => {
      const etiqueta = document.createElement("label");
      etiqueta.className = "opcion-multiple";
      const control = document.createElement("input");
      control.type = "checkbox";
      control.name = "materias";
      control.value = materia;
      etiqueta.append(control, document.createTextNode(materia));
      opciones.append(etiqueta);
    });
    grupo.append(leyenda, opciones);
    const ayuda = document.createElement("small");
    ayuda.textContent = campo.ayudaMultiple;
    grupo.append(ayuda);
    return grupo;
  }

  const etiqueta = document.createElement("label");
  etiqueta.className = "campo";
  etiqueta.dataset.campoComun = campo.id;
  etiqueta.append(document.createTextNode(campo.etiqueta));

  let control;
  if (campo.tipo === "textarea") {
    control = document.createElement("textarea");
    control.rows = 5;
  } else if (campo.tipo === "select") {
    control = document.createElement("select");
    const opcionVacia = document.createElement("option");
    opcionVacia.value = "";
    opcionVacia.textContent = campo.id === "materia" ? "Selecciona una materia" : "Selecciona una opción";
    control.append(opcionVacia);
    campo.opciones.forEach((item) => {
      const opcion = document.createElement("option");
      opcion.value = typeof item === "string" ? item : item.valor;
      opcion.textContent = typeof item === "string" ? item : item.etiqueta;
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
  if (campo.ayuda) {
    const ayuda = document.createElement("small");
    ayuda.textContent = campo.ayuda;
    etiqueta.append(ayuda);
  }
  return etiqueta;
}

camposComunes.forEach((campo) => {
  camposComunesContenedor.append(crearCampo(campo));
});

tiposPublicacion.forEach((publicacion) => {
  const opcion = document.createElement("option");
  opcion.value = publicacion.id;
  opcion.textContent = publicacion.nombre;
  tipo.append(opcion);
});

function actualizarCamposComunes() {
  const campoMateria = camposComunes.find((campo) => campo.id === "materia");
  if (!campoMateria) throw new Error("No se encontró el campo común de materia.");
  const reemplazo = crearCampo(campoMateria);
  const anterior = camposComunesContenedor.querySelector("[data-campo-comun='materia']");
  if (anterior) anterior.replaceWith(reemplazo);

  const esJurisprudencia = tipo.value === "jurisprudencia";
  ["fuentePrincipal", "enlacePrincipal"].forEach((id) => {
    const contenedor = camposComunesContenedor.querySelector(`[data-campo-comun="${id}"]`);
    if (!contenedor) return;
    contenedor.hidden = esJurisprudencia;
    contenedor.querySelector("input, select, textarea").disabled = esJurisprudencia;
  });
}

function actualizarPromptPortada() {
  const seleccion = tiposPublicacion.find((item) => item.id === tipo.value);
  if (!seleccion || seleccion.id !== "jurisprudencia") {
    promptPortada.value = "";
    return;
  }
  const valor = (id) => formulario.elements.namedItem(id)?.value?.trim() || "";
  const etiquetas = valor("etiquetas").split(/[,\n]/).map((item) => item.trim()).filter(Boolean).join(", ");
  const contexto = [
    `Tema del caso: ${valor("titulo")}`,
    `Resumen: ${valor("resumen")}`,
    `Órgano jurisdiccional: ${valor("organo")}`,
    `Problema jurídico: ${valor("problemaJuridico")}`,
    `Criterio de la decisión: ${valor("criterio")}`,
    `Materias: ${Array.from(formulario.querySelectorAll("[name='materias']:checked"), (item) => item.value).join(", ")}`,
    `Palabras clave: ${etiquetas}`,
  ].filter((linea) => !linea.endsWith(": ")).join("\n");

  promptPortada.value = [
    "Crea una portada editorial fotorealista, atractiva y visualmente clara para un artículo de análisis de jurisprudencia peruana.",
    contexto,
    "Representa el tema central con una escena visual pertinente, respetuosa y sin afirmar hechos que no aparecen en el contexto. Evita mostrar personas identificables, nombres, expedientes, documentos legibles, logos, escudos o sellos oficiales.",
    "Composición horizontal 1200 × 630 píxeles, estilo fotográfico editorial contemporáneo, iluminación cuidada, contraste marcado y un punto focal fácil de reconocer en una miniatura. Sin texto, letras, marcas de agua, balanzas ni mazos genéricos. No inventes detalles del caso.",
  ].filter(Boolean).join("\n\n");
}

function actualizarCamposEspecificos() {
  const publicacion = tiposPublicacion.find((item) => item.id === tipo.value);
  camposEspecificos.replaceChildren(...publicacion.campos.map(crearCampo));
  document.querySelector("#descripcion-tipo").textContent = publicacion.descripcion;
  document.querySelector("#titulo-campos").textContent = `Información para ${publicacion.nombre}`;
  const esJurisprudencia = publicacion.id === "jurisprudencia";
  portadaIa.hidden = !esJurisprudencia;
  avisoPortada.hidden = !esJurisprudencia;
  imagenPortada.required = esJurisprudencia;
  textoAlternativo.required = esJurisprudencia;
  actualizarCamposComunes();
  actualizarPromptPortada();
}

tipo.addEventListener("change", actualizarCamposEspecificos);
actualizarCamposEspecificos();
formulario.addEventListener("input", actualizarPromptPortada);
formulario.addEventListener("change", actualizarPromptPortada);

document.querySelector("#copiar-prompt").addEventListener("click", async () => {
  try {
    await navigator.clipboard.writeText(promptPortada.value);
    mostrarMensaje(mensajePublicacion, "Prompt copiado. Pégalo en tu herramienta de generación de imágenes.");
  } catch {
    promptPortada.focus();
    promptPortada.select();
    mostrarMensaje(mensajePublicacion, "No se pudo copiar automáticamente. Selecciona y copia el texto del prompt.", true);
  }
});

imagenPortada.addEventListener("change", () => {
  const archivo = imagenPortada.files[0];
  if (urlVistaPrevia) URL.revokeObjectURL(urlVistaPrevia);
  urlVistaPrevia = "";
  vistaPreviaPortada.hidden = true;
  if (!archivo) return;
  if (!["image/jpeg", "image/png", "image/webp"].includes(archivo.type) || archivo.size > 4 * 1024 * 1024) {
    imagenPortada.value = "";
    mostrarMensaje(mensajePublicacion, "Elige una imagen JPG, PNG o WebP que no supere 4 MB.", true);
    return;
  }
  urlVistaPrevia = URL.createObjectURL(archivo);
  vistaPreviaPortada.src = urlVistaPrevia;
  vistaPreviaPortada.alt = textoAlternativo.value || "Vista previa de la portada";
  vistaPreviaPortada.hidden = false;
  if (!textoAlternativo.value.trim()) {
    const titulo = formulario.elements.namedItem("titulo").value.trim();
    textoAlternativo.value = titulo ? `Imagen de portada para: ${titulo}` : "";
  }
});

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
    if (urlVistaPrevia) URL.revokeObjectURL(urlVistaPrevia);
    urlVistaPrevia = "";
    vistaPreviaPortada.removeAttribute("src");
    vistaPreviaPortada.hidden = true;
    mostrarMensaje(mensajePublicacion, "");
  }, 0);
});

formulario.addEventListener("submit", async (evento) => {
  evento.preventDefault();
  if (!formulario.reportValidity()) return;

  const seleccion = tiposPublicacion.find((item) => item.id === tipo.value);
  const esJurisprudencia = seleccion.id === "jurisprudencia";
  const formData = new FormData(formulario);
  const datos = Object.fromEntries(formData.entries());
  const materiasSeleccionadas = esJurisprudencia
    ? Array.from(formulario.querySelectorAll("[name='materias']:checked"), (item) => item.value)
    : [String(datos.materia || "")];
  if (!materiasSeleccionadas.length) {
    mostrarMensaje(mensajePublicacion, "Selecciona al menos una materia para la decisión.", true);
    return;
  }
  const details = Object.fromEntries(
    seleccion.campos.map((campo) => [campo.id, String(datos[campo.id] || "").trim()]),
  );
  if (esJurisprudencia) {
    details.etiquetas = [...new Set(
      String(datos.etiquetas || "").split(/[,\n]/).map((item) => item.trim()).filter(Boolean),
    )];
  }
  const publicacion = {
    type: seleccion.id,
    title: String(datos.titulo).trim(),
    summary: String(datos.resumen).trim(),
    author: String(datos.autor).trim(),
    publishedAt: String(datos.fechaPublicacionPortal),
    materias: materiasSeleccionadas,
    sourceName: esJurisprudencia ? "" : String(datos.fuentePrincipal || "").trim(),
    sourceUrl: esJurisprudencia ? "" : String(datos.enlacePrincipal || "").trim(),
    details,
    ...(esJurisprudencia ? { coverAlt: String(datos.coverAlt || "").trim() } : {}),
  };
  const envio = new FormData();
  envio.append("publication", JSON.stringify(publicacion));
  if (esJurisprudencia) envio.append("coverImage", imagenPortada.files[0]);

  botonPublicar.disabled = true;
  mostrarMensaje(mensajePublicacion, "Validando y guardando la publicación…");
  try {
    const respuesta = await fetch("/publish", {
      method: "POST",
      credentials: "same-origin",
      body: envio,
    });
    const resultado = await respuesta.json();
    if (!respuesta.ok) throw new Error(resultado.error || "No se pudo guardar la publicación.");

    formulario.reset();
    tipo.value = tiposPublicacion[0].id;
    actualizarCamposEspecificos();
    if (urlVistaPrevia) URL.revokeObjectURL(urlVistaPrevia);
    urlVistaPrevia = "";
    vistaPreviaPortada.removeAttribute("src");
    vistaPreviaPortada.hidden = true;
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
