import L from "../../lib/geoman";

const cache = new Map();

// Marcador circular del color de la categoría; el estado cambia el anillo exterior
export function unitIcon(category, status, highlighted = false) {
  const color = /^#[0-9a-f]{6}$/i.test(category?.color || "") ? category.color : "#9DB8B5";
  const key = `${color}|${status}|${highlighted}`;

  if (!cache.has(key)) {
    cache.set(key, L.divIcon({
      className: "mk-wrap",
      html: `<div class="mk mk--${status} ${highlighted ? "mk--hl" : ""}" style="--c:${color}"><span class="mk__core"></span></div>`,
      iconSize: [26, 26],
      iconAnchor: [13, 13],
      popupAnchor: [0, -12]
    }));
  }

  return cache.get(key);
}

// punto temporal donde se registrará la nueva ubicación
export const draftIcon = L.divIcon({
  className: "mk-wrap",
  html: `<div class="mk mk--draft"><span class="mk__core"></span></div>`,
  iconSize: [26, 26],
  iconAnchor: [13, 13]
});

// punto de partida de la búsqueda por cercanía
export const originIcon = L.divIcon({
  className: "mk-wrap",
  html: `<div class="origin"><span></span></div>`,
  iconSize: [22, 22],
  iconAnchor: [11, 11]
});
