"use strict";

const { buildPayloadValidator } = require("../utils/validation");

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

const registerSchema = {
    name: { type: "string", required: true, min: 3, max: 80, label: "Nombre" },
    email: {
        type: "string", required: true, max: 120, label: "Correo",
        pattern: EMAIL_PATTERN, patternMessage: "El correo no tiene un formato válido"
    },
    password: {
        type: "string", required: true, min: 8, max: 72, label: "Contraseña",
        validate(value) {
            if (!/[A-Za-z]/.test(value) || !/[0-9]/.test(value)) {
                return "La contraseña debe combinar letras y números";
            }
            return null;
        }
    }
};

const loginSchema = {
    email: {
        type: "string", required: true, label: "Correo",
        pattern: EMAIL_PATTERN, patternMessage: "El correo no tiene un formato válido"
    },
    password: { type: "string", required: true, label: "Contraseña" }
};

module.exports = {
    validateRegister: buildPayloadValidator(registerSchema),
    validateLogin: buildPayloadValidator(loginSchema)
};
