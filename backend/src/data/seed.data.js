"use strict";

// Datos de ejemplo (ficticios) ubicados en León, Guanajuato.

// Usuario de prueba para revisión. Puedes cambiarlo antes de correr el seed.
const demoUser = {
    name: "Revisor VitaMapa",
    email: "revisor@vitamapa.mx",
    password: "Vita2026"
};

const categories = [
    { name: "Hospital", color: "#E4572E", description: "Hospitales generales y de especialidad" },
    { name: "Centro de salud", color: "#2E8B57", description: "Atención primaria y medicina familiar" },
    { name: "Farmacia", color: "#3D5AFE", description: "Farmacias con servicio al público" },
    { name: "Laboratorio", color: "#8E44AD", description: "Análisis clínicos y toma de muestras" },
    { name: "Vacunación", color: "#E0A100", description: "Módulos y campañas de vacunación" },
    { name: "Urgencias", color: "#C2185B", description: "Bases de ambulancias y urgencias" }
];

const specialties = [
    { name: "Medicina general", area: "consulta", description: "Primer contacto y referencia" },
    { name: "Pediatría", area: "consulta", description: "Atención de niñas, niños y adolescentes" },
    { name: "Ginecología", area: "consulta", description: "Salud de la mujer y control prenatal" },
    { name: "Cardiología", area: "diagnostico", description: "Corazón y sistema circulatorio" },
    { name: "Urgencias médicas", area: "urgencias", description: "Atención inmediata de emergencias" },
    { name: "Traumatología", area: "quirurgica", description: "Lesiones de huesos y articulaciones" },
    { name: "Radiología", area: "diagnostico", description: "Rayos X, ultrasonido y tomografía" }
];

const locations = [
    { name: "Hospital General Zona Centro", category: "Hospital", status: "disponible", phone: "477 710 2000", lat: 21.1235, lng: -101.6800, description: "Hospital de segundo nivel con urgencias 24 h y 120 camas." },
    { name: "Hospital Regional Norte", category: "Hospital", status: "saturada", phone: "477 788 1500", lat: 21.1530, lng: -101.6900, description: "Alta demanda en urgencias; se sugiere acudir a otra unidad." },
    { name: "Clínica Familiar Las Joyas", category: "Centro de salud", status: "disponible", phone: "477 101 2233", lat: 21.0960, lng: -101.7240, description: "Medicina familiar, control de diabetes e hipertensión." },
    { name: "Centro de Salud San Juan Bosco", category: "Centro de salud", status: "disponible", phone: "477 713 4455", lat: 21.1380, lng: -101.7020, description: "Consulta externa, planificación familiar y nutrición." },
    { name: "Centro de Salud Valle Sur", category: "Centro de salud", status: "cerrada", phone: "", lat: 21.1000, lng: -101.6680, description: "Cerrado temporalmente por remodelación del edificio." },
    { name: "Centro de Salud Oriente", category: "Centro de salud", status: "disponible", phone: "477 770 9080", lat: 21.1300, lng: -101.6400, description: "Atención primaria para colonias del oriente de la ciudad." },
    { name: "Farmacia 24 h Madero", category: "Farmacia", status: "disponible", phone: "477 714 0024", lat: 21.1225, lng: -101.6745, description: "Abierta las 24 horas, consultorio adyacente." },
    { name: "Farmacia El Coecillo", category: "Farmacia", status: "disponible", phone: "477 716 3311", lat: 21.1290, lng: -101.6690, description: "Medicamento genérico y toma de presión gratuita." },
    { name: "Laboratorio Clínico Campestre", category: "Laboratorio", status: "disponible", phone: "477 779 5566", lat: 21.1480, lng: -101.7080, description: "Química sanguínea, biometría y pruebas rápidas." },
    { name: "Laboratorio Plaza Norte", category: "Laboratorio", status: "saturada", phone: "477 761 4400", lat: 21.1610, lng: -101.6820, description: "Toma de muestras de 7 a 11 h, alta afluencia." },
    { name: "Módulo de Vacunación Metropolitano", category: "Vacunación", status: "disponible", phone: "", lat: 21.1720, lng: -101.6620, description: "Influenza, COVID-19 y esquema infantil completo." },
    { name: "Puesto de Vacunación Delta", category: "Vacunación", status: "disponible", phone: "", lat: 21.0890, lng: -101.6450, description: "Campaña temporal de vacunación contra sarampión." },
    { name: "Base de Urgencias Oriente", category: "Urgencias", status: "disponible", phone: "911", lat: 21.1150, lng: -101.6560, description: "Base de ambulancias con dos unidades de soporte vital." },
    { name: "Unidad de Urgencias Poniente", category: "Urgencias", status: "disponible", phone: "911", lat: 21.1180, lng: -101.7200, description: "Estabilización y traslado a hospitales de la zona." }
];

// vértices en [longitud, latitud]; el seed cierra el anillo
const zones = [
    {
        name: "Sector Centro",
        risk: "medio",
        notes: "Alta concentración de población flotante",
        ring: [[-101.695, 21.135], [-101.660, 21.135], [-101.660, 21.110], [-101.695, 21.110]]
    },
    {
        name: "Sector Norte · brote de dengue",
        risk: "alto",
        notes: "Vigilancia epidemiológica activa",
        ring: [[-101.720, 21.178], [-101.650, 21.178], [-101.650, 21.142], [-101.720, 21.142]]
    },
    {
        name: "Sector Sur-Poniente",
        risk: "bajo",
        notes: "Cobertura de primer nivel suficiente",
        ring: [[-101.742, 21.112], [-101.700, 21.112], [-101.692, 21.084], [-101.742, 21.084]]
    }
];

const doctors = [
    { fullName: "Dra. Mariana López Arredondo", license: "10458721", shift: "matutino", phone: "477 100 2001", specialty: "Pediatría", unit: "Hospital General Zona Centro" },
    { fullName: "Dr. Jorge Ramírez Salinas", license: "9876543", shift: "nocturno", phone: "477 100 2002", specialty: "Urgencias médicas", unit: "Hospital General Zona Centro" },
    { fullName: "Dra. Fernanda Ortiz Medina", license: "11223344", shift: "vespertino", phone: "", specialty: "Ginecología", unit: "Hospital Regional Norte" },
    { fullName: "Dr. Luis Hernández Pardo", license: "8765432", shift: "matutino", phone: "477 100 2004", specialty: "Medicina general", unit: "Clínica Familiar Las Joyas" },
    { fullName: "Dra. Andrea Castillo Ruiz", license: "12345678", shift: "matutino", phone: "", specialty: "Medicina general", unit: "Centro de Salud San Juan Bosco" },
    { fullName: "Dr. Ricardo Vega Torres", license: "13579246", shift: "fin_de_semana", phone: "477 100 2006", specialty: "Traumatología", unit: "Hospital Regional Norte" },
    { fullName: "Dra. Paola Núñez Esquivel", license: "24681357", shift: "vespertino", phone: "", specialty: "Radiología", unit: "Laboratorio Clínico Campestre" },
    { fullName: "Dr. Héctor Morales Gil", license: "7654321", shift: "matutino", phone: "477 100 2008", specialty: "Cardiología", unit: null }
];

module.exports = { demoUser, categories, specialties, locations, zones, doctors };
