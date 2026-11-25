import { createContext, useCallback, useContext, useMemo, useState } from "react";

const ToastContext = createContext(null);

const ICONS = { success: "✓", error: "!", info: "i" };

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const dismiss = useCallback((id) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const push = useCallback((type, title, message = "", details = null) => {
    const id = crypto.randomUUID();
    setToasts((current) => [...current.slice(-3), { id, type, title, message, details }]);
    setTimeout(() => dismiss(id), type === "error" ? 7000 : 4000);
  }, [dismiss]);

  const toast = useMemo(() => ({
    success: (title, message) => push("success", title, message),
    info: (title, message) => push("info", title, message),
    // acepta un ApiError: muestra su mensaje y la lista de detalles de validación
    error: (title, error) => push(
      "error",
      title,
      typeof error === "string" ? error : error?.message,
      Array.isArray(error?.details) ? error.details : null
    )
  }), [push]);

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div className="toast-stack" role="status" aria-live="polite">
        {toasts.map((item) => (
          <div key={item.id} className={`toast toast--${item.type}`}>
            <span className="toast__icon">{ICONS[item.type]}</span>
            <div className="toast__body">
              <strong>{item.title}</strong>
              {item.message && <p>{item.message}</p>}
              {item.details && (
                <ul>{item.details.map((detail) => <li key={detail}>{detail}</li>)}</ul>
              )}
            </div>
            <button className="toast__close" onClick={() => dismiss(item.id)} aria-label="Cerrar">×</button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useToast() {
  return useContext(ToastContext);
}
