import { camposComunes, materias, tiposPublicacion } from "../admin/schema.js";

const SESSION_COOKIE = "deley_admin_session";
const STATE_COOKIE = "deley_oauth_state";
const SESSION_LIFETIME = 8 * 60 * 60;
const PUBLICATIONS_PATH = "contenido/publicaciones.json";
const MAX_REQUEST_BYTES = 50_000;

function jsonResponse(data, status = 200, headers = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
      ...headers,
    },
  });
}

function cookieValue(request, name) {
  const cookies = request.headers.get("Cookie") || "";
  const pair = cookies.split(";").map((item) => item.trim()).find((item) => item.startsWith(`${name}=`));
  return pair ? pair.slice(name.length + 1) : "";
}

function setCookie(name, value, maxAge) {
  return `${name}=${encodeURIComponent(value)}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${maxAge}`;
}

function clearCookie(name) {
  return `${name}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`;
}

function randomToken(byteLength = 32) {
  const bytes = crypto.getRandomValues(new Uint8Array(byteLength));
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

async function hashToken(token) {
  const bytes = new TextEncoder().encode(token);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

function redirect(request, path, cookie = null) {
  const headers = new Headers({ Location: new URL(path, request.url).toString(), "Cache-Control": "no-store" });
  if (cookie) headers.append("Set-Cookie", cookie);
  return new Response(null, { status: 302, headers });
}

function requireSameOrigin(request) {
  return request.headers.get("Origin") === new URL(request.url).origin;
}

async function getSession(request, env) {
  const token = cookieValue(request, SESSION_COOKIE);
  if (!token) return null;
  const key = `session:${await hashToken(token)}`;
  const value = await env.AUTH_KV.get(key, "json");
  return value ? { ...value, key } : null;
}

async function authenticate(request, env) {
  if (!env.ADMIN_GITHUB_LOGIN) {
    return { response: jsonResponse({ error: "Falta configurar la cuenta de administración." }, 503) };
  }
  const session = await getSession(request, env);
  if (!session) return { response: jsonResponse({ error: "Inicia sesión con la cuenta autorizada." }, 401) };
  if (String(session.login).toLowerCase() !== String(env.ADMIN_GITHUB_LOGIN).toLowerCase()) {
    await env.AUTH_KV.delete(session.key);
    return { response: jsonResponse({ error: "Esta cuenta ya no tiene permiso para publicar." }, 403) };
  }
  return { session };
}

function dateIsValid(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(parsed.valueOf()) && parsed.toISOString().slice(0, 10) === value;
}

function isHttpsUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" && !url.username && !url.password;
  } catch {
    return false;
  }
}

function validateText(value, label, required, maxLength) {
  if (typeof value !== "string") return `${label} debe ser texto.`;
  if (value.length > maxLength) return `${label} supera el máximo de ${maxLength} caracteres.`;
  if (required && !value.trim()) return `${label} es obligatorio.`;
  return "";
}

function validatePublication(input) {
  if (!input || typeof input !== "object" || Array.isArray(input)) return { error: "El contenido enviado no es válido." };
  const type = tiposPublicacion.find((item) => item.id === input.type);
  if (!type) return { error: "Selecciona un tipo de publicación válido." };

  const commonValues = {
    titulo: input.title,
    resumen: input.summary,
    autor: input.author,
    fechaPublicacionPortal: input.publishedAt,
    materia: input.materia,
    fuentePrincipal: input.sourceName,
    enlacePrincipal: input.sourceUrl,
  };
  for (const field of camposComunes) {
    const value = commonValues[field.id];
    const message = validateText(value, field.etiqueta, field.requerido, field.maximo || (field.tipo === "textarea" ? 5000 : 500));
    if (message) return { error: message };
  }

  if (!materiaValida(input.materia)) return { error: "Selecciona una materia válida." };
  if (!dateIsValid(input.publishedAt)) return { error: "La fecha de publicación no es válida." };
  if (input.sourceUrl && !isHttpsUrl(input.sourceUrl)) return { error: "El enlace principal debe usar una dirección HTTPS válida." };

  if (!input.details || typeof input.details !== "object" || Array.isArray(input.details)) {
    return { error: "Completa los campos específicos del tipo de publicación." };
  }
  const allowedFields = new Set(type.campos.map((field) => field.id));
  if (Object.keys(input.details).some((field) => !allowedFields.has(field))) {
    return { error: "El formulario contiene campos que no corresponden a esta sección." };
  }

  for (const field of type.campos) {
    const value = input.details[field.id];
    const message = validateText(value, field.etiqueta, field.requerido, field.tipo === "textarea" ? 10_000 : 1000);
    if (message) return { error: message };
    if (field.tipo === "date" && value && !dateIsValid(value)) return { error: `${field.etiqueta} no es una fecha válida.` };
    if (field.tipo === "url" && value && !isHttpsUrl(value)) return { error: `${field.etiqueta} debe ser un enlace HTTPS válido.` };
  }

  const details = Object.fromEntries(
    type.campos.map((field) => [field.id, input.details[field.id].trim()]),
  );
  const slugBase = input.title
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);

  return {
    publication: {
      id: crypto.randomUUID(),
      type: type.id,
      typeName: type.nombre,
      slug: slugBase || type.id,
      title: input.title.trim(),
      summary: input.summary.trim(),
      author: input.author.trim(),
      publishedAt: input.publishedAt,
      materia: input.materia,
      sourceName: input.sourceName.trim(),
      sourceUrl: input.sourceUrl.trim(),
      details,
      createdAt: new Date().toISOString(),
    },
  };
}

function materiaValida(value) {
  return typeof value === "string" && materias.includes(value);
}

function decodeBase64Utf8(value) {
  const binary = atob(value.replace(/\s/g, ""));
  const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

function encodeBase64Utf8(value) {
  const bytes = new TextEncoder().encode(value);
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

function githubHeaders(env) {
  return {
    Accept: "application/vnd.github+json",
    Authorization: `Bearer ${env.GITHUB_CONTENTS_TOKEN}`,
    "X-GitHub-Api-Version": "2022-11-28",
    "User-Agent": "De-Ley-Admin",
  };
}

async function readPublications(env) {
  const url = new URL(
    `https://api.github.com/repos/${encodeURIComponent(env.GITHUB_OWNER)}/${encodeURIComponent(env.GITHUB_REPO)}/contents/${PUBLICATIONS_PATH}`,
  );
  url.searchParams.set("ref", env.GITHUB_BRANCH || "main");
  const response = await fetch(url, { headers: githubHeaders(env) });
  if (response.status === 404) return { publications: [], sha: null };
  if (!response.ok) throw new Error(`GitHub no pudo leer el archivo de publicaciones (HTTP ${response.status}).`);
  const file = await response.json();
  return { publications: JSON.parse(decodeBase64Utf8(file.content)), sha: file.sha };
}

async function savePublication(env, publication) {
  const { publications, sha } = await readPublications(env);
  if (!Array.isArray(publications)) throw new Error("El archivo de publicaciones no tiene el formato esperado.");
  const updated = [publication, ...publications];
  const url = `https://api.github.com/repos/${encodeURIComponent(env.GITHUB_OWNER)}/${encodeURIComponent(env.GITHUB_REPO)}/contents/${PUBLICATIONS_PATH}`;
  const payload = {
    message: `Publicar: ${publication.title.replace(/[\r\n]/g, " ").slice(0, 70)}`,
    content: encodeBase64Utf8(`${JSON.stringify(updated, null, 2)}\n`),
    branch: env.GITHUB_BRANCH || "main",
    ...(sha ? { sha } : {}),
  };
  const response = await fetch(url, {
    method: "PUT",
    headers: { ...githubHeaders(env), "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (response.status === 409 || response.status === 422) {
    throw new Error("El contenido del repositorio cambió mientras publicabas. Recarga el panel y vuelve a intentarlo.");
  }
  if (!response.ok) throw new Error(`GitHub no pudo guardar la publicación (HTTP ${response.status}).`);
}

async function startLogin(request, env) {
  if (!env.GITHUB_CLIENT_ID || !env.GITHUB_CLIENT_SECRET || !env.ADMIN_GITHUB_LOGIN) {
    return new Response("La autenticación todavía no está configurada.", { status: 503 });
  }
  const state = randomToken(24);
  await env.AUTH_KV.put(`oauth-state:${state}`, "pending", { expirationTtl: 600 });
  const callback = new URL("/auth/callback", request.url).toString();
  const github = new URL("https://github.com/login/oauth/authorize");
  github.searchParams.set("client_id", env.GITHUB_CLIENT_ID);
  github.searchParams.set("redirect_uri", callback);
  github.searchParams.set("scope", "read:user");
  github.searchParams.set("state", state);
  const headers = new Headers({ Location: github.toString(), "Cache-Control": "no-store" });
  headers.append("Set-Cookie", setCookie(STATE_COOKIE, state, 600));
  return new Response(null, { status: 302, headers });
}

async function finishLogin(request, env) {
  const url = new URL(request.url);
  const state = url.searchParams.get("state") || "";
  const code = url.searchParams.get("code") || "";
  const cookieState = cookieValue(request, STATE_COOKIE);
  const headers = new Headers({ "Cache-Control": "no-store" });
  headers.append("Set-Cookie", clearCookie(STATE_COOKIE));

  if (!state || state !== cookieState) {
    return new Response("No se pudo validar el inicio de sesión. Regresa al panel e inténtalo nuevamente.", { status: 400, headers });
  }
  const stateKey = `oauth-state:${state}`;
  const storedState = await env.AUTH_KV.get(stateKey);
  await env.AUTH_KV.delete(stateKey);
  if (storedState !== "pending") {
    return new Response("La solicitud de inicio de sesión expiró. Inténtalo nuevamente.", { status: 400, headers });
  }
  if (url.searchParams.has("error")) {
    return redirect(request, "/?auth=cancelled", clearCookie(STATE_COOKIE));
  }
  if (!code) {
    return new Response("GitHub no devolvió un código de autorización válido.", { status: 400, headers });
  }

  const tokenResponse = await fetch("https://github.com/login/oauth/access_token", {
    method: "POST",
    headers: { Accept: "application/json", "Content-Type": "application/json" },
    body: JSON.stringify({
      client_id: env.GITHUB_CLIENT_ID,
      client_secret: env.GITHUB_CLIENT_SECRET,
      code,
      redirect_uri: new URL("/auth/callback", request.url).toString(),
    }),
  });
  if (!tokenResponse.ok) return new Response("GitHub no pudo completar la autenticación.", { status: 502, headers });
  const tokenData = await tokenResponse.json();
  if (!tokenData.access_token) return new Response("GitHub no autorizó el inicio de sesión.", { status: 401, headers });

  const userResponse = await fetch("https://api.github.com/user", {
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${tokenData.access_token}`,
      "X-GitHub-Api-Version": "2022-11-28",
      "User-Agent": "De-Ley-Admin",
    },
  });
  if (!userResponse.ok) return new Response("No se pudo comprobar la cuenta de GitHub.", { status: 502, headers });
  const user = await userResponse.json();
  if (String(user.login).toLowerCase() !== String(env.ADMIN_GITHUB_LOGIN).toLowerCase()) {
    return redirect(request, "/?auth=unauthorized", clearCookie(STATE_COOKIE));
  }

  const sessionToken = randomToken();
  await env.AUTH_KV.put(`session:${await hashToken(sessionToken)}`, JSON.stringify({ login: user.login }), {
    expirationTtl: SESSION_LIFETIME,
  });
  headers.set("Location", new URL("/", request.url).toString());
  headers.append("Set-Cookie", setCookie(SESSION_COOKIE, sessionToken, SESSION_LIFETIME));
  return new Response(null, { status: 302, headers });
}

async function handleApi(request, env, path) {
  if (path === "/auth/login" && request.method === "GET") return startLogin(request, env);
  if (path === "/auth/callback" && request.method === "GET") return finishLogin(request, env);

  if (path === "/auth/session" && request.method === "GET") {
    const session = await getSession(request, env);
    const configured = Boolean(
      env.GITHUB_CLIENT_ID &&
      env.GITHUB_CLIENT_SECRET &&
      env.GITHUB_CONTENTS_TOKEN &&
      env.GITHUB_OWNER &&
      env.GITHUB_REPO &&
      env.ADMIN_GITHUB_LOGIN,
    );
    if (!configured) return jsonResponse({ authenticated: false, configured: false });
    if (!session) return jsonResponse({ authenticated: false, configured: true });
    if (String(session.login).toLowerCase() !== String(env.ADMIN_GITHUB_LOGIN).toLowerCase()) {
      await env.AUTH_KV.delete(session.key);
      return jsonResponse({ authenticated: false, configured: true });
    }
    return jsonResponse({ authenticated: true, login: session.login });
  }

  if (path === "/auth/logout" && request.method === "POST") {
    if (!requireSameOrigin(request)) return jsonResponse({ error: "Origen de solicitud no permitido." }, 403);
    const session = await getSession(request, env);
    if (session) await env.AUTH_KV.delete(session.key);
    return jsonResponse({ ok: true }, 200, { "Set-Cookie": clearCookie(SESSION_COOKIE) });
  }

  if (path === "/publish" && request.method === "POST") {
    if (!requireSameOrigin(request)) return jsonResponse({ error: "Origen de solicitud no permitido." }, 403);
    const authentication = await authenticate(request, env);
    if (authentication.response) return authentication.response;
    if (!env.GITHUB_CONTENTS_TOKEN || !env.GITHUB_OWNER || !env.GITHUB_REPO) {
      return jsonResponse({ error: "La publicación todavía no está configurada." }, 503);
    }
    const contentLength = Number(request.headers.get("Content-Length") || 0);
    if (contentLength > MAX_REQUEST_BYTES) return jsonResponse({ error: "El contenido es demasiado largo." }, 413);

    let body;
    try {
      body = await request.text();
    } catch {
      return jsonResponse({ error: "No se pudo leer el formulario. Revisa los campos e inténtalo nuevamente." }, 400);
    }
    if (new TextEncoder().encode(body).byteLength > MAX_REQUEST_BYTES) {
      return jsonResponse({ error: "El contenido es demasiado largo." }, 413);
    }

    let input;
    try {
      input = JSON.parse(body);
    } catch {
      return jsonResponse({ error: "El formulario no contiene datos JSON válidos." }, 400);
    }
    const validation = validatePublication(input);
    if (validation.error) return jsonResponse({ error: validation.error }, 400);

    try {
      await savePublication(env, validation.publication);
    } catch (error) {
      return jsonResponse({ error: error.message || "No se pudo guardar la publicación." }, 502);
    }
    return jsonResponse({ ok: true, id: validation.publication.id });
  }

  return null;
}

function secureAssetResponse(response) {
  const headers = new Headers(response.headers);
  headers.set("X-Content-Type-Options", "nosniff");
  headers.set("X-Frame-Options", "DENY");
  headers.set("Referrer-Policy", "no-referrer");
  headers.set("Content-Security-Policy", "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; connect-src 'self'; form-action 'self'; base-uri 'none'; frame-ancestors 'none'; object-src 'none'");
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const apiResponse = await handleApi(request, env, url.pathname);
    if (apiResponse) return apiResponse;
    return secureAssetResponse(await env.ASSETS.fetch(request));
  },
};
