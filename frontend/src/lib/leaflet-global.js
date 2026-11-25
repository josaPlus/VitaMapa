// Leaflet-Geoman se instala sobre el objeto global "L".
// Este módulo se evalúa ANTES que geoman para que encuentre Leaflet.
import L from "leaflet";

window.L = L;

export default L;
