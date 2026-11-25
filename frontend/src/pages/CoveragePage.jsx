import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { AttributionControl, CircleMarker, MapContainer, Polygon, TileLayer, Tooltip, useMap } from "react-leaflet";

import L from "../lib/geoman";
import { api } from "../api/client";
import { useToast } from "../context/ToastContext.jsx";
import { ATTRIBUTION_PREFIX, CENTER, TILE_ATTRIBUTION, TILE_URL, toLatLngs } from "../lib/mapConfig";
import { RISK, STATUS } from "../utils/format";

const STATUS_COLORS = { disponible: "#3EE6C1", saturada: "#FFB547", cerrada: "#6B7F7D" };

function FitZone({ zone }) {
  const map = useMap();
  useEffect(() => {
    if (zone) map.flyToBounds(L.latLngBounds(toLatLngs(zone.area.coordinates[0])), { padding: [40, 40], duration: 0.6 });
  }, [zone, map]);
  return null;
}

// Vista 3: qué unidades de salud quedan dentro de cada zona (consulta $geoWithin en el backend)
export default function CoveragePage() {
  const toast = useToast();
  const [zones, setZones] = useState(null);
  const [selectedId, setSelectedId] = useState(null);

  useEffect(() => {
    api.get("/zones/coverage")
      .then(({ data }) => setZones(data))
      .catch((error) => {
        setZones([]);
        toast.error("No se pudo calcular la cobertura", error);
      });
  }, [toast]);

  const selected = zones?.find((zone) => zone.id === selectedId) || null;

  const totals = useMemo(() => {
    const result = { zones: zones?.length || 0, units: 0, high: 0, alerts: 0 };
    zones?.forEach((zone) => {
      result.units += zone.summary.total;
      if (zone.risk === "alto") result.high += 1;
      if (zone.risk === "alto" && zone.summary.byStatus.disponible < 2) result.alerts += 1;
    });
    return result;
  }, [zones]);

  return (
    <div className="coverage">
      <header className="page-head">
        <div>
          <span className="kicker">Zonas sanitarias</span>
          <h1>Cobertura por zona</h1>
          <p className="muted">
            Cuántas unidades de salud hay dentro de cada zona y en qué estado están. Selecciona una zona para verla en el mapa.
          </p>
        </div>
        <div className="kpis kpis--inline">
          <div className="kpi kpi--zone"><strong>{totals.zones}</strong><span>Zonas</span></div>
          <div className="kpi kpi--ok"><strong>{totals.units}</strong><span>Unidades cubiertas</span></div>
          <div className="kpi kpi--warn"><strong>{totals.high}</strong><span>Riesgo alto</span></div>
          <div className="kpi kpi--danger"><strong>{totals.alerts}</strong><span>Alertas</span></div>
        </div>
      </header>

      {zones === null && <div className="splash splash--inline"><span className="splash__pulse" /><p>Calculando…</p></div>}

      {zones?.length === 0 && (
        <div className="panel empty">
          <p>No hay zonas registradas todavía.</p>
          <Link className="btn btn--primary" to="/mapa">Ir al mapa a trazar una</Link>
        </div>
      )}

      {zones?.length > 0 && (
        <div className="coverage__layout">
          <div className="coverage__map panel">
            <MapContainer center={CENTER} zoom={12} className="map" scrollWheelZoom attributionControl={false}>
              <AttributionControl position="bottomright" prefix={ATTRIBUTION_PREFIX} />
              <TileLayer attribution={TILE_ATTRIBUTION} url={TILE_URL} maxZoom={19} />
              <FitZone zone={selected} />
              {zones.map((zone) => {
                const risk = RISK[zone.risk] || RISK.bajo;
                const active = zone.id === selectedId;
                return (
                  <Polygon key={zone.id} positions={toLatLngs(zone.area.coordinates[0])}
                    eventHandlers={{ click: () => setSelectedId(zone.id) }}
                    pathOptions={{ color: risk.color, weight: active ? 3 : 1.5, fillColor: risk.color, fillOpacity: active ? 0.28 : 0.12 }}>
                    <Tooltip sticky className="unit-tip">{zone.name} · {zone.summary.total} unidades</Tooltip>
                  </Polygon>
                );
              })}
              {zones.flatMap((zone) => zone.units.map((unit) => {
                const [lng, lat] = unit.location.coordinates;
                return (
                  <CircleMarker key={`${zone.id}-${unit.id}`} center={[lat, lng]} radius={7}
                    pathOptions={{ color: "#0B1519", weight: 2, fillColor: STATUS_COLORS[unit.status], fillOpacity: 1 }}>
                    <Tooltip className="unit-tip">{unit.name}</Tooltip>
                  </CircleMarker>
                );
              }))}
            </MapContainer>
          </div>

          <ul className="coverage__list">
            {zones.map((zone) => {
              const risk = RISK[zone.risk] || RISK.bajo;
              const { total, byStatus, byCategory } = zone.summary;
              const alert = zone.risk === "alto" && byStatus.disponible < 2;

              return (
                <li key={zone.id}>
                  <button className={`report ${zone.id === selectedId ? "is-active" : ""}`} style={{ "--risk": risk.color }}
                    onClick={() => setSelectedId(zone.id)}>
                    <div className="report__top">
                      <span className="pill pill--risk">{risk.label}</span>
                      <span className="report__total"><strong>{total}</strong> unidades</span>
                    </div>
                    <h2>{zone.name}</h2>
                    {zone.notes && <p className="muted small">{zone.notes}</p>}

                    <div className="meter">
                      {total === 0 && <span className="meter__empty" />}
                      {Object.entries(STATUS).map(([key, item]) => byStatus[key] > 0 && (
                        <span key={key} className={`meter__seg tone--${item.tone}`} style={{ flexGrow: byStatus[key] }} />
                      ))}
                    </div>
                    <div className="meter__legend">
                      <span className="tone-text--ok">{byStatus.disponible} disponibles</span>
                      <span className="tone-text--warn">{byStatus.saturada} saturadas</span>
                      <span className="tone-text--off">{byStatus.cerrada} cerradas</span>
                    </div>

                    {alert && <p className="zone-card__alert">Riesgo alto con poca disponibilidad</p>}

                    {byCategory.length > 0 && (
                      <div className="report__tags">
                        {byCategory.map((item) => <span key={item.name}>{item.name} <b>{item.total}</b></span>)}
                      </div>
                    )}

                    {zone.id === selectedId && (
                      <ul className="mini-list mini-list--static">
                        {zone.units.length === 0 && <li className="muted">Ninguna unidad registrada en esta zona.</li>}
                        {zone.units.map((unit) => (
                          <li key={unit.id}>
                            <i className="cat-dot" style={{ "--c": unit.category?.color }} />{unit.name}
                            <i className={`dot tone--${STATUS[unit.status].tone}`} />
                          </li>
                        ))}
                      </ul>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
