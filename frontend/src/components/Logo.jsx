// Marca: letra "V" en un recuadro + nombre de la app
export default function Logo({ compact = false }) {
  return (
    <div className="logo">
      <span className="logo__mark" aria-hidden>V</span>
      {!compact && (
        <span className="logo__word">
          vita<b>mapa</b>
        </span>
      )}
    </div>
  );
}
