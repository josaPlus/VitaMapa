"use strict";

const { buildPayloadValidator } = require("../utils/validation");
const { ALLOWED_RISKS } = require("../models/zone.model");

const isPosition = (point) =>
    Array.isArray(point) &&
    point.length === 2 &&
    Number.isFinite(Number(point[0])) && Number(point[0]) >= -180 && Number(point[0]) <= 180 &&
    Number.isFinite(Number(point[1])) && Number(point[1]) >= -90 && Number(point[1]) <= 90;

// coordinates = [[ [lng, lat], [lng, lat], ... ]]  (un anillo exterior)
function validatePolygon(coordinates) {
    if (!Array.isArray(coordinates) || coordinates.length !== 1 || !Array.isArray(coordinates[0])) {
        return "Las coordenadas deben tener la forma [[[longitud, latitud], ...]]";
    }

    const ring = coordinates[0];

    if (!ring.every(isPosition)) {
        return "Cada vértice debe ser [longitud, latitud] con valores dentro de rango";
    }

    const unique = new Set(ring.map(([lng, lat]) => `${lng},${lat}`));

    if (unique.size < 3) {
        return "Una zona necesita al menos 3 vértices distintos";
    }

    if (ring.length > 500) {
        return "La zona no puede tener más de 500 vértices";
    }

    return null;
}

const zoneSchema = {
    name: { type: "string", required: true, min: 3, max: 80, label: "Nombre" },
    risk: { type: "enum", values: ALLOWED_RISKS, label: "Nivel de riesgo" },
    notes: { type: "string", max: 200, label: "Notas" },
    coordinates: { type: "custom", required: true, label: "Coordenadas", validate: validatePolygon }
};

module.exports = {
    validateZoneCreate: buildPayloadValidator(zoneSchema),
    validateZoneUpdate: buildPayloadValidator(zoneSchema, { partial: true })
};
