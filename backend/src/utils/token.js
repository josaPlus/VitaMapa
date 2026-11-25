"use strict";

const jwt = require("jsonwebtoken");

function getSecret() {
    const secret = process.env.JWT_SECRET;

    if (!secret) {
        throw new Error("falta la variable de entorno JWT_SECRET");
    }

    return secret;
}

// el token guarda el id del usuario (sub) y datos básicos para mostrar
function signToken(user) {
    return jwt.sign(
        { sub: user.id, name: user.name, email: user.email },
        getSecret(),
        { expiresIn: process.env.JWT_EXPIRES_IN || "8h" }
    );
}

function verifyToken(token) {
    return jwt.verify(token, getSecret());
}

module.exports = { signToken, verifyToken };
