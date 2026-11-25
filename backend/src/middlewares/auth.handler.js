"use strict";

const AppError = require("../utils/appError");
const { verifyToken } = require("../utils/token");

// Protege las rutas internas: exige "Authorization: Bearer <token>"
function requireAuth(req, res, next) {
    const header = req.headers.authorization || "";
    const [scheme, token] = header.split(" ");

    if (scheme !== "Bearer" || !token) {
        return next(new AppError(401, "Debes iniciar sesión para continuar"));
    }

    try {
        const payload = verifyToken(token);

        // queda disponible para las rutas (por ejemplo, para guardar createdBy)
        req.user = { id: payload.sub, name: payload.name, email: payload.email };

        next();
    } catch (error) {
        next(new AppError(401, "Tu sesión expiró o no es válida, vuelve a iniciar sesión"));
    }
}

module.exports = { requireAuth };
