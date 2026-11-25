"use strict";

const { buildPayloadValidator, buildQueryValidator } = require("../utils/validation");
const { ALLOWED_AREAS } = require("../models/specialty.model");

const specialtySchema = {
    name: { type: "string", required: true, min: 3, max: 60, label: "Nombre" },
    area: { type: "enum", required: true, values: ALLOWED_AREAS, label: "Área" },
    description: { type: "string", max: 200, label: "Descripción" }
};

module.exports = {
    validateSpecialtyCreate: buildPayloadValidator(specialtySchema),
    validateSpecialtyUpdate: buildPayloadValidator(specialtySchema, { partial: true }),
    validateSpecialtyQuery: buildQueryValidator({
        search: { type: "string", max: 60 },
        area: { type: "enum", values: ALLOWED_AREAS, allowAll: true }
    })
};
