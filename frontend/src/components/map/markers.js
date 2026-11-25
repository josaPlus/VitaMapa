import L from "../../lib/geoman";

const cache = new Map();

function escapeHtml(value = "") {
  return String(value).replace(/[&<>"']/g, (char) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  })[char]);
}

// Marcador circular con halo del color de la categoría; el estado cambia el anillo
export function unitIcon(category, status, highlighted = false) {
  const color = /^#[0-9a-f]{6}$/i.test(category?.color || "") ? category.color : "#9DB8B5";
  const emoji = category?.icon || "📍";
  const key = `${color}|${emoji}|${status}|${highlighted}`;

  if (!cache.has(key)) {
    cache.set(key, L.divIcon({
      className: "mk-wrap",
      html: `<div class="mk mk--${status} ${highlighted ? "mk--hl" : ""}" style="--c:${color}">
               <span class="mk__core">${escapeHtml(emoji)}</span>
             </div>`,
      iconSize: [40, 40],
      iconAnchor: [20, 20],
      popupAnchor: [0, -18]
    }));
  }

  return cache.get(key);
}

export const draftIcon = L.divIcon({
  className: "mk-wrap",
  html: `<div class="mk mk--draft" style="--c:#3EE6C1"><span class="mk__core">＋</span></div>`,
  iconSize: [40, 40],
  iconAnchor: [20, 20]
});

export const originIcon = L.divIcon({
  className: "mk-wrap",
  html: `<div class="origin"><span></span></div>`,
  iconSize: [30, 30],
  iconAnchor: [15, 15]
});
