import { useEffect, useRef } from "react";
import { useMap } from "react-leaflet";

/**
 * Activa el modo de dibujo de polígonos de Leaflet-Geoman.
 * Cuando el usuario cierra el polígono, se obtiene su GeoJSON
 * (coordenadas en [longitud, latitud]) y se entrega al componente padre.
 */
export default function ZoneDrawer({ active, onDrawn }) {
  const map = useMap();
  const callback = useRef(onDrawn);

  useEffect(() => {
    callback.current = onDrawn;
  }, [onDrawn]);

  useEffect(() => {
    // textos propios para las ayudas que muestra la herramienta de dibujo
    map.pm.setLang("vitamapa", {
      tooltips: {
        firstVertex: "Haz clic para marcar el primer punto de la zona",
        continueLine: "Haz clic para seguir marcando la zona",
        finishPoly: "Haz clic en el primer punto para terminar"
      }
    }, "es");

    function handleCreate(event) {
      const geojson = event.layer.toGeoJSON();
      // la capa temporal se quita: la zona real se pinta cuando se guarda en MongoDB
      map.removeLayer(event.layer);
      callback.current(geojson.geometry.coordinates);
    }

    map.on("pm:create", handleCreate);
    return () => map.off("pm:create", handleCreate);
  }, [map]);

  useEffect(() => {
    if (active) {
      map.pm.enableDraw("Polygon", {
        snappable: true,
        allowSelfIntersection: false,
        finishOn: null,
        templineStyle: { color: "#3EE6C1", weight: 2 },
        hintlineStyle: { color: "#3EE6C1", dashArray: "6 6" },
        pathOptions: { color: "#3EE6C1", weight: 2, fillColor: "#3EE6C1", fillOpacity: 0.18 }
      });
    } else {
      map.pm.disableDraw();
    }

    return () => map.pm.disableDraw();
  }, [map, active]);

  return null;
}
