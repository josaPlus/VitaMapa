import { Navigate, Route, Routes } from "react-router-dom";

import ProtectedRoute from "./components/ProtectedRoute.jsx";
import AppShell from "./components/AppShell.jsx";
import AuthPage from "./pages/AuthPage.jsx";
import MapPage from "./pages/MapPage.jsx";
import CatalogsPage from "./pages/CatalogsPage.jsx";
import CoveragePage from "./pages/CoveragePage.jsx";

export default function App() {
  return (
    <Routes>
      <Route path="/acceso" element={<AuthPage />} />

      {/* vistas internas: solo con sesión iniciada */}
      <Route element={<ProtectedRoute><AppShell /></ProtectedRoute>}>
        <Route path="/mapa" element={<MapPage />} />
        <Route path="/catalogos" element={<CatalogsPage />} />
        <Route path="/cobertura" element={<CoveragePage />} />
      </Route>

      <Route path="*" element={<Navigate to="/mapa" replace />} />
    </Routes>
  );
}
