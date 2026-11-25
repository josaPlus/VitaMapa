"use strict";

const AppError = require("../utils/appError");

// 404: ninguna ruta coincidió
function notFoundHandler(req, res, next) {
    next(new AppError(404, `No existe la ruta ${req.method} ${req.originalUrl}`));
}

// registra el error en consola (solo los inesperados muestran el stack)
function logErrors(err, req, res, next) {
    const status = err.statusCode || 500;

    console.error(`\n[ERROR ${status}] ${new Date().toISOString()} ${req.method} ${req.originalUrl}`);
    console.error("mensaje:", err.message);

    if (status >= 500 && err.stack) {
        console.error(err.stack);
    }

    next(err);
}

function sendError(res, req, statusCode, message, details = null) {
    return res.status(statusCode).json({
        error: statusCode,
        message,
        details,
        path: req.originalUrl,
        timestamp: new Date().toISOString()
    });
}

// respuesta final y centralizada de errores
function errorHandler(err, req, res, next) {
    if (res.headersSent) {
        return next(err);
    }

    // JSON mal escrito en el body
    if (err instanceof SyntaxError && err.status === 400 && "body" in err) {
        return sendError(res, req, 400, "El JSON enviado está mal escrito");
    }

    // validación de mongoose (enum, min, max, required...)
    if (err.name === "ValidationError") {
        return sendError(res, req, 400, "Los datos enviados no son válidos",
            Object.values(err.errors).map((error) => error.message));
    }

    // id con formato incorrecto en una consulta
    if (err.name === "CastError") {
        return sendError(res, req, 400, `El valor "${err.value}" no es válido para ${err.path}`);
    }

    // índice único duplicado (correo, cédula, nombre de categoría...)
    if (err.code === 11000) {
        const field = Object.keys(err.keyValue || {})[0] || "campo";
        return sendError(res, req, 400, `Ya existe un registro con ese valor de "${field}"`);
    }

    // MongoDB rechaza polígonos que se cruzan a sí mismos o geometría inválida
    if (err.code === 16755 || /Can't extract geo keys|Loop is not valid/i.test(err.message || "")) {
        return sendError(res, req, 400, "La geometría no es válida (revisa que el polígono no se cruce consigo mismo)");
    }

    const statusCode = err.statusCode || 500;
    const message = statusCode === 500 ? "Error interno del servidor" : err.message;

    return sendError(res, req, statusCode, message, err.details || null);
}

module.exports = { notFoundHandler, logErrors, errorHandler };
