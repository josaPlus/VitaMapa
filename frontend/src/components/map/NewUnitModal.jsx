import { useState } from "react";
import Modal from "../Modal.jsx";
import { STATUS } from "../../utils/format";

export default function NewUnitModal({ point, categories, onCancel, onCreate }) {
  const [form, setForm] = useState({
    name: "",
    description: "",
    category: categories[0]?.id || "",
    status: "disponible",
    phone: "",
    latitude: point.lat.toFixed(6),
    longitude: point.lng.toFixed(6)
  });
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  function update(field) {
    return (event) => setForm((current) => ({ ...current, [field]: event.target.value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setBusy(true);
    setError(null);

    try {
      await onCreate({
        ...form,
        latitude: Number(form.latitude),
        longitude: Number(form.longitude)
      });
    } catch (err) {
      setError(err);
      setBusy(false);
    }
  }

  return (
    <Modal kicker="Nuevo registro" title="Registrar unidad de salud" onClose={onCancel}>
      {error && (
        <div className="alert alert--error">
          <strong>{error.message}</strong>
          {Array.isArray(error.details) && <ul>{error.details.map((d) => <li key={d}>{d}</li>)}</ul>}
        </div>
      )}

      {categories.length === 0 && (
        <div className="alert alert--warn">Primero crea al menos una categoría en <strong>Catálogos</strong>.</div>
      )}

      <form className="form" onSubmit={handleSubmit}>
        <label className="field">
          <span>Nombre</span>
          <input autoFocus value={form.name} onChange={update("name")} placeholder="Centro de Salud Las Américas" required minLength={3} maxLength={120} />
        </label>

        <label className="field">
          <span>Descripción</span>
          <textarea rows={3} value={form.description} onChange={update("description")}
            placeholder="Servicios, horario, observaciones…" required minLength={5} maxLength={300} />
        </label>

        <div className="field-row">
          <label className="field">
            <span>Categoría</span>
            <select value={form.category} onChange={update("category")} required>
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
          <span>Teléfono <em>(opcional)</em></span>
          <input value={form.phone} onChange={update("phone")} placeholder="477 000 0000" />
        </label>

        <div className="field-row">
          <label className="field">
            <span>Latitud</span>
            <input className="mono" value={form.latitude} onChange={update("latitude")} required />
          </label>
          <label className="field">
            <span>Longitud</span>
            <input className="mono" value={form.longitude} onChange={update("longitude")} required />
          </label>
        </div>

        <div className="modal__actions">
          <button type="button" className="btn btn--ghost" onClick={onCancel}>Cancelar</button>
          <button className="btn btn--primary" disabled={busy || categories.length === 0}>
            {busy ? "Guardando…" : "Guardar ubicación"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
