"use strict";

const mongoose = require("mongoose");

const AppError = require("./appError");

function isEmpty(value) {
    return value === undefined || value === null || (typeof value === "string" && value.trim() === "");
}

// Revisa un valor contra una regla. Regresa un mensaje de error o null si es válido.
function checkRule(rule, value, body) {
    const label = rule.label;

    switch (rule.type) {
        case "string": {
            if (typeof value !== "string") return `"${label}" debe ser texto`;

            const length = value.trim().length;

            if (rule.min && length < rule.min) return `"${label}" debe tener al menos ${rule.min} caracteres`;
            if (rule.max && length > rule.max) return `"${label}" no debe superar los ${rule.max} caracteres`;
            if (rule.pattern && !rule.pattern.test(value.trim())) {
                return rule.patternMessage || `"${label}" no tiene un formato válido`;
            }
            break;
        }
        case "enum": {
            if (!rule.values.includes(value)) return `"${label}" debe ser uno de: ${rule.values.join(", ")}`;
            break;
        }
        case "number": {
            const number = Number(value);

            if (!Number.isFinite(number)) return `"${label}" debe ser un número válido`;
            if (rule.integer && !Number.isInteger(number)) return `"${label}" debe ser un número entero`;
            if (rule.min !== undefined && number < rule.min) return `"${label}" debe ser mayor o igual a ${rule.min}`;
            if (rule.max !== undefined && number > rule.max) return `"${label}" debe ser menor o igual a ${rule.max}`;
            break;
        }
        case "objectId": {
            if (!mongoose.isValidObjectId(value)) return `"${label}" no es un id válido`;
            break;
        }
        case "custom":
            break;
        default:
            return `Regla desconocida para "${label}"`;
    }

    // validación extra opcional que define cada entidad
    return rule.validate ? rule.validate(value, body) : null;
}

/**
 * Crea un middleware que valida req.body con un "esquema" de reglas.
 *  - POST  (partial = false): todos los campos "required" son obligatorios.
 *  - PATCH (partial = true):  basta con un campo; los que vengan se validan.
 * Los campos que no están en el esquema se rechazan.
 */
function buildPayloadValidator(schema, { partial = false } = {}) {
    const fields = Object.keys(schema);

    return function payloadValidator(req, res, next) {
        const body = req.body || {};
        const errors = [];

        const unknownFields = Object.keys(body).filter((field) => !fields.includes(field));

        if (unknownFields.length > 0) {
            errors.push(`Campos no permitidos: ${unknownFields.join(", ")}`);
        }

        if (partial && !fields.some((field) => body[field] !== undefined)) {
            errors.push("Debes proporcionar al menos un campo para actualizar");
        }

        for (const field of fields) {
            const rule = { label: field, ...schema[field] };
            const value = body[field];

            if (isEmpty(value)) {
                const sent = value !== undefined;

                if (rule.required && (!partial || sent)) {
                    errors.push(`"${rule.label}" es obligatorio`);
                }
                continue;
            }

            const error = checkRule(rule, value, body);

            if (error) {
                errors.push(error);
            } else if (rule.type === "number") {
                body[field] = Number(value);
            } else if (rule.type === "string" && rule.lowercase) {
                body[field] = value.trim().toLowerCase();
            }
        }

        if (errors.length > 0) {
            return next(new AppError(400, "Los datos enviados no son válidos", errors));
        }

        next();
    };
}

// Valida parámetros de consulta (?search=&category=...)
function buildQueryValidator(schema) {
    return function queryValidator(req, res, next) {
        const errors = [];

        for (const [field, rawRule] of Object.entries(schema)) {
            const rule = { label: field, ...rawRule };
            const value = req.query[field];

            if (isEmpty(value)) {
                if (rule.required) errors.push(`El parámetro "${field}" es obligatorio`);
                continue;
            }

            if (Array.isArray(value)) {
                errors.push(`El parámetro "${field}" solo se puede enviar una vez`);
                continue;
            }

            if (rule.allowAll && value === "all") continue;

            const error = checkRule(rule, value, req.query);

            if (error) errors.push(error);
        }

        if (errors.length > 0) {
            return next(new AppError(400, "Los parámetros de consulta no son válidos", errors));
        }

        next();
    };
}

function assertObjectId(id, entityName) {
    if (!mongoose.isValidObjectId(id)) {
        throw new AppError(400, `El id de ${entityName} no es válido`);
    }
}

module.exports = {
    isEmpty,
    buildPayloadValidator,
    buildQueryValidator,
    assertObjectId
};
