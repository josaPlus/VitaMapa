"use strict";

require("dotenv").config();

const express = require("express");
const cors = require("cors");

const corsOptions = require("./config/cors");
const routerApi = require("./routes");
const { notFoundHandler, logErrors, errorHandler } = require("./middlewares/error.handler");

const app = express();

app.use(cors(corsOptions));

// procesar JSON (máximo 200kb: las zonas pueden traer varios vértices)
app.use(express.json({ limit: "200kb" }));

// log sencillo de cada petición
app.use((req, res, next) => {
    const start = Date.now();

    res.on("finish", () => {
        console.log(`${req.method} ${req.originalUrl} ${res.statusCode} - ${Date.now() - start}ms`);
    });

    next();
});

app.get("/", (req, res) => {
    res.status(200).json({
        name: "VitaMapa API · Red georreferenciada de atención médica",
        version: "1.0.0",
        endpoints: {
            health: "/api/health",
            auth: "/api/auth (register, login, me)",
            locations: "/api/locations",
            locationsGeojson: "/api/locations/geojson",
            nearby: "/api/locations/nearby?lat=&lng=",
            zones: "/api/zones",
            coverage: "/api/zones/coverage",
            categories: "/api/categories",
            specialties: "/api/specialties",
            doctors: "/api/doctors"
        }
    });
});

app.get("/api/health", (req, res) => {
    res.status(200).json({
        status: "ok",
        message: "El servidor está corriendo correctamente",
        timestamp: new Date().toISOString()
    });
});

routerApi(app);

app.use(notFoundHandler);
app.use(logErrors);
app.use(errorHandler);

module.exports = app;
