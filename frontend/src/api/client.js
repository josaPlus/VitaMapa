// Cliente HTTP: agrega el token de sesión y convierte los errores del backend en ApiError

const API_URL = (import.meta.env.VITE_API_URL || "http://localhost:3000/api").replace(/\/$/, "");

const SESSION_KEY = "vitamapa.session";

let unauthorizedHandler = null;

export class ApiError extends Error {
  constructor(status, message, details = null) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

export function readSession() {
  try {
    return JSON.parse(localStorage.getItem(SESSION_KEY)) || null;
  } catch {
    return null;
  }
}

export function saveSession(session) {
  try {
    if (session) localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    else localStorage.removeItem(SESSION_KEY);
  } catch {
    /* almacenamiento no disponible: la sesión dura lo que dure la pestaña */
  }
}

// el AuthContext registra aquí qué hacer cuando el backend responde 401
export function onUnauthorized(handler) {
  unauthorizedHandler = handler;
}

async function request(path, { method = "GET", body, query } = {}) {
  const url = new URL(API_URL + path, window.location.origin);

  if (query) {
    Object.entries(query).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") url.searchParams.set(key, value);
    });
  }

  const session = readSession();
  const headers = { "Content-Type": "application/json" };

  if (session?.token) headers.Authorization = `Bearer ${session.token}`;

  let response;

  try {
    response = await fetch(url, { method, headers, body: body ? JSON.stringify(body) : undefined });
  } catch {
    throw new ApiError(0, "No se pudo conectar con el servidor. Revisa tu conexión.");
  }

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    if (response.status === 401 && session?.token && unauthorizedHandler) {
      unauthorizedHandler(data?.message);
    }
    throw new ApiError(response.status, data?.message || "Ocurrió un error inesperado", data?.details);
  }

  return data;
}

export const api = {
  get: (path, query) => request(path, { query }),
  post: (path, body) => request(path, { method: "POST", body }),
  patch: (path, body) => request(path, { method: "PATCH", body }),
  delete: (path) => request(path, { method: "DELETE" })
};
