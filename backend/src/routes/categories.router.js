"use strict";

const express = require("express");

const CategoriesService = require("../services/categories.service");
const {
    validateCategoryCreate,
    validateCategoryUpdate,
    validateCategoryQuery
} = require("../middlewares/category.validator");

const router = express.Router();
const service = new CategoriesService();

router.get("/", validateCategoryQuery, async (req, res) => {
    const categories = await service.getAll({ search: req.query.search });

    res.status(200).json({ count: categories.length, data: categories });
});

router.get("/:id", async (req, res) => {
    const category = await service.getById(req.params.id);

    res.status(200).json({ data: category });
});

router.post("/", validateCategoryCreate, async (req, res) => {
    const category = await service.create(req.body);

    res.status(201).json({ message: "Categoría creada", data: category });
});

router.patch("/:id", validateCategoryUpdate, async (req, res) => {
    const category = await service.update(req.params.id, req.body);

    res.status(200).json({ message: "Categoría actualizada", data: category });
});

router.delete("/:id", async (req, res) => {
    const category = await service.remove(req.params.id);

    res.status(200).json({ message: "Categoría eliminada", data: category });
});

module.exports = router;
