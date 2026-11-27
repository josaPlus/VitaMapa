import { useCallback, useEffect, useRef, useState } from "react";
import {
  AttributionControl, MapContainer, TileLayer, Marker, Popup, Polygon, Polyline, Tooltip, useMap, useMapEvents, ZoomControl, ScaleControl
} from "react-leaflet";

import L from "../../lib/geoman";
import ZoneDrawer from "./ZoneDrawer.jsx";
import UnitPopup from "./UnitPopup.jsx";
import { unitIcon, draftIcon, originIcon } from "./markers";
import { RISK, formatDistance } from "../../utils/format";

import { ATTRIBUTION_PREFIX, CENTER, TILE_ATTRIBUTION, TILE_URL, toLatLngs } from "../../lib/mapConfig";

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

const roundCoord = (value) => Math.round(value * 1e6) / 1e6;

function UnitMarker({ unit, categories, staff, highlighted, onUpdate, onDelete, registerRef }) {
  const markerRef = useRef(null);
  // cada vez que se abre el popup se vuelve a montar su contenido en modo "ficha"
  const [openCount, setOpenCount] = useState(0);
  const [lng, lat] = unit.location.coordinates;

  // posición en edición: null = no se está editando; mientras se edita el marcador se puede arrastrar
  const [editPos, setEditPos] = useState(null);
  const editing = editPos !== null;
  const validEdit = editing && Number.isFinite(Number(editPos.lat)) && Number.isFinite(Number(editPos.lng))
    && editPos.lat !== "" && editPos.lng !== "";
  const position = validEdit ? [Number(editPos.lat), Number(editPos.lng)] : [lat, lng];

  const startMove = useCallback(() => setEditPos({ lat, lng }), [lat, lng]);
  const stopMove = useCallback(() => setEditPos(null), []);

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
      position={position}
      draggable={editing}
      autoPan={editing}
      icon={unitIcon(unit.category, unit.status, highlighted)}
      eventHandlers={{
        popupopen: () => setOpenCount((count) => count + 1),
        popupclose: stopMove,
        // al soltar el marcador se guarda la nueva posición en el formulario del popup
        dragend: (event) => {
          const { lat: newLat, lng: newLng } = event.target.getLatLng();
          setEditPos({ lat: roundCoord(newLat), lng: roundCoord(newLng) });
        }
      }}
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
          position={editPos}
          onEditStart={startMove}
          onEditEnd={stopMove}
          onPositionChange={setEditPos}
        />
      </Popup>
    </Marker>
  );
}

// botones del popup de una zona: cierran el popup y abren el formulario o la confirmación
function ZoneActions({ zone, onEdit, onDelete }) {
  const map = useMap();

  return (
    <div className="zone-pop__actions">
      <button className="btn btn--sm btn--primary" onClick={() => { map.closePopup(); onEdit(zone); }}>Editar</button>
      <button className="btn btn--sm btn--danger-ghost" onClick={() => { map.closePopup(); onDelete(zone); }}>Eliminar</button>
    </div>
  );
}

export default function HealthMap({
  locations, zones, coverage, categories, staffByUnit, mode, draftPoint, drawingPaused, nearby, focus,
  onMapClick, onZoneDrawn, onUpdateUnit, onDeleteUnit, onEditZone, onDeleteZone
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
    <MapContainer center={CENTER} zoom={13} zoomControl={false} attributionControl={false} keyboard={false} className={`map map--${mode}`}>
      <AttributionControl position="bottomright" prefix={ATTRIBUTION_PREFIX} />
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
                  <ZoneActions zone={zone} onEdit={onEditZone} onDelete={onDeleteZone} />
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
