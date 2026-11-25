import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { AREAS, RISK, SHIFTS, STATUS, formatDistance } from "../../utils/format";

/**
 * Panel lateral de la vista principal. Permite consultar sin salir del mapa:
 *  - Cobertura: unidades dentro de cada zona ($geoWithin), enfocar / filtrar / borrar zona
 *  - Personal:  médicos con su especialidad y unidad (enfoca la unidad en el mapa)
 *  - Catálogo:  categorías (filtran el mapa) y especialidades con sus conteos
 *  - Cercanía:  resultados de la búsqueda de unidades más cercanas ($geoNear)
 */
export default function InsightsPanel({
  tab, onTab, mode, coverage, doctors, specialties, categories, nearby, filters,
  onFocusUnit, onFocusZone, onToggleZoneFilter, onToggleCategory, onDeleteZone
}) {
  const tabs = [
    { id: "cobertura", label: "Cobertura", count: coverage.length },
    { id: "personal", label: "Personal", count: doctors.length },
    { id: "catalogo", label: "Catálogo", count: categories.length },
    ...(mode === "cercania" ? [{ id: "cercania", label: "Cercanía", count: nearby?.results.length || 0 }] : [])
  ];

  return (
    <aside className="insights">
      <nav className="insights__tabs" role="tablist">
        {tabs.map((item) => (
          <button key={item.id} role="tab" aria-selected={tab === item.id}
            className={tab === item.id ? "is-active" : ""} onClick={() => onTab(item.id)}>
            {item.label}<span>{item.count}</span>
          </button>
        ))}
      </nav>

      <div className="insights__body">
        {tab === "cobertura" && (
          <CoverageList coverage={coverage} filters={filters} onFocusZone={onFocusZone}
            onToggleZoneFilter={onToggleZoneFilter} onDeleteZone={onDeleteZone} onFocusUnit={onFocusUnit} />
        )}
        {tab === "personal" && <StaffList doctors={doctors} specialties={specialties} onFocusUnit={onFocusUnit} />}
        {tab === "catalogo" && (
          <CatalogSummary categories={categories} specialties={specialties} filters={filters} onToggleCategory={onToggleCategory} />
        )}
        {tab === "cercania" && <NearbyList nearby={nearby} onFocusUnit={onFocusUnit} />}
      </div>
    </aside>
  );
}

function focusPayload(unit) {
  const [lng, lat] = unit.location.coordinates;
  return { type: "unit", id: unit.id, lat, lng, ts: Date.now() };
}

function CoverageList({ coverage, filters, onFocusZone, onToggleZoneFilter, onDeleteZone, onFocusUnit }) {
  const [open, setOpen] = useState(null);

  if (coverage.length === 0) {
    return <p className="empty-note">Aún no hay zonas. Usa la herramienta <b>Trazar zona</b> sobre el mapa.</p>;
  }

  return (
    <ul className="zone-cards">
      {coverage.map((zone) => {
        const risk = RISK[zone.risk] || RISK.bajo;
        const { total, byStatus } = zone.summary;
        const alert = zone.risk === "alto" && byStatus.disponible < 2;
        const filtered = filters.zone === zone.id;

        return (
          <li key={zone.id} className={`zone-card ${filtered ? "is-filtered" : ""}`} style={{ "--risk": risk.color }}>
            <button className="zone-card__head" onClick={() => setOpen(open === zone.id ? null : zone.id)}>
              <span className="zone-card__dot" />
              <span className="zone-card__title">
                <strong>{zone.name}</strong>
                <small>{risk.label} · {total} unidad{total === 1 ? "" : "es"}</small>
              </span>
              <span className="zone-card__chev">{open === zone.id ? "Ocultar" : "Unidades"}</span>
            </button>

            <div className="meter" title="Unidades por estado">
              {total === 0 && <span className="meter__empty" />}
              {Object.entries(STATUS).map(([key, item]) => byStatus[key] > 0 && (
                <span key={key} className={`meter__seg tone--${item.tone}`} style={{ flexGrow: byStatus[key] }} />
              ))}
            </div>
            <div className="meter__legend">
              <span className="tone-text--ok">{byStatus.disponible} disp.</span>
              <span className="tone-text--warn">{byStatus.saturada} sat.</span>
              <span className="tone-text--off">{byStatus.cerrada} cerr.</span>
            </div>

            {alert && <p className="zone-card__alert">Riesgo alto con poca disponibilidad</p>}

            {open === zone.id && (
              <ul className="mini-list">
                {zone.units.length === 0 && <li className="muted">Sin unidades dentro del polígono</li>}
                {zone.units.map((unit) => (
                  <li key={unit.id}>
                    <button onClick={() => onFocusUnit(focusPayload(unit))}>
                      <i className="cat-dot" style={{ "--c": unit.category?.color }} />{unit.name}
                      <i className={`dot tone--${STATUS[unit.status].tone}`} />
                    </button>
                  </li>
                ))}
              </ul>
            )}

            <div className="zone-card__actions">
              <button className="btn btn--xs" onClick={() => onFocusZone({ type: "zone", ring: zone.area.coordinates[0], ts: Date.now() })}>Ver</button>
              <button className={`btn btn--xs ${filtered ? "btn--primary" : ""}`} onClick={() => onToggleZoneFilter(zone.id)}>
                {filtered ? "Quitar filtro" : "Filtrar"}
              </button>
              <button className="btn btn--xs btn--danger-ghost" onClick={() => onDeleteZone(zone)}>Eliminar</button>
            </div>
          </li>
        );
      })}
    </ul>
  );
}

function StaffList({ doctors, specialties, onFocusUnit }) {
  const [search, setSearch] = useState("");
  const [specialty, setSpecialty] = useState("all");

  const visible = useMemo(() => {
    const text = search.trim().toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
    return doctors.filter((doctor) => {
      const name = doctor.fullName.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
      return (!text || name.includes(text)) && (specialty === "all" || doctor.specialty?.id === specialty);
    });
  }, [doctors, search, specialty]);

  return (
    <div className="staff">
      <div className="staff__filters">
        <input className="input" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar médico…" />
        <select className="input" value={specialty} onChange={(e) => setSpecialty(e.target.value)}>
          <option value="all">Todas las especialidades</option>
          {specialties.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
        </select>
      </div>

      <ul className="staff__list">
        {visible.length === 0 && <li className="empty-note">Sin resultados.</li>}
        {visible.map((doctor) => (
          <li key={doctor.id}>
            <span className="staff-row__avatar">{doctor.fullName.replace(/^Dr[a]?\.\s*/, "").charAt(0)}</span>
            <div className="staff__info">
              <strong>{doctor.fullName}</strong>
              <small>{doctor.specialty?.name} · {SHIFTS[doctor.shift]} · Céd. {doctor.license}</small>
              {doctor.unit ? (
                <button className="link-btn" onClick={() => onFocusUnit(focusPayload(doctor.unit))}>
                  {doctor.unit.name}
                </button>
              ) : <small className="muted">Sin unidad asignada</small>}
            </div>
          </li>
        ))}
      </ul>

      <Link to="/catalogos" className="panel-link">Administrar médicos</Link>
    </div>
  );
}

function CatalogSummary({ categories, specialties, filters, onToggleCategory }) {
  const total = categories.reduce((sum, item) => sum + item.locationsCount, 0) || 1;

  return (
    <div className="catalog-sum">
      <span className="kicker">Categorías · clic para filtrar el mapa</span>
      <ul className="cat-bars">
        {categories.map((category) => (
          <li key={category.id}>
            <button className={filters.category === category.id ? "is-active" : ""} style={{ "--c": category.color }}
              onClick={() => onToggleCategory(category.id)}>
              <span className="cat-bars__icon" />
              <span className="cat-bars__name">{category.name}</span>
              <span className="cat-bars__num">{category.locationsCount}</span>
              <span className="cat-bars__track"><i style={{ width: `${(category.locationsCount / total) * 100}%` }} /></span>
            </button>
          </li>
        ))}
      </ul>

      <span className="kicker">Especialidades</span>
      <ul className="spec-grid">
        {specialties.map((item) => (
          <li key={item.id}>
            <strong>{item.name}</strong>
            <small>{AREAS[item.area]} · {item.doctorsCount} médico{item.doctorsCount === 1 ? "" : "s"}</small>
          </li>
        ))}
      </ul>

      <Link to="/catalogos" className="panel-link">Administrar catálogos</Link>
    </div>
  );
}

function NearbyList({ nearby, onFocusUnit }) {
  if (!nearby) return <p className="empty-note">Haz clic en el mapa donde está el paciente para calcular las unidades abiertas más cercanas.</p>;
  if (nearby.results.length === 0) return <p className="empty-note">No hay unidades abiertas registradas.</p>;

  return (
    <ol className="near-list">
      {nearby.results.map((item, index) => (
        <li key={item.id}>
          <button onClick={() => onFocusUnit(focusPayload(item))} className={index === 0 ? "is-first" : ""}>
            <span className="near-list__rank">{index + 1}</span>
            <span className="near-list__body">
              <strong><i className="cat-dot" style={{ "--c": item.category?.color }} />{item.name}</strong>
              <small>{STATUS[item.status].label}{item.phone ? ` · ${item.phone}` : ""}</small>
            </span>
            <span className="near-list__dist">{formatDistance(item.distance)}</span>
          </button>
        </li>
      ))}
    </ol>
  );
}
