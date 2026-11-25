import { useCallback, useEffect, useRef, useState } from "react";
import {
  MapContainer, TileLayer, Marker, Popup, Polygon, Polyline, Tooltip, useMap, useMapEvents, ZoomControl, ScaleControl
} from "react-leaflet";

import L from "../../lib/geoman";
import ZoneDrawer from "./ZoneDrawer.jsx";
import UnitPopup from "./UnitPopup.jsx";
import { unitIcon, draftIcon, originIcon } from "./markers";
import { RISK, formatDistance } from "../../utils/format";

import { CENTER, TILE_ATTRIBUTION, TILE_URL, toLatLngs } from "../../lib/mapConfig";

function ClickCatcher({ onClick }) {
  useMapEvents({
    click: (event) => onClick(event.latlng),
    // React escucha los clics dentro del popup (portal) y puede re-renderizarlo antes de que
    // Leaflet reciba el evento; se detiene aquí para que no cuente como clic en el mapa.
    popupopen: ({ popup }) => {
      const element = popup.getElement();
      if (element && !element.dataset.guarded) {
        L.DomEvent.on(element, "click", L.DomEvent.stopPropagation);
        element.dataset.guarded = "true";
      }
    }
  });
  return null;
}

// mueve el mapa cuando se selecciona algo en la tabla o en el panel lateral
function FocusController({ focus, markerRefs }) {
  const map = useMap();

  useEffect(() => {
    if (!focus) return;

    if (focus.type === "unit") {
      map.flyTo([focus.lat, focus.lng], Math.max(map.getZoom(), 16), { duration: 0.7 });
      map.once("moveend", () => markerRefs.current.get(focus.id)?.openPopup());
    }

    if (focus.type === "zone") {
      map.flyToBounds(L.latLngBounds(toLatLngs(focus.ring)), { padding: [60, 60], duration: 0.7 });
    }
  }, [focus, map, markerRefs]);

  return null;
}

function UnitMarker({ unit, categories, staff, highlighted, onUpdate, onDelete, registerRef }) {
  const markerRef = useRef(null);
  // cada vez que se abre el popup se vuelve a montar su contenido en modo "ficha"
  const [openCount, setOpenCount] = useState(0);
  const [lng, lat] = unit.location.coordinates;

  useEffect(() => {
    registerRef(unit.id, markerRef.current);
    return () => registerRef(unit.id, null);
  }, [unit.id, registerRef]);

  const resize = useCallback(() => {
    markerRef.current?.getPopup()?.update();
  }, []);

  return (
    <Marker
      ref={markerRef}
      position={[lat, lng]}
      icon={unitIcon(unit.category, unit.status, highlighted)}
      eventHandlers={{ popupopen: () => setOpenCount((count) => count + 1) }}
    >
      <Tooltip direction="top" offset={[0, -18]} className="unit-tip">{unit.name}</Tooltip>
      {/* el padding evita que el popup quede debajo de la barra de filtros flotante */}
      <Popup minWidth={280} maxWidth={320} className="vita-popup" maxHeight={400} autoPanPaddingTopLeft={[90, 140]} autoPanPaddingBottomRight={[20, 50]}>
        <UnitPopup
          key={openCount}
          unit={unit}
          staff={staff}
          categories={categories}
          onSave={onUpdate}
          onDelete={onDelete}
          onResize={resize}
        />
      </Popup>
    </Marker>
  );
}

export default function HealthMap({
  locations, zones, coverage, categories, staffByUnit, mode, draftPoint, drawingPaused, nearby, focus,
  onMapClick, onZoneDrawn, onUpdateUnit, onDeleteUnit, onDeleteZone
}) {
  const markerRefs = useRef(new Map());

  const registerRef = useCallback((id, marker) => {
    if (marker) markerRefs.current.set(id, marker);
    else markerRefs.current.delete(id);
  }, []);

  const nearbyIds = new Set((nearby?.results || []).map((item) => item.id));
  const zonesInteractive = mode === "explorar";
  const coverageById = new Map((coverage || []).map((zone) => [zone.id, zone.summary]));

  return (
    <MapContainer center={CENTER} zoom={13} zoomControl={false} keyboard={false} className={`map map--${mode}`}>
      <TileLayer attribution={TILE_ATTRIBUTION} url={TILE_URL} maxZoom={19} />
      <ZoomControl position="bottomright" />
      <ScaleControl position="bottomleft" imperial={false} />

      <ClickCatcher onClick={onMapClick} />
      <ZoneDrawer active={mode === "zona" && !drawingPaused} onDrawn={onZoneDrawn} />
      <FocusController focus={focus} markerRefs={markerRefs} />

      {zones.map((zone) => {
        const risk = RISK[zone.risk] || RISK.bajo;
        const summary = coverageById.get(zone.id);
        return (
          <Polygon
            // se vuelve a montar al cambiar de modo para activar/desactivar los clics
            key={`${zone.id}-${zonesInteractive}`}
            positions={toLatLngs(zone.area.coordinates[0])}
            interactive={zonesInteractive}
            pathOptions={{
              color: risk.color,
              weight: 2,
              fillColor: risk.color,
              fillOpacity: 0.14,
              dashArray: zone.risk === "alto" ? "10 8" : "2 6",
              lineCap: "round"
            }}
          >
            <Tooltip permanent direction="center" className="zone-label">
              <span style={{ "--risk": risk.color }}>{zone.name}</span>
            </Tooltip>
            {zonesInteractive && (
              <Popup className="vita-popup" autoPanPaddingTopLeft={[90, 140]}>
                <div className="zone-pop" style={{ "--risk": risk.color }}>
                  <span className="pill pill--risk">{risk.label}</span>
                  <h3>{zone.name}</h3>
                  {zone.notes && <p className="muted">{zone.notes}</p>}
                  {summary && (
                    <div className="zone-pop__nums">
                      <div><strong>{summary.total}</strong><small>unidades</small></div>
                      <div><strong>{summary.byStatus.disponible}</strong><small>disponibles</small></div>
                      <div><strong>{summary.byStatus.saturada}</strong><small>saturadas</small></div>
                    </div>
                  )}
                  <small className="muted">Trazada por {zone.createdBy?.name || "—"}</small>
                  <button className="btn btn--sm btn--danger" onClick={() => onDeleteZone(zone)}>Eliminar zona</button>
                </div>
              </Popup>
            )}
          </Polygon>
        );
      })}

      {locations.map((unit) => (
        <UnitMarker
          key={unit.id}
          unit={unit}
          staff={staffByUnit.get(unit.id) || []}
          categories={categories}
          highlighted={nearbyIds.has(unit.id)}
          onUpdate={onUpdateUnit}
          onDelete={onDeleteUnit}
          registerRef={registerRef}
        />
      ))}

      {draftPoint && <Marker position={[draftPoint.lat, draftPoint.lng]} icon={draftIcon} interactive={false} />}

      {nearby && (
        <>
          <Marker position={[nearby.origin.lat, nearby.origin.lng]} icon={originIcon} interactive={false} />
          {nearby.results.map((item, index) => {
            const [lng, lat] = item.location.coordinates;
            return (
              <Polyline
                key={item.id}
                positions={[[nearby.origin.lat, nearby.origin.lng], [lat, lng]]}
                pathOptions={{
                  color: index === 0 ? "#3EE6C1" : "#9DB8B5",
                  weight: index === 0 ? 4 : 2,
                  opacity: index === 0 ? 1 : 0.7,
                  dashArray: "1 9",
                  lineCap: "round"
                }}
              >
                <Tooltip permanent={index === 0} direction="center" className="dist-tip">{formatDistance(item.distance)}</Tooltip>
              </Polyline>
            );
          })}
        </>
      )}
    </MapContainer>
  );
}
