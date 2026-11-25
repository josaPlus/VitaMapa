"use strict";

const express = require("express");

const ZonesService = require("../services/zones.service");
const { validateZoneCreate, validateZoneUpdate } = require("../middlewares/zone.validator");

const router = express.Router();
const service = new ZonesService();

router.get("/", async (req, res) => {
    const zones = await service.getAll();

    res.status(200).json({ count: zones.length, data: zones });
});

// GET /api/zones/coverage -> unidades de salud dentro de cada zona
router.get("/coverage", async (req, res) => {
    const coverage = await service.getCoverage();

    res.status(200).json({ count: coverage.length, data: coverage });
});

router.get("/:id", async (req, res) => {
    const zone = await service.getById(req.params.id);

    res.status(200).json({ data: zone });
});

router.post("/", validateZoneCreate, async (req, res) => {
    const zone = await service.create(req.body, req.user.id);

    res.status(201).json({ message: "Zona guardada", data: zone });
});

router.patch("/:id", validateZoneUpdate, async (req, res) => {
    const zone = await service.update(req.params.id, req.body);

    res.status(200).json({ message: "Zona actualizada", data: zone });
});

router.delete("/:id", async (req, res) => {
    const zone = await service.remove(req.params.id);

    res.status(200).json({ message: "Zona eliminada", data: zone });
});

module.exports = router;
