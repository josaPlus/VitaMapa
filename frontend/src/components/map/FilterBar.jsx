import { STATUS } from "../../utils/format";

// Los filtros se mandan al backend como ?search=&category=&status=&zone=
export default function FilterBar({ filters, onChange, categories, zones }) {
  const set = (field, value) => onChange({ ...filters, [field]: value });
  const hasFilters = filters.search || filters.category !== "all" || filters.status !== "all" || filters.zone !== "all";

  return (
    <section className="filterbar" aria-label="Búsqueda y filtros">
      <div className="filterbar__row">
        <label className="filterbar__search">
          <svg viewBox="0 0 20 20" width="16" height="16" aria-hidden>
            <circle cx="8.5" cy="8.5" r="5.5" fill="none" stroke="currentColor" strokeWidth="2" />
            <path d="M13 13l4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
          <input
            value={filters.search}
            onChange={(event) => set("search", event.target.value)}
            placeholder="Buscar unidad por nombre…"
          />
        </label>

        <select className="input input--sm" value={filters.status} onChange={(event) => set("status", event.target.value)} aria-label="Estado">
          <option value="all">Cualquier estado</option>
          {Object.entries(STATUS).map(([value, item]) => <option key={value} value={value}>{item.label}</option>)}
        </select>

        <select className="input input--sm" value={filters.zone} onChange={(event) => set("zone", event.target.value)} aria-label="Zona">
          <option value="all">Toda la ciudad</option>
          {zones.map((zone) => <option key={zone.id} value={zone.id}>Dentro de: {zone.name}</option>)}
        </select>

        {hasFilters && (
          <button className="btn btn--xs btn--ghost" onClick={() => onChange({ search: "", category: "all", status: "all", zone: "all" })}>
            Limpiar
          </button>
        )}
      </div>

      <div className="filterbar__chips" role="group" aria-label="Categoría">
        <button className={`tag ${filters.category === "all" ? "is-active" : ""}`} onClick={() => set("category", "all")}>
          Todas
        </button>
        {categories.map((category) => (
          <button
            key={category.id}
            className={`tag ${filters.category === category.id ? "is-active" : ""}`}
            style={{ "--c": category.color }}
            onClick={() => set("category", filters.category === category.id ? "all" : category.id)}
          >
            <i />{category.name}
          </button>
        ))}
      </div>
    </section>
  );
}
