const article = document.querySelector("#contenido");
const themeButton = document.querySelector("#tema");

const etiquetasCampos = {
  organo: "Órgano jurisdiccional",
  expediente: "Número de expediente o resolución",
  instancia: "Instancia",
  firmeza: "Estado de firmeza",
  fechaDecision: "Fecha de la decisión",
  problemaJuridico: "Problema jurídico",
  criterio: "Criterio o decisión principal",
  analisis: "Análisis",
  fuenteOficial: "Enlace a la decisión o fuente oficial",
  fuenteSecundaria: "Enlace a una fuente secundaria",
  etiquetas: "Etiquetas o palabras clave",
  referenciasApa: "Referencias bibliográficas (formato APA 7)",
  fechaHecho: "Fecha del hecho",
  queOcurrio: "¿Qué ocurrió?",
  relevancia: "¿Por qué es relevante?",
  fuentes: "Fuentes y enlaces",
  identificacion: "Número y nombre completo de la norma",
  fechaPublicacionNorma: "Fecha de publicación de la norma",
  fechaVigencia: "Fecha de entrada en vigencia",
  cambios: "Cambios principales",
  implicancias: "A quiénes y cómo podría afectar",
  finalidad: "¿Para qué sirve este modelo?",
  destinatario: "¿A quién está dirigido?",
  cuandoUsar: "¿Cuándo podría utilizarse?",
  requisitos: "Información o requisitos que deben revisarse",
  contenidoModelo: "Contenido del modelo",
  advertencias: "Advertencias para su adaptación",
  fuente: "Fuente o referencia",
  pasos: "Pasos del procedimiento",
  plazos: "Plazos importantes",
  dondeRealizar: "¿Dónde o ante quién se realiza?",
  pregunta: "Pregunta de investigación",
  metodologia: "Metodología",
  hallazgos: "Hallazgos o argumento central",
  limitaciones: "Alcances y limitaciones",
  bibliografia: "Bibliografía y fuentes consultadas",
  tesis: "Tesis o postura principal",
  argumentos: "Argumentos y análisis",
  referencias: "Fuentes y referencias",
  declaracion: "Intereses o vínculos que conviene declarar",
};

const opcionesCampos = {
  firmeza: {
    firme: "Sí, es firme",
    "no-firme": "No, puede ser impugnada",
    "no-determinado": "No se ha podido confirmar",
  },
};

const nombresMeses = [
  "enero", "febrero", "marzo", "abril", "mayo", "junio",
  "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
];

function formatDate(value) {
  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.valueOf())
    ? value
    : `${date.getDate()} de ${nombresMeses[date.getMonth()]} de ${date.getFullYear()}`;
}

function appendValue(container, value, isUrl = false) {
  if (Array.isArray(value)) {
    const list = document.createElement("ul");
    value.forEach((item) => {
      const entry = document.createElement("li");
      entry.textContent = item;
      list.append(entry);
    });
    container.append(list);
    return;
  }
  if (isUrl) {
    try {
      const url = new URL(value);
      if (url.protocol === "https:" && !url.username && !url.password) {
        const link = document.createElement("a");
        link.href = url.toString();
        link.target = "_blank";
        link.rel = "noopener noreferrer";
        link.textContent = value;
        container.append(link);
        return;
      }
    } catch {
      // Display invalid links as plain text rather than making them clickable.
    }
  }
  const paragraph = document.createElement("p");
  paragraph.textContent = value;
  container.append(paragraph);
}

function crearDetalle(titulo, valor, opciones = {}) {
  if (valor === undefined || valor === null || valor === "") return null;
  const section = document.createElement("section");
  section.className = `detalle${opciones.texto ? " texto-articulo" : ""}`;
  if (opciones.id) section.id = opciones.id;
  const heading = document.createElement("h2");
  heading.textContent = titulo;
  section.append(heading);
  appendValue(section, valor, opciones.url || false);
  return section;
}

function crearFicha(titulo, valor, fecha = false) {
  if (!valor) return null;
  const item = document.createElement("div");
  const label = document.createElement("dt");
  label.textContent = titulo;
  const content = document.createElement("dd");
  content.textContent = fecha ? formatDate(valor) : valor;
  item.append(label, content);
  return item;
}

function crearEtiqueta(tag) {
  const link = document.createElement("a");
  link.className = "etiqueta-palabra";
  link.href = `./?buscar=${encodeURIComponent(tag)}#buscar-publicaciones`;
  link.textContent = tag;
  return link;
}

function displayPublication(publication) {
  document.title = `${publication.title} | De Ley`;
  const description = document.querySelector('meta[name="description"]');
  if (description) description.content = publication.summary;
  if (publication.coverUrl) {
    let imageMeta = document.querySelector('meta[property="og:image"]');
    if (!imageMeta) {
      imageMeta = document.createElement("meta");
      imageMeta.setAttribute("property", "og:image");
      document.head.append(imageMeta);
    }
    imageMeta.content = publication.coverUrl;
  }
  article.replaceChildren();

  const category = document.createElement("p");
  category.className = "etiqueta";
  category.textContent = publication.typeName || publication.type || "Publicación";

  const title = document.createElement("h1");
  title.textContent = publication.title;

  const summary = document.createElement("p");
  summary.className = "resumen";
  summary.textContent = publication.summary;

  const metadata = document.createElement("div");
  metadata.className = "linea-autor";
  const materiasPublicacion = Array.isArray(publication.materias)
    ? publication.materias.join(", ")
    : publication.materia;
  metadata.textContent = `Por ${publication.author} · ${materiasPublicacion} · ${formatDate(publication.publishedAt)}`;

  article.append(category, title, summary, metadata);
  if (publication.coverUrl) {
    const cover = document.createElement("img");
    cover.className = "portada-articulo";
    cover.src = publication.coverUrl;
    cover.alt = publication.coverAlt || "";
    article.append(cover);
  }
  if (publication.type === "jurisprudencia") {
    const tags = publication.details?.etiquetas;
    if (Array.isArray(tags) && tags.length) {
      const tagNavigation = document.createElement("nav");
      tagNavigation.className = "etiquetas";
      tagNavigation.setAttribute("aria-label", "Etiquetas de la publicación");
      tags.forEach((tag) => tagNavigation.append(crearEtiqueta(tag)));
      article.append(tagNavigation);
    }

    const details = publication.details || {};
    const bodyFields = [
      ["problemaJuridico", "Problema jurídico", "problema-juridico"],
      ["criterio", "Criterio", "criterio"],
      ["analisis", "Análisis", "analisis"],
      ["referenciasApa", "Referencias", "referencias"],
    ].map(([id, label, anchor]) => ({ id, label, anchor, value: details[id] }))
      .filter((field) => field.value);
    const layout = document.createElement("div");
    layout.className = "estructura-articulo";
    const aside = document.createElement("aside");
    aside.className = "barra-lateral";
    aside.setAttribute("aria-label", "Ficha de la decisión");
    const fixed = document.createElement("div");
    fixed.className = "ficha-fija";
    const factCard = document.createElement("section");
    factCard.className = "ficha-decision";
    const factHeading = document.createElement("h2");
    factHeading.textContent = "Datos de la decisión";
    const factList = document.createElement("dl");
    const firmness = opcionesCampos.firmeza[details.firmeza] || details.firmeza;
    [
      crearFicha("Órgano", details.organo),
      crearFicha("Expediente", details.expediente),
      crearFicha("Instancia", details.instancia),
      crearFicha("Firmeza", firmness),
      crearFicha("Fecha de la decisión", details.fechaDecision, true),
    ].filter(Boolean).forEach((fact) => factList.append(fact));
    factCard.append(factHeading, factList);
    fixed.append(factCard);

    if (bodyFields.length >= 3) {
      const table = document.createElement("nav");
      table.className = "tabla-contenido";
      table.setAttribute("aria-label", "Tabla de contenido");
      const tableHeading = document.createElement("h2");
      tableHeading.textContent = "En esta página";
      const list = document.createElement("ol");
      bodyFields.forEach((field) => {
        const item = document.createElement("li");
        const link = document.createElement("a");
        link.href = `#${field.anchor}`;
        link.textContent = field.label;
        item.append(link);
        list.append(item);
      });
      table.append(tableHeading, list);
      fixed.append(table);
    }
    aside.append(fixed);

    const body = document.createElement("div");
    body.className = "cuerpo-articulo";
    bodyFields.forEach((field) => {
      body.append(crearDetalle(field.label, field.value, { id: field.anchor, texto: true }));
    });
    if (details.fuenteOficial || details.fuenteSecundaria) {
      const sources = document.createElement("details");
      sources.className = "fuentes-articulo";
      const summaryElement = document.createElement("summary");
      summaryElement.textContent = "Fuentes de consulta";
      sources.append(summaryElement);
      [["Fuente oficial", details.fuenteOficial], ["Fuente secundaria", details.fuenteSecundaria]]
        .filter(([, url]) => url)
        .forEach(([label, url]) => {
          const paragraph = document.createElement("p");
          const strong = document.createElement("strong");
          strong.textContent = `${label}: `;
          paragraph.append(strong);
          appendValue(paragraph, url, true);
          sources.append(paragraph);
        });
      body.append(sources);
    }
    layout.append(aside, body);
    article.append(layout);
  } else {
    Object.entries(publication.details || {}).forEach(([id, value]) => {
      if (!value) return;
      const label = etiquetasCampos[id] || id.replace(/([A-Z])/g, " $1").replace(/^./, (first) => first.toUpperCase());
      const displayedValue = opcionesCampos[id]?.[value] || (id.toLowerCase().includes("fecha") ? formatDate(value) : value);
      const section = crearDetalle(label, displayedValue, { url: id.toLowerCase().includes("url") || id.toLowerCase().includes("fuente") });
      if (section) article.append(section);
    });

    if (publication.sourceUrl) {
      const source = crearDetalle(publication.sourceName || "Fuente principal", publication.sourceUrl, { url: true });
      if (source) article.append(source);
    }
  }

  const notice = document.createElement("p");
  notice.className = "nota";
  notice.textContent = "Este contenido es informativo. Verifica las normas y fuentes vigentes y evalúa cada caso concreto con el criterio profesional correspondiente.";
  article.append(notice);
}

async function loadPublication() {
  const id = new URLSearchParams(window.location.search).get("id");
  if (!id) throw new Error("No se indicó qué publicación mostrar.");
  const response = await fetch("contenido/publicaciones.json", { cache: "no-cache" });
  if (!response.ok) throw new Error(`No se pudieron cargar las publicaciones (HTTP ${response.status}).`);
  const publications = await response.json();
  if (!Array.isArray(publications)) throw new Error("El archivo de publicaciones no tiene el formato esperado.");
  const publication = publications.find((item) => item.id === id);
  if (!publication) throw new Error("No encontramos esa publicación. Es posible que se haya retirado o que el enlace no sea correcto.");
  displayPublication(publication);
}

function updateThemeButton() {
  const isLight = document.documentElement.dataset.tema === "claro";
  themeButton.textContent = isLight ? "Modo oscuro" : "Modo claro";
  themeButton.setAttribute("aria-pressed", String(isLight));
}

updateThemeButton();
themeButton.addEventListener("click", () => {
  const theme = document.documentElement.dataset.tema === "claro" ? "oscuro" : "claro";
  document.documentElement.dataset.tema = theme;
  localStorage.setItem("de-ley-tema", theme);
  updateThemeButton();
});

loadPublication().catch((error) => {
  const message = document.createElement("p");
  message.className = "estado";
  message.textContent = error.message;
  article.replaceChildren(message);
});
