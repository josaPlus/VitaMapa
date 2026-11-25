"use strict";

const { buildPayloadValidator, buildQueryValidator } = require("../utils/validation");

const categorySchema = {
    name: { type: "string", required: true, min: 3, max: 50, label: "Nombre" },
    description: { type: "string", max: 200, label: "Descripción" },
    color: {
        type: "string", required: true, label: "Color",
        pattern: /^#[0-9a-fA-F]{6}$/, patternMessage: "El color debe ser hexadecimal, por ejemplo #FF5A36"
    }
};

module.exports = {
    validateCategoryCreate: buildPayloadValidator(categorySchema),
    validateCategoryUpdate: buildPayloadValidator(categorySchema, { partial: true }),
    validateCategoryQuery: buildQueryValidator({ search: { type: "string", max: 60 } })
};
