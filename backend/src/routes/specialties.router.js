"use strict";

const express = require("express");

const SpecialtiesService = require("../services/specialties.service");
const {
    validateSpecialtyCreate,
    validateSpecialtyUpdate,
    validateSpecialtyQuery
} = require("../middlewares/specialty.validator");

const router = express.Router();
const service = new SpecialtiesService();

router.get("/", validateSpecialtyQuery, async (req, res) => {
    const specialties = await service.getAll({ search: req.query.search, area: req.query.area });

    res.status(200).json({ count: specialties.length, data: specialties });
});

router.get("/:id", async (req, res) => {
    const specialty = await service.getById(req.params.id);

    res.status(200).json({ data: specialty });
});

router.post("/", validateSpecialtyCreate, async (req, res) => {
    const specialty = await service.create(req.body);

    res.status(201).json({ message: "Especialidad creada", data: specialty });
});

router.patch("/:id", validateSpecialtyUpdate, async (req, res) => {
    const specialty = await service.update(req.params.id, req.body);

    res.status(200).json({ message: "Especialidad actualizada", data: specialty });
});

router.delete("/:id", async (req, res) => {
    const specialty = await service.remove(req.params.id);

    res.status(200).json({ message: "Especialidad eliminada", data: specialty });
});

module.exports = router;
