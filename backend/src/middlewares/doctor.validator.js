"use strict";

const { buildPayloadValidator, buildQueryValidator } = require("../utils/validation");
const { ALLOWED_SHIFTS } = require("../models/doctor.model");

const PHONE_PATTERN = /^[0-9 +()-]{7,20}$/;

const doctorSchema = {
    fullName: { type: "string", required: true, min: 5, max: 100, label: "Nombre completo" },
    license: {
        type: "string", required: true, label: "Cédula",
        pattern: /^[0-9]{7,8}$/, patternMessage: "La cédula profesional debe tener 7 u 8 dígitos"
    },
    shift: { type: "enum", required: true, values: ALLOWED_SHIFTS, label: "Turno" },
    phone: {
        type: "string", label: "Teléfono",
        pattern: PHONE_PATTERN, patternMessage: "El teléfono solo puede tener dígitos, espacios y + ( ) -"
    },
    specialty: { type: "objectId", required: true, label: "Especialidad" },
    unit: { type: "objectId", label: "Unidad" }
};

module.exports = {
    validateDoctorCreate: buildPayloadValidator(doctorSchema),
    validateDoctorUpdate: buildPayloadValidator(doctorSchema, { partial: true }),
    validateDoctorQuery: buildQueryValidator({
        search: { type: "string", max: 60 },
        specialty: { type: "objectId", allowAll: true },
        unit: { type: "objectId", allowAll: true },
        shift: { type: "enum", values: ALLOWED_SHIFTS, allowAll: true }
    })
};
