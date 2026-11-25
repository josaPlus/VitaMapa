import { useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { useToast } from "../context/ToastContext.jsx";
import Logo from "../components/Logo.jsx";

const EMPTY = { name: "", email: "", password: "", confirm: "" };
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

// validación en el navegador (el backend vuelve a validar todo)
function validate(mode, form) {
  const errors = {};

  if (mode === "register" && form.name.trim().length < 3) errors.name = "Escribe al menos 3 caracteres";
  if (!EMAIL_PATTERN.test(form.email.trim())) errors.email = "Correo no válido";

  if (mode === "register") {
    if (form.password.length < 8) errors.password = "Mínimo 8 caracteres";
    else if (!/[A-Za-z]/.test(form.password) || !/[0-9]/.test(form.password)) errors.password = "Combina letras y números";
    if (form.confirm !== form.password) errors.confirm = "Las contraseñas no coinciden";
  } else if (!form.password) {
    errors.password = "Escribe tu contraseña";
  }

  return errors;
}

export default function AuthPage() {
  const { user, login, register } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const [mode, setMode] = useState("login");
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState(null);
  const [loading, setLoading] = useState(false);

  if (user) return <Navigate to={location.state?.from || "/mapa"} replace />;

  function switchMode(next) {
    setMode(next);
    setErrors({});
    setServerError(null);
    setForm((current) => ({ ...EMPTY, email: current.email }));
  }

  function update(field) {
    return (event) => setForm((current) => ({ ...current, [field]: event.target.value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setServerError(null);

    const found = validate(mode, form);
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    setLoading(true);

    try {
      const loggedUser = mode === "login"
        ? await login({ email: form.email.trim(), password: form.password })
        : await register({ name: form.name.trim(), email: form.email.trim(), password: form.password });

      toast.success(mode === "login" ? `Hola de nuevo, ${loggedUser.name}` : "Cuenta creada", "Ya puedes usar el mapa.");
      navigate(location.state?.from || "/mapa", { replace: true });
    } catch (error) {
      setServerError(error);
    } finally {
      setLoading(false);
    }
  }

  const isLogin = mode === "login";

  return (
    <div className="auth">
      {/* fondo decorativo: radar con unidades de salud */}
      <div className="radar" aria-hidden>
        <span className="radar__ring" /><span className="radar__ring" /><span className="radar__ring" />
        <span className="radar__sweep" />
        <span className="radar__blip" style={{ "--x": "6%", "--y": "12%", "--c": "#3EE6C1" }} />
        <span className="radar__blip" style={{ "--x": "90%", "--y": "10%", "--c": "#7CB7FF" }} />
        <span className="radar__blip" style={{ "--x": "93%", "--y": "84%", "--c": "#FFB547" }} />
        <span className="radar__blip" style={{ "--x": "5%", "--y": "80%", "--c": "#C79BFF" }} />
        <span className="radar__blip" style={{ "--x": "46%", "--y": "90%", "--c": "#FF6B7A" }} />
      </div>

      <div className="auth__layout">
        <header className="auth__intro">
          <Logo />
          <h1>Atención médica, <span>ubicada</span>.</h1>
          <p>
            Hospitales, centros de salud, farmacias y vacunación de León sobre un mapa vivo:
            marca zonas de riesgo y encuentra la unidad abierta más cercana a un paciente.
          </p>
          <ul className="auth__facts">
            <li><b>$geoNear</b> unidad más cercana</li>
            <li><b>$geoWithin</b> cobertura por zona</li>
            <li><b>2dsphere</b> índices geoespaciales</li>
          </ul>
        </header>

        <div className="auth__card">
          <div className="segmented" role="tablist">
            <button role="tab" aria-selected={isLogin} className={isLogin ? "is-active" : ""} onClick={() => switchMode("login")}>
              Iniciar sesión
            </button>
            <button role="tab" aria-selected={!isLogin} className={!isLogin ? "is-active" : ""} onClick={() => switchMode("register")}>
              Crear cuenta
            </button>
          </div>

          <h2 className="auth__title">{isLogin ? "Inicia sesión" : "Crea tu cuenta"}</h2>
          <p className="muted">
            {isLogin ? "Ingresa con el correo con el que te registraste." : "Tu contraseña se guarda cifrada, nunca en texto plano."}
          </p>

          {serverError && (
            <div className="alert alert--error" role="alert">
              <strong>{serverError.message}</strong>
              {Array.isArray(serverError.details) && (
                <ul>{serverError.details.map((detail) => <li key={detail}>{detail}</li>)}</ul>
              )}
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate className="form">
            {!isLogin && (
              <label className="field">
                <span>Nombre completo</span>
                <input value={form.name} onChange={update("name")} placeholder="Ana Martínez" autoComplete="name" />
                {errors.name && <small className="field__error">{errors.name}</small>}
              </label>
            )}

            <label className="field">
              <span>Correo electrónico</span>
              <input type="email" value={form.email} onChange={update("email")} placeholder="tu@correo.com" autoComplete="email" />
              {errors.email && <small className="field__error">{errors.email}</small>}
            </label>

            <label className="field">
              <span>Contraseña</span>
              <input type="password" value={form.password} onChange={update("password")}
                placeholder={isLogin ? "••••••••" : "Mínimo 8, letras y números"}
                autoComplete={isLogin ? "current-password" : "new-password"} />
              {errors.password && <small className="field__error">{errors.password}</small>}
            </label>

            {!isLogin && (
              <label className="field">
                <span>Confirmar contraseña</span>
                <input type="password" value={form.confirm} onChange={update("confirm")} autoComplete="new-password" />
                {errors.confirm && <small className="field__error">{errors.confirm}</small>}
              </label>
            )}

            <button className="btn btn--primary btn--block" disabled={loading}>
              {loading ? "Un momento…" : isLogin ? "Entrar al mapa" : "Crear mi cuenta"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
