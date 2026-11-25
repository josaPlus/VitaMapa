import { useState } from "react";
import Modal from "../Modal.jsx";
import { RISK } from "../../utils/format";

export default function ZoneModal({ coordinates, onCancel, onCreate }) {
  const [form, setForm] = useState({ name: "", risk: "bajo", notes: "" });
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  // el anillo que entrega geoman ya viene cerrado (primer vértice = último)
  const vertices = coordinates[0].length - 1;

  function update(field) {
    return (event) => setForm((current) => ({ ...current, [field]: event.target.value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setBusy(true);
    setError(null);

    try {
      await onCreate({ ...form, coordinates });
    } catch (err) {
      setError(err);
      setBusy(false);
    }
  }

  return (
    <Modal kicker={`Polígono de ${vertices} vértices`} title="Nombrar zona" onClose={onCancel}>
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
          <span>Notas <em>(opcional)</em></span>
          <input value={form.notes} onChange={update("notes")} maxLength={200} placeholder="Motivo, campaña, observaciones" />
        </label>

        <div className="modal__actions">
          <button type="button" className="btn btn--ghost" onClick={onCancel}>Descartar trazo</button>
          <button className="btn btn--primary" disabled={busy}>{busy ? "Guardando…" : "Guardar zona"}</button>
        </div>
      </form>
    </Modal>
  );
}
