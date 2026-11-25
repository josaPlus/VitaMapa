import { useEffect, useState } from "react";
import { api } from "../api/client";
import CrudSection from "../components/catalogs/CrudSection.jsx";
import { AREAS, SHIFTS } from "../utils/format";

const TABS = [
  { id: "categories", label: "Categorías", note: "Tipos de unidad de salud. Cada ubicación del mapa referencia una categoría." },
  { id: "specialties", label: "Especialidades", note: "Especialidades médicas que ofrece la red." },
  { id: "doctors", label: "Médicos", note: "Personal médico: referencia a una especialidad y a la unidad donde atiende." }
];

function CategoriesCrud() {
  return (
    <CrudSection
      title="Categorías"
      singular="Categoría"
      ending="a"
      endpoint="/categories"
      describe={(item) => item.name}
      toForm={(item) => ({ name: item.name, color: item.color, description: item.description })}
      fields={[
        { name: "name", label: "Nombre", required: true, placeholder: "Hospital" },
        { name: "color", label: "Color del marcador", type: "color", required: true, defaultValue: "#3EE6C1" },
        { name: "description", label: "Descripción", type: "textarea" }
      ]}
      columns={[
        { label: "Categoría", render: (item) => <span className="chip-static" style={{ "--cat": item.color }}>{item.name}</span> },
        { label: "Color", render: (item) => <span className="mono small">{item.color}</span> },
        { label: "Descripción", render: (item) => item.description || "—" },
        { label: "Ubicaciones", render: (item) => <span className="mono">{item.locationsCount}</span> }
      ]}
    />
  );
}

function SpecialtiesCrud() {
  return (
    <CrudSection
      title="Especialidades"
      singular="Especialidad"
      ending="a"
      endpoint="/specialties"
      describe={(item) => item.name}
      toForm={(item) => ({ name: item.name, area: item.area, description: item.description })}
      fields={[
        { name: "name", label: "Nombre", required: true, placeholder: "Pediatría" },
        {
          name: "area", label: "Área", type: "select", required: true, defaultValue: "consulta",
          options: Object.entries(AREAS).map(([value, label]) => ({ value, label }))
        },
        { name: "description", label: "Descripción", type: "textarea" }
      ]}
      columns={[
        { label: "Especialidad", render: (item) => <strong>{item.name}</strong> },
        { label: "Área", render: (item) => <span className="badge badge--soft">{AREAS[item.area]}</span> },
        { label: "Descripción", render: (item) => item.description || "—" },
        { label: "Médicos", render: (item) => <span className="mono">{item.doctorsCount}</span> }
      ]}
    />
  );
}

function DoctorsCrud() {
  const [specialties, setSpecialties] = useState([]);
  const [units, setUnits] = useState([]);

  // opciones de los <select> de relaciones (especialidad y unidad)
  useEffect(() => {
    api.get("/specialties").then(({ data }) => setSpecialties(data)).catch(() => {});
    api.get("/locations").then(({ data }) => setUnits(data)).catch(() => {});
  }, []);

  return (
    <CrudSection
      title="Médicos"
      singular="Médico"
      endpoint="/doctors"
      describe={(item) => item.fullName}
      toForm={(item) => ({
        fullName: item.fullName,
        license: item.license,
        shift: item.shift,
        phone: item.phone,
        specialty: item.specialty?.id || "",
        unit: item.unit?.id || ""
      })}
      fields={[
        { name: "fullName", label: "Nombre completo", required: true, placeholder: "Dra. Ana Torres" },
        { name: "license", label: "Cédula profesional", required: true, placeholder: "12345678" },
        {
          name: "specialty", label: "Especialidad", type: "select", required: true,
          options: specialties.map((item) => ({ value: item.id, label: item.name }))
        },
        {
          name: "unit", label: "Unidad donde atiende", type: "select",
          options: units.map((item) => ({ value: item.id, label: item.name }))
        },
        {
          name: "shift", label: "Turno", type: "select", required: true, defaultValue: "matutino",
          options: Object.entries(SHIFTS).map(([value, label]) => ({ value, label }))
        },
        { name: "phone", label: "Teléfono" }
      ]}
      columns={[
        { label: "Médico", render: (item) => <strong>{item.fullName}</strong> },
        { label: "Cédula", render: (item) => <span className="mono">{item.license}</span> },
        { label: "Especialidad", render: (item) => item.specialty?.name || "—" },
        { label: "Unidad", render: (item) => item.unit?.name || <span className="muted">Sin asignar</span> },
        { label: "Turno", render: (item) => <span className="badge badge--soft">{SHIFTS[item.shift]}</span> }
      ]}
    />
  );
}

export default function CatalogsPage() {
  const [tab, setTab] = useState("categories");
  const current = TABS.find((item) => item.id === tab);

  return (
    <div className="catalogs">
      <section className="page-head">
        <div>
          <span className="kicker">Catálogos de la red</span>
          <h1>Administración</h1>
          <p className="muted">{current.note}</p>
        </div>
      </section>

      <div className="tabs" role="tablist">
        {TABS.map((item) => (
          <button key={item.id} role="tab" aria-selected={tab === item.id}
            className={`tab ${tab === item.id ? "is-active" : ""}`} onClick={() => setTab(item.id)}>
            {item.label}
          </button>
        ))}
      </div>

      {tab === "categories" && <CategoriesCrud />}
      {tab === "specialties" && <SpecialtiesCrud />}
      {tab === "doctors" && <DoctorsCrud />}
    </div>
  );
}
