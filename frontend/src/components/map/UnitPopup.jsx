import { useEffect, useState } from "react";
import { SHIFTS, STATUS, formatCoord, formatDate } from "../../utils/format";

function toForm(unit) {
  return {
    name: unit.name,
    description: unit.description,
    category: unit.category?.id || "",
    status: unit.status,
    phone: unit.phone || ""
  };
}

/**
 * Contenido del popup de una ubicación. Tiene tres estados:
 *  view    -> ficha de la unidad
 *  edit    -> formulario para editar ahí mismo
 *  confirm -> confirmación antes de eliminar
 */
export default function UnitPopup({ unit, staff = [], categories, onSave, onDelete, onResize }) {
  const [mode, setMode] = useState("view");
  const [form, setForm] = useState(() => toForm(unit));
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  // el popup de Leaflet se reacomoda cuando cambia su contenido
  useEffect(() => {
    onResize?.();
  }, [mode, error, onResize]);

  const [lng, lat] = unit.location.coordinates;
  const status = STATUS[unit.status];
  const color = unit.category?.color || "#15201B";

  function update(field) {
    return (event) => setForm((current) => ({ ...current, [field]: event.target.value }));
  }

  function startEdit() {
    setForm(toForm(unit));
    setError(null);
    setMode("edit");
  }

  async function handleSave(event) {
    event.preventDefault();
    setBusy(true);
    setError(null);

    // solo se mandan los campos que cambiaron (PATCH)
    const original = toForm(unit);
    const changes = Object.fromEntries(
      Object.entries(form).filter(([key, value]) => value !== original[key])
    );

    if (Object.keys(changes).length === 0) {
      setMode("view");
      setBusy(false);
      return;
    }

    try {
      await onSave(unit.id, changes);
      setMode("view");
    } catch (err) {
      setError(err);
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete() {
    setBusy(true);
    try {
      await onDelete(unit.id);
    } catch (err) {
      setError(err);
      setMode("view");
      setBusy(false);
    }
  }

  return (
    <div className="unit-card" style={{ "--cat": color }}>
      <div className="unit-card__band">
        <span />
        {unit.category?.name || "Sin categoría"}
      </div>

      {error && (
        <div className="alert alert--error alert--tight">
          <strong>{error.message}</strong>
          {Array.isArray(error.details) && <ul>{error.details.map((d) => <li key={d}>{d}</li>)}</ul>}
        </div>
      )}

      {mode === "view" && (
        <>
          <h3 className="unit-card__title">{unit.name}</h3>
          <span className={`badge badge--${status.tone}`}>{status.label}</span>
          <p className="unit-card__desc">{unit.description}</p>

          <dl className="unit-card__meta">
            {unit.phone && (<><dt>Tel.</dt><dd>{unit.phone}</dd></>)}
            <dt>Coord.</dt><dd className="mono">{formatCoord(lat)}, {formatCoord(lng)}</dd>
            <dt>Registró</dt><dd>{unit.createdBy?.name || "—"}</dd>
            <dt>Editado</dt><dd>{formatDate(unit.updatedAt)}</dd>
          </dl>

          {/* relación Médico -> Unidad: personal que atiende aquí */}
          <div className="unit-card__staff">
            <span className="kicker">Personal médico · {staff.length}</span>
            {staff.length === 0 && <small className="muted">Sin médicos asignados</small>}
            {staff.map((doctor) => (
              <div key={doctor.id} className="staff-row">
                <span className="staff-row__avatar">{doctor.fullName.replace(/^Dr[a]?\.\s*/, "").charAt(0)}</span>
                <span>
                  <strong>{doctor.fullName}</strong>
                  <small>{doctor.specialty?.name} · {SHIFTS[doctor.shift]}</small>
                </span>
              </div>
            ))}
          </div>

          <div className="unit-card__actions">
            <button className="btn btn--sm btn--primary" onClick={startEdit}>Editar</button>
            <button className="btn btn--sm btn--danger-ghost" onClick={() => setMode("confirm")}>Eliminar</button>
          </div>
        </>
      )}

      {mode === "edit" && (
        <form className="form form--compact" onSubmit={handleSave}>
          <label className="field">
            <span>Nombre</span>
            <input value={form.name} onChange={update("name")} required minLength={3} maxLength={120} />
          </label>
          <label className="field">
            <span>Descripción</span>
            <textarea rows={2} value={form.description} onChange={update("description")} required minLength={5} maxLength={300} />
          </label>
          <div className="field-row">
            <label className="field">
              <span>Categoría</span>
              <select value={form.category} onChange={update("category")}>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>{category.name}</option>
                ))}
              </select>
            </label>
            <label className="field">
              <span>Estado</span>
              <select value={form.status} onChange={update("status")}>
                {Object.entries(STATUS).map(([value, item]) => <option key={value} value={value}>{item.label}</option>)}
              </select>
            </label>
          </div>
          <label className="field">
            <span>Teléfono</span>
            <input value={form.phone} onChange={update("phone")} placeholder="Opcional" />
          </label>

          <div className="unit-card__actions">
            <button className="btn btn--sm btn--primary" disabled={busy}>{busy ? "Guardando…" : "Guardar"}</button>
            <button type="button" className="btn btn--sm btn--ghost" onClick={() => setMode("view")}>Cancelar</button>
          </div>
        </form>
      )}

      {mode === "confirm" && (
        <div className="confirm">
          <p>¿Eliminar <strong>{unit.name}</strong> de forma permanente?</p>
          <div className="unit-card__actions">
            <button className="btn btn--sm btn--danger" onClick={handleDelete} disabled={busy}>
              {busy ? "Eliminando…" : "Sí, eliminar"}
            </button>
            <button className="btn btn--sm btn--ghost" onClick={() => setMode("view")}>No</button>
          </div>
        </div>
      )}
    </div>
  );
}
