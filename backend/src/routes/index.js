"use strict";

const express = require("express");

const { requireAuth } = require("../middlewares/auth.handler");

const authRouter = require("./auth.router");
const categoriesRouter = require("./categories.router");
const specialtiesRouter = require("./specialties.router");
const doctorsRouter = require("./doctors.router");
const locationsRouter = require("./locations.router");
const zonesRouter = require("./zones.router");

function routerApi(app) {
    const apiRouter = express.Router();

    app.use("/api", apiRouter);

    // pública: login y registro
    apiRouter.use("/auth", authRouter);

    // protegidas: requieren token de sesión
    apiRouter.use("/categories", requireAuth, categoriesRouter);
    apiRouter.use("/specialties", requireAuth, specialtiesRouter);
    apiRouter.use("/doctors", requireAuth, doctorsRouter);
    apiRouter.use("/locations", requireAuth, locationsRouter);
    apiRouter.use("/zones", requireAuth, zonesRouter);
}

module.exports = routerApi;
