import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { useToast } from "../context/ToastContext.jsx";
import Logo from "./Logo.jsx";

const LINKS = [
  { to: "/mapa", label: "Mapa operativo" },
  { to: "/catalogos", label: "Catálogos" },
  { to: "/cobertura", label: "Cobertura" }
];

function initials(name = "") {
  return name.split(" ").filter(Boolean).slice(0, 2).map((part) => part[0].toUpperCase()).join("");
}

export default function AppShell() {
  const { user, logout } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    toast.info("Sesión cerrada", "¡Hasta pronto!");
    navigate("/acceso");
  }

  return (
    <div className="shell">
      <header className="topbar">
        <Logo />

        <nav className="topbar__nav" aria-label="Secciones">
          {LINKS.map((link) => (
            <NavLink key={link.to} to={link.to} className={({ isActive }) => `navlink ${isActive ? "is-active" : ""}`}>
              {link.label}
            </NavLink>
          ))}
        </nav>

        <div className="topbar__user">
          <span className="topbar__status"><i /> En línea</span>
          <span className="avatar" title={user?.email}>{initials(user?.name)}</span>
          <span className="topbar__name">{user?.name}</span>
          <button className="btn btn--xs btn--ghost" onClick={handleLogout}>Salir</button>
        </div>
      </header>

      <main className="shell__main">
        <Outlet />
      </main>
    </div>
  );
}
