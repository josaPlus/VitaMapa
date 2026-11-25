"use strict";

const express = require("express");

const DoctorsService = require("../services/doctors.service");
const {
    validateDoctorCreate,
    validateDoctorUpdate,
    validateDoctorQuery
} = require("../middlewares/doctor.validator");

const router = express.Router();
const service = new DoctorsService();

router.get("/", validateDoctorQuery, async (req, res) => {
    const doctors = await service.getAll({
        search: req.query.search,
        specialty: req.query.specialty,
        unit: req.query.unit,
        shift: req.query.shift
    });

    res.status(200).json({ count: doctors.length, data: doctors });
});

router.get("/:id", async (req, res) => {
    const doctor = await service.getById(req.params.id);

    res.status(200).json({ data: doctor });
});

router.post("/", validateDoctorCreate, async (req, res) => {
    const doctor = await service.create(req.body);

    res.status(201).json({ message: "Médico registrado", data: doctor });
});

router.patch("/:id", validateDoctorUpdate, async (req, res) => {
    const doctor = await service.update(req.params.id, req.body);

    res.status(200).json({ message: "Médico actualizado", data: doctor });
});

router.delete("/:id", async (req, res) => {
    const doctor = await service.remove(req.params.id);

    res.status(200).json({ message: "Médico eliminado", data: doctor });
});

module.exports = router;
