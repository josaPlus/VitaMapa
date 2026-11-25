import { STATUS, formatCoord, formatDate } from "../../utils/format";

// Tabla en tiempo real: se alimenta del mismo estado que el mapa
export default function LocationsTable({ locations, loading, onSelect }) {
  return (
    <section className="ledger">
      <header className="ledger__head">
        <div>
          <span className="kicker">Bitácora en vivo</span>
          <h2>Ubicaciones registradas</h2>
        </div>
        <span className="ledger__count mono">
          {loading && <span className="spinner" aria-hidden />}
          {String(locations.length).padStart(2, "0")} registros
        </span>
      </header>

      <div className="ledger__scroll">
        <table className="table">
          <thead>
            <tr>
              <th>Unidad</th>
              <th>Categoría</th>
              <th>Estado</th>
              <th>Descripción</th>
              <th>Teléfono</th>
              <th>Latitud</th>
              <th>Longitud</th>
              <th>Registró</th>
              <th>Alta</th>
              <th>Última edición</th>
            </tr>
          </thead>
          <tbody>
            {locations.length === 0 && (
              <tr>
                <td colSpan={10} className="table__empty">
                  No hay ubicaciones con estos filtros. Haz clic en el mapa (modo Registrar) para agregar una.
                </td>
              </tr>
            )}

            {locations.map((unit) => {
              const [lng, lat] = unit.location.coordinates;
              const status = STATUS[unit.status];
              return (
                <tr key={unit.id} onClick={() => onSelect(unit)} title="Ver en el mapa">
                  <td className="table__strong">{unit.name}</td>
                  <td>
                    <span className="chip-static" style={{ "--cat": unit.category?.color }}>
                      {unit.category?.icon} {unit.category?.name || "—"}
                    </span>
                  </td>
                  <td><span className={`badge badge--${status.tone}`}>{status.label}</span></td>
                  <td className="table__desc">{unit.description}</td>
                  <td className="mono">{unit.phone || "—"}</td>
                  <td className="mono">{formatCoord(lat)}</td>
                  <td className="mono">{formatCoord(lng)}</td>
                  <td>{unit.createdBy?.name || "—"}</td>
                  <td className="mono small">{formatDate(unit.createdAt)}</td>
                  <td className="mono small">{formatDate(unit.updatedAt)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
