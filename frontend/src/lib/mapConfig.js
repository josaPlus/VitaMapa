// Configuración compartida por los mapas de la app

export const CENTER = [21.1300, -101.6860]; // León, Gto.

export const TILE_URL = "https://tile.openstreetmap.org/{z}/{x}/{y}.png";
export const TILE_ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>';

// GeoJSON guarda [lng, lat]; Leaflet dibuja con [lat, lng]
export const toLatLngs = (ring) => ring.map(([lng, lat]) => [lat, lng]);
