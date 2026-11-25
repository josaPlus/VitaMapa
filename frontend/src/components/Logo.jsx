// Marca: cruz médica dentro de un anillo de "radar"
export default function Logo({ compact = false }) {
  return (
    <div className="logo">
      <span className="logo__mark" aria-hidden>
        <svg viewBox="0 0 32 32" width="30" height="30">
          <circle cx="16" cy="16" r="14" fill="none" stroke="currentColor" strokeWidth="1.5" opacity="0.45" />
          <circle cx="16" cy="16" r="9" fill="none" stroke="currentColor" strokeWidth="1.5" opacity="0.7" />
          <path d="M14 10h4v4h4v4h-4v4h-4v-4h-4v-4h4z" fill="currentColor" />
        </svg>
      </span>
      {!compact && (
        <span className="logo__word">
          vita<b>mapa</b>
        </span>
      )}
    </div>
  );
}
