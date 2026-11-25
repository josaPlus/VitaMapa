import { useState } from "react";
import Modal from "../Modal.jsx";
import { RISK } from "../../utils/format";

/**
 * Formulario de zona con dos modos:
 *  - crear:  recibe "coordinates" (el polígono recién dibujado)
 *  - editar: recibe "zone" (la zona guardada) y solo cambia nombre, riesgo y notas
 */
export default function ZoneModal({ zone = null, coordinates = null, onCancel, onSubmit }) {
  const editing = Boolean(zone);

  const initial = {
    name: zone?.name || "",
    risk: zone?.risk || "bajo",
    notes: zone?.notes || ""
  };

  const [form, setForm] = useState(initial);
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
      if (editing) {
        // PATCH: solo se mandan los campos que cambiaron
        const changes = Object.fromEntries(
          Object.entries(form).filter(([key, value]) => value !== initial[key])
        );

        if (Object.keys(changes).length === 0) {
          onCancel();
          return;
        }

        await onSubmit(zone.id, changes);
      } else {
        await onSubmit({ ...form, coordinates });
      }
    } catch (err) {
      setError(err);
      setBusy(false);
    }
  }

  return (
    <Modal
      kicker={editing ? "Zona sanitaria" : "Nueva zona"}
      title={editing ? "Editar zona" : "Nombrar zona"}
      onClose={onCancel}
    >
      {error && (
        <div className="alert alert--error">
          <strong>{error.message}</strong>
          {Array.isArray(error.details) && <ul>{error.details.map((d) => <li key={d}>{d}</li>)}</ul>}
        </div>
      )}

      <form className="form" onSubmit={handleSubmit}>
        <label className="field">
          <span>Nombre de la zona</span>
          <input autoFocus value={form.name} onChange={update("name")} placeholder="Sector Oriente · campaña de vacunación" required minLength={3} maxLength={80} />
        </label>

        <fieldset className="field">
          <span>Nivel de riesgo sanitario</span>
          <div className="risk-picker">
            {Object.entries(RISK).map(([value, item]) => (
              <label key={value} className={`risk-option ${form.risk === value ? "is-active" : ""}`} style={{ "--risk": item.color }}>
                <input type="radio" name="risk" value={value} checked={form.risk === value} onChange={update("risk")} />
                {item.label}
              </label>
            ))}
          </div>
        </fieldset>

        <label className="field">
          <span>Notas / descripción <em>(opcional)</em></span>
          <textarea rows={3} value={form.notes} onChange={update("notes")} maxLength={200} placeholder="Motivo, campaña, observaciones" />
        </label>

        <div className="modal__actions">
          <button type="button" className="btn btn--ghost" onClick={onCancel}>
            {editing ? "Cancelar" : "Descartar trazo"}
          </button>
          <button className="btn btn--primary" disabled={busy}>
            {busy ? "Guardando…" : editing ? "Guardar cambios" : "Guardar zona"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
