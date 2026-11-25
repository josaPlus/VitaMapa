"use strict";

const AppError = require("../utils/appError");

const allowedOrigins = (process.env.FRONTEND_ORIGINS || "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

const corsOptions = {
    origin(origin, callback) {
        // Postman, REST Client y curl no siempre envían ORIGIN
        if (!origin || allowedOrigins.length === 0 || allowedOrigins.includes(origin)) {
            return callback(null, true);
        }

        return callback(new AppError(403, `El origen ${origin} no está permitido`));
    }
};

module.exports = corsOptions;
