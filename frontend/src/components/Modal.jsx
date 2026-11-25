import { useEffect } from "react";

export default function Modal({ title, kicker, onClose, children }) {
  // cerrar con Escape
  useEffect(() => {
    const handleKey = (event) => event.key === "Escape" && onClose();
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose]);

  return (
    <div className="modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section className="modal" role="dialog" aria-modal="true" aria-label={title}>
        <header className="modal__head">
          <div>
            {kicker && <span className="kicker">{kicker}</span>}
            <h2>{title}</h2>
          </div>
          <button className="btn btn--xs btn--ghost" onClick={onClose}>Cerrar</button>
        </header>
        {children}
      </section>
    </div>
  );
}
