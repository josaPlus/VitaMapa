export const STATUS = {
  disponible: { label: "Disponible", tone: "ok" },
  saturada: { label: "Saturada", tone: "warn" },
  cerrada: { label: "Cerrada", tone: "off" }
};

export const RISK = {
  bajo: { label: "Riesgo bajo", color: "#4ADE9B" },
  medio: { label: "Riesgo medio", color: "#FFB547" },
  alto: { label: "Riesgo alto", color: "#FF6B7A" }
};

export const SHIFTS = {
  matutino: "Matutino",
  vespertino: "Vespertino",
  nocturno: "Nocturno",
  fin_de_semana: "Fin de semana"
};

export const AREAS = {
  consulta: "Consulta",
  urgencias: "Urgencias",
  diagnostico: "Diagnóstico",
  quirurgica: "Quirúrgica"
};

const dateFormatter = new Intl.DateTimeFormat("es-MX", {
  day: "2-digit", month: "short", year: "2-digit", hour: "2-digit", minute: "2-digit", hour12: false
});

export function formatDate(value) {
  return value ? dateFormatter.format(new Date(value)) : "—";
}

export function formatDistance(meters) {
  return meters < 1000 ? `${meters} m` : `${(meters / 1000).toFixed(1)} km`;
}

export function formatCoord(value) {
  return Number(value).toFixed(5);
}
