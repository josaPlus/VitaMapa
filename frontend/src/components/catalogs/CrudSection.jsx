import { useCallback, useEffect, useState } from "react";
import { api } from "../../api/client";
import { useToast } from "../../context/ToastContext.jsx";
import Modal from "../Modal.jsx";

function emptyForm(fields) {
  return Object.fromEntries(fields.map((field) => [field.name, field.defaultValue ?? ""]));
}

/**
 * CRUD genérico (crear, listar, editar y eliminar) reutilizado por los 3 catálogos.
 *  - endpoint: ruta del backend, p. ej. "/categories"
 *  - fields:   campos del formulario
 *  - columns:  columnas de la tabla
 *  - toForm:   convierte un registro en valores del formulario (para editar)
 */
export default function CrudSection({ title, singular, ending = "o", endpoint, fields, columns, toForm, describe }) {
  const toast = useToast();

  const [items, setItems] = useState([]);
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState(null); // null = creando
  const [form, setForm] = useState(() => emptyForm(fields));
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  const [toDelete, setToDelete] = useState(null);

  const load = useCallback(async () => {
    try {
      const { data } = await api.get(endpoint, { search: search.trim() });
      setItems(data);
    } catch (err) {
      toast.error(`No se pudo cargar ${title.toLowerCase()}`, err);
    }
  }, [endpoint, search, title, toast]);

  useEffect(() => {
    const timer = setTimeout(load, 250);
    return () => clearTimeout(timer);
  }, [load]);

  function reset() {
    setEditing(null);
    setForm(emptyForm(fields));
    setError(null);
  }

  function startEdit(item) {
    setEditing(item);
    setForm({ ...emptyForm(fields), ...toForm(item) });
    setError(null);
  }

  function update(name) {
    return (event) => setForm((current) => ({ ...current, [name]: event.target.value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setBusy(true);
    setError(null);

    try {
      if (editing) {
        await api.patch(`${endpoint}/${editing.id}`, form);
        toast.success(`${singular} actualizad${ending}`);
      } else {
        await api.post(endpoint, form);
        toast.success(`${singular} cread${ending}`);
      }
      reset();
      await load();
    } catch (err) {
      setError(err);
    } finally {
      setBusy(false);
    }
  }

  async function confirmDelete() {
    try {
      await api.delete(`${endpoint}/${toDelete.id}`);
      toast.success(`${singular} eliminad${ending}`);
      if (editing?.id === toDelete.id) reset();
      setToDelete(null);
      await load();
    } catch (err) {
      setToDelete(null);
      toast.error("No se pudo eliminar", err);
    }
  }

  return (
    <div className="crud">
      <form className="crud__form card" onSubmit={handleSubmit}>
        <span className="kicker">{editing ? "Editando" : "Nuevo registro"}</span>
        <h3>{editing ? describe(editing) : `Agregar ${singular.toLowerCase()}`}</h3>

        {error && (
          <div className="alert alert--error alert--tight">
            <strong>{error.message}</strong>
            {Array.isArray(error.details) && <ul>{error.details.map((d) => <li key={d}>{d}</li>)}</ul>}
          </div>
        )}

        {fields.map((field) => (
          <label key={field.name} className="field">
            <span>{field.label}{!field.required && <em> (opcional)</em>}</span>

            {field.type === "select" && (
              <select value={form[field.name]} onChange={update(field.name)} required={field.required}>
                {!field.required && <option value="">— Ninguno —</option>}
                {field.required && <option value="" disabled>Selecciona…</option>}
                {field.options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
              </select>
            )}

            {field.type === "textarea" && (
              <textarea rows={2} value={form[field.name]} onChange={update(field.name)} placeholder={field.placeholder} />
            )}

            {field.type === "color" && (
              <span className="color-field">
                <input type="color" value={form[field.name] || "#000000"} onChange={update(field.name)} />
                <input className="mono" value={form[field.name]} onChange={update(field.name)} placeholder="#FF5A36" />
              </span>
            )}

            {(!field.type || field.type === "text") && (
              <input value={form[field.name]} onChange={update(field.name)} placeholder={field.placeholder} required={field.required} />
            )}
          </label>
        ))}

        <div className="crud__actions">
          <button className="btn btn--primary" disabled={busy}>{busy ? "Guardando…" : editing ? "Guardar cambios" : "Crear"}</button>
          {editing && <button type="button" className="btn btn--ghost" onClick={reset}>Cancelar</button>}
        </div>
      </form>

      <div className="crud__list card">
        <header className="crud__list-head">
          <h3>{title} <span className="mono muted">({items.length})</span></h3>
          <label className="search search--sm">
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar…" />
          </label>
        </header>

        <div className="ledger__scroll">
          <table className="table">
            <thead>
              <tr>
                {columns.map((column) => <th key={column.label}>{column.label}</th>)}
                <th aria-label="Acciones" />
              </tr>
            </thead>
            <tbody>
              {items.length === 0 && (
                <tr><td colSpan={columns.length + 1} className="table__empty">Sin registros.</td></tr>
              )}
              {items.map((item) => (
                <tr key={item.id} className={editing?.id === item.id ? "is-editing" : ""}>
                  {columns.map((column) => <td key={column.label}>{column.render(item)}</td>)}
                  <td className="table__actions">
                    <button className="btn btn--xs btn--ink" onClick={() => startEdit(item)}>Editar</button>
                    <button className="btn btn--xs btn--danger-ghost" onClick={() => setToDelete(item)}>Eliminar</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {toDelete && (
        <Modal kicker="Confirmar" title={`¿Eliminar ${singular.toLowerCase()}?`} onClose={() => setToDelete(null)}>
          <p>Se borrará <strong>{describe(toDelete)}</strong> de forma permanente.</p>
          <div className="modal__actions">
            <button className="btn btn--ghost" onClick={() => setToDelete(null)}>Cancelar</button>
            <button className="btn btn--danger" onClick={confirmDelete}>Sí, eliminar</button>
          </div>
        </Modal>
      )}
    </div>
  );
}
