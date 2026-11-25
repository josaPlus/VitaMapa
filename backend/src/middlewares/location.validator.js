"use strict";

const { buildPayloadValidator, buildQueryValidator } = require("../utils/validation");
const { ALLOWED_STATUSES } = require("../models/location.model");

const locationSchema = {
    name: { type: "string", required: true, min: 3, max: 120, label: "Nombre" },
    description: { type: "string", required: true, min: 5, max: 300, label: "Descripción" },
    category: { type: "objectId", required: true, label: "Categoría" },
    status: { type: "enum", values: ALLOWED_STATUSES, label: "Estado" },
    phone: {
        type: "string", label: "Teléfono",
        pattern: /^[0-9 +()-]{7,20}$/, patternMessage: "El teléfono solo puede tener dígitos, espacios y + ( ) -"
    },
    latitude: { type: "number", required: true, min: -90, max: 90, label: "Latitud" },
    longitude: { type: "number", required: true, min: -180, max: 180, label: "Longitud" }
};

module.exports = {
    validateLocationCreate: buildPayloadValidator(locationSchema),
    validateLocationUpdate: buildPayloadValidator(locationSchema, { partial: true }),

    // ?search=&category=&status=&zone=
    validateLocationQuery: buildQueryValidator({
        search: { type: "string", max: 80 },
        category: { type: "objectId", allowAll: true },
        status: { type: "enum", values: ALLOWED_STATUSES, allowAll: true },
        zone: { type: "objectId", allowAll: true }
    }),

    // ?lat=&lng=&limit=
    validateNearbyQuery: buildQueryValidator({
        lat: { type: "number", required: true, min: -90, max: 90 },
        lng: { type: "number", required: true, min: -180, max: 180 },
        limit: { type: "number", integer: true, min: 1, max: 10 },
        includeClosed: { type: "enum", values: ["true", "false"] }
    })
};
