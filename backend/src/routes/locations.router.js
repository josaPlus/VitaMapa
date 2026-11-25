"use strict";

const express = require("express");

const LocationsService = require("../services/locations.service");
const {
    validateLocationCreate,
    validateLocationUpdate,
    validateLocationQuery,
    validateNearbyQuery
} = require("../middlewares/location.validator");

const router = express.Router();
const service = new LocationsService();

function readFilters(query) {
    return {
        search: query.search,
        category: query.category,
        status: query.status,
        zone: query.zone
    };
}

// GET /api/locations?search=&category=&status=&zone=
router.get("/", validateLocationQuery, async (req, res) => {
    const locations = await service.getAll(readFilters(req.query));

    res.status(200).json({ count: locations.length, data: locations });
});

router.get("/geojson", validateLocationQuery, async (req, res) => {
    const geojson = await service.getGeoJSON(readFilters(req.query));

    res.status(200).json(geojson);
});

// GET /api/locations/nearby?lat=&lng=&limit=
router.get("/nearby", validateNearbyQuery, async (req, res) => {
    const results = await service.getNearby({
        latitude: req.query.lat,
        longitude: req.query.lng,
        limit: req.query.limit || 3,
        includeClosed: req.query.includeClosed === "true"
    });

    res.status(200).json({ count: results.length, data: results });
});

router.get("/:id", async (req, res) => {
    const location = await service.getById(req.params.id);

    res.status(200).json({ data: location });
});

router.post("/", validateLocationCreate, async (req, res) => {
    // req.user lo coloca el middleware requireAuth
    const location = await service.create(req.body, req.user.id);

    res.status(201).json({ message: "Ubicación registrada", data: location });
});

router.patch("/:id", validateLocationUpdate, async (req, res) => {
    const location = await service.update(req.params.id, req.body);

    res.status(200).json({ message: "Ubicación actualizada", data: location });
});

router.delete("/:id", async (req, res) => {
    const location = await service.remove(req.params.id);

    res.status(200).json({ message: "Ubicación eliminada", data: location });
});

module.exports = router;
