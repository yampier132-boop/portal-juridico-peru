import { tiposPublicacion } from "./admin/schema.js";

const article = document.querySelector("#contenido");
const themeButton = document.querySelector("#tema");

function formatDate(value) {
  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.valueOf())
    ? value
    : new Intl.DateTimeFormat("es-PE", { dateStyle: "long" }).format(date);
}

function appendValue(container, value, isUrl = false) {
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

function displayPublication(publication) {
  const type = tiposPublicacion.find((item) => item.id === publication.type);
  if (!type) throw new Error("El tipo de publicación no está reconocido.");

  document.title = `${publication.title} | De Ley`;
  article.replaceChildren();

  const category = document.createElement("p");
  category.className = "etiqueta";
  category.textContent = type.nombre;

  const title = document.createElement("h1");
  title.textContent = publication.title;

  const summary = document.createElement("p");
  summary.className = "resumen";
  summary.textContent = publication.summary;

  const metadata = document.createElement("div");
  metadata.className = "meta";
  [publication.author, publication.materia, formatDate(publication.publishedAt)].forEach((value) => {
    const item = document.createElement("span");
    item.textContent = value;
    metadata.append(item);
  });

  article.append(category, title, summary, metadata);
  type.campos.forEach((field) => {
    const value = publication.details?.[field.id];
    if (!value) return;
    const section = document.createElement("section");
    section.className = "detalle";
    const heading = document.createElement("h2");
    heading.textContent = field.etiqueta;
    section.append(heading);
    appendValue(section, value, field.tipo === "url");
    article.append(section);
  });

  if (publication.sourceUrl) {
    const source = document.createElement("section");
    source.className = "detalle";
    const heading = document.createElement("h2");
    heading.textContent = publication.sourceName || "Fuente principal";
    source.append(heading);
    appendValue(source, publication.sourceUrl, true);
    article.append(source);
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
