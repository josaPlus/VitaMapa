import { useCallback, useEffect, useMemo, useState } from "react";

import { api } from "../api/client";
import { useToast } from "../context/ToastContext.jsx";
import useDebouncedValue from "../hooks/useDebouncedValue";
import HealthMap from "../components/map/HealthMap.jsx";
import FilterBar from "../components/map/FilterBar.jsx";
import InsightsPanel from "../components/map/InsightsPanel.jsx";
import LocationsTable from "../components/map/LocationsTable.jsx";
import NewUnitModal from "../components/map/NewUnitModal.jsx";
import ZoneModal from "../components/map/ZoneModal.jsx";
import Modal from "../components/Modal.jsx";
import { STATUS } from "../utils/format";

// herramientas del mapa: cada una se identifica con su letra inicial
const MODES = [
  { id: "registrar", icon: "R", label: "Registrar", help: "Haz clic en el mapa donde está la unidad para registrarla" },
  { id: "zona", icon: "Z", label: "Zona", help: "Haz clic para marcar cada esquina de la zona · clic en el primer punto para terminar" },
  { id: "cercania", icon: "C", label: "Cercanía", help: "Clic donde está el paciente: las 3 unidades abiertas más cercanas" },
  { id: "explorar", icon: "E", label: "Explorar", help: "Navega libremente · clic en una zona para ver su detalle" }
];

const INITIAL_FILTERS = { search: "", category: "all", status: "all", zone: "all" };
const POLL_MS = 20000;

export default function MapPage() {
  const toast = useToast();

  const [categories, setCategories] = useState([]);
  const [specialties, setSpecialties] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [zones, setZones] = useState([]);
  const [coverage, setCoverage] = useState([]);
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);

  const [filters, setFilters] = useState(INITIAL_FILTERS);
  const debouncedSearch = useDebouncedValue(filters.search);
  const query = useMemo(() => ({ ...filters, search: debouncedSearch.trim() }), [filters, debouncedSearch]);

  const [mode, setMode] = useState("registrar");
  const [panelTab, setPanelTab] = useState("cobertura");
  const [draftPoint, setDraftPoint] = useState(null);
  const [draftZone, setDraftZone] = useState(null);
  const [zoneToDelete, setZoneToDelete] = useState(null);
  const [zoneToEdit, setZoneToEdit] = useState(null);
  const [nearby, setNearby] = useState(null);
  const [focus, setFocus] = useState(null);

  // ---------- carga de datos ----------
  const loadLocations = useCallback(async ({ silent = false } = {}) => {
    if (!silent) setLoading(true);
    try {
      const { data } = await api.get("/locations", query);
      setLocations(data);
    } catch (error) {
      if (!silent) toast.error("No se pudieron cargar las ubicaciones", error);
    } finally {
      if (!silent) setLoading(false);
    }
  }, [query, toast]);

  // datos de apoyo: catálogos, personal, zonas y cobertura (se ven en el panel lateral)
  const loadContext = useCallback(async () => {
    const results = await Promise.allSettled([
      api.get("/categories"),
      api.get("/specialties"),
      api.get("/doctors"),
      api.get("/zones"),
      api.get("/zones/coverage")
    ]);
    const [cat, spec, doc, zon, cov] = results;

    if (cat.status === "fulfilled") setCategories(cat.value.data);
    if (spec.status === "fulfilled") setSpecialties(spec.value.data);
    if (doc.status === "fulfilled") setDoctors(doc.value.data);
    if (zon.status === "fulfilled") setZones(zon.value.data);
    if (cov.status === "fulfilled") setCoverage(cov.value.data);

    const failed = results.find((item) => item.status === "rejected");
    if (failed) toast.error("Parte de la información no se pudo cargar", failed.reason);
  }, [toast]);

  useEffect(() => {
    loadContext();
  }, [loadContext]);

  // cada cambio de filtros consulta al backend
  useEffect(() => {
    loadLocations();
  }, [loadLocations]);

  // refresco silencioso para ver cambios hechos por otros usuarios
  useEffect(() => {
    const timer = setInterval(() => {
      loadLocations({ silent: true });
      loadContext();
    }, POLL_MS);
    return () => clearInterval(timer);
  }, [loadLocations, loadContext]);

  // si se borra la zona que estaba como filtro, se quita el filtro
  useEffect(() => {
    if (filters.zone !== "all" && zones.length > 0 && !zones.some((zone) => zone.id === filters.zone)) {
      setFilters((current) => ({ ...current, zone: "all" }));
    }
  }, [zones, filters.zone]);

  const refreshAll = useCallback(async () => {
    await Promise.all([loadLocations({ silent: true }), loadContext()]);
  }, [loadLocations, loadContext]);

  // médicos agrupados por unidad (se muestran dentro del popup)
  const staffByUnit = useMemo(() => {
    const map = new Map();
    doctors.forEach((doctor) => {
      if (!doctor.unit) return;
      const list = map.get(doctor.unit.id) || [];
      list.push(doctor);
      map.set(doctor.unit.id, list);
    });
    return map;
  }, [doctors]);

  // ---------- interacción con el mapa ----------
  const handleMapClick = useCallback(async (latlng) => {
    if (mode === "registrar") setDraftPoint(latlng);

    if (mode === "cercania") {
      try {
        const { data } = await api.get("/locations/nearby", { lat: latlng.lat, lng: latlng.lng, limit: 3 });
        setNearby({ origin: latlng, results: data });
        setPanelTab("cercania");
      } catch (error) {
        toast.error("No se pudo calcular la cercanía", error);
      }
    }
  }, [mode, toast]);

  function changeMode(next) {
    setMode(next);
    setDraftPoint(null);
    if (next === "cercania") setPanelTab("cercania");
    else {
      setNearby(null);
      if (panelTab === "cercania") setPanelTab("cobertura");
    }
  }

  // ---------- CRUD de ubicaciones ----------
  async function createUnit(payload) {
    const { data } = await api.post("/locations", payload);
    setDraftPoint(null);
    toast.success("Ubicación registrada", `${data.name} ya aparece en el mapa y en la tabla.`);
    await refreshAll();
  }

  const updateUnit = useCallback(async (id, changes) => {
    const { data } = await api.patch(`/locations/${id}`, changes);
    toast.success("Cambios guardados", data.name);
    await refreshAll();
  }, [refreshAll, toast]);

  const deleteUnit = useCallback(async (id) => {
    const { data } = await api.delete(`/locations/${id}`);
    toast.success("Ubicación eliminada", data.name);
    setNearby(null);
    await refreshAll();
  }, [refreshAll, toast]);

  // ---------- zonas ----------
  async function createZone(payload) {
    const { data } = await api.post("/zones", payload);
    setDraftZone(null);
    toast.success("Zona guardada", `${data.name} ya aparece en el mapa.`);
    setPanelTab("cobertura");
    await loadContext();
  }

  // PATCH /api/zones/:id -> nombre, nivel de riesgo y notas
  async function updateZone(id, changes) {
    const { data } = await api.patch(`/zones/${id}`, changes);
    setZoneToEdit(null);
    toast.success("Zona actualizada", data.name);
    await loadContext();
  }

  async function confirmDeleteZone() {
    try {
      const { data } = await api.delete(`/zones/${zoneToDelete.id}`);
      toast.success("Zona eliminada", data.name);
      setZoneToDelete(null);
      await loadContext();
    } catch (error) {
      toast.error("No se pudo eliminar la zona", error);
    }
  }

  // centra el mapa en una unidad o zona y lo hace visible si quedó fuera de pantalla
  const focusOnMap = useCallback((payload) => {
    setFocus(payload);
    document.querySelector(".console__map")?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, []);

  const statusCount = useMemo(() => {
    const counts = { disponible: 0, saturada: 0, cerrada: 0 };
    locations.forEach((unit) => { counts[unit.status] += 1; });
    return counts;
  }, [locations]);

  const currentMode = MODES.find((item) => item.id === mode);

  return (
    <div className="map-page">
      <section className="console">
        <div className="console__map">
          <FilterBar filters={filters} onChange={setFilters} categories={categories} zones={zones} />

          <div className="dock" role="toolbar" aria-label="Herramientas del mapa">
            {MODES.map((item) => (
              <button key={item.id} className={`dock__btn ${mode === item.id ? "is-active" : ""}`}
                onClick={() => changeMode(item.id)} title={item.help}>
                <span className="dock__icon">{item.icon}</span>
                <span className="dock__label">{item.label}</span>
              </button>
            ))}
          </div>

          <div className="mode-hint"><i />{currentMode.help}</div>

          <HealthMap
            locations={locations}
            zones={zones}
            coverage={coverage}
            categories={categories}
            staffByUnit={staffByUnit}
            mode={mode}
            draftPoint={draftPoint}
            drawingPaused={Boolean(draftZone)}
            nearby={nearby}
            focus={focus}
            onMapClick={handleMapClick}
            onZoneDrawn={setDraftZone}
            onUpdateUnit={updateUnit}
            onDeleteUnit={deleteUnit}
            onEditZone={setZoneToEdit}
            onDeleteZone={setZoneToDelete}
          />
        </div>

        <div className="console__side">
          <div className="kpis">
            {Object.entries(STATUS).map(([key, item]) => (
              <button key={key}
                className={`kpi kpi--${item.tone} ${filters.status === key ? "is-active" : ""}`}
                onClick={() => setFilters((current) => ({ ...current, status: current.status === key ? "all" : key }))}
                title="Filtrar por estado">
                <strong>{statusCount[key]}</strong>
                <span>{item.label}{statusCount[key] === 1 ? "" : "s"}</span>
              </button>
            ))}
            <div className="kpi kpi--zone">
              <strong>{zones.length}</strong>
              <span>Zonas</span>
            </div>
          </div>

          <InsightsPanel
            tab={panelTab}
            onTab={setPanelTab}
            mode={mode}
            coverage={coverage}
            doctors={doctors}
            specialties={specialties}
            categories={categories}
            nearby={nearby}
            filters={filters}
            onFocusUnit={focusOnMap}
            onFocusZone={focusOnMap}
            onToggleZoneFilter={(id) => setFilters((current) => ({ ...current, zone: current.zone === id ? "all" : id }))}
            onToggleCategory={(id) => setFilters((current) => ({ ...current, category: current.category === id ? "all" : id }))}
            onEditZone={setZoneToEdit}
            onDeleteZone={setZoneToDelete}
          />
        </div>
      </section>

      <LocationsTable
        locations={locations}
        loading={loading}
        onSelect={(unit) => {
          const [lng, lat] = unit.location.coordinates;
          focusOnMap({ type: "unit", id: unit.id, lat, lng, ts: Date.now() });
        }}
      />

      {draftPoint && (
        <NewUnitModal point={draftPoint} categories={categories} onCancel={() => setDraftPoint(null)} onCreate={createUnit} />
      )}

      {draftZone && (
        <ZoneModal coordinates={draftZone} onCancel={() => setDraftZone(null)} onSubmit={createZone} />
      )}

      {zoneToEdit && (
        <ZoneModal zone={zoneToEdit} onCancel={() => setZoneToEdit(null)} onSubmit={updateZone} />
      )}

      {zoneToDelete && (
        <Modal kicker="Confirmar" title="¿Eliminar zona?" onClose={() => setZoneToDelete(null)}>
          <p>Se borrará la zona <strong>{zoneToDelete.name}</strong>. Las unidades de salud que están dentro no se eliminan.</p>
          <div className="modal__actions">
            <button className="btn btn--ghost" onClick={() => setZoneToDelete(null)}>Cancelar</button>
            <button className="btn btn--danger" onClick={confirmDeleteZone}>Sí, eliminar</button>
          </div>
        </Modal>
      )}
    </div>
  );
}
