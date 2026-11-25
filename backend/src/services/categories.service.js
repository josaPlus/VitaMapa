"use strict";

const AppError = require("../utils/appError");
const CategoryModel = require("../models/category.model");
const LocationModel = require("../models/location.model");
const { assertObjectId } = require("../utils/validation");
const { buildSearchRegex, escapeRegex } = require("../utils/text");

const EDITABLE_FIELDS = ["name", "description", "color"];

class CategoriesService {

    async getAll({ search = "" } = {}) {
        const query = {};

        if (search.trim()) {
            query.name = buildSearchRegex(search.trim());
        }

        const categories = await CategoryModel.find(query).sort({ name: 1 });

        // cuántas ubicaciones usa cada categoría (útil para la vista de catálogos)
        const counts = await LocationModel.aggregate([
            { $group: { _id: "$category", total: { $sum: 1 } } }
        ]);

        const totals = new Map(counts.map((item) => [String(item._id), item.total]));

        return categories.map((category) => ({
            ...category.toJSON(),
            locationsCount: totals.get(category.id) || 0
        }));
    }

    async getById(id) {
        assertObjectId(id, "la categoría");

        const category = await CategoryModel.findById(id);

        if (!category) {
            throw new AppError(404, "Categoría no encontrada");
        }

        return category;
    }

    async create(data) {
        await this.ensureUniqueName(data.name);

        return CategoryModel.create({
            name: data.name.trim(),
            description: data.description ? data.description.trim() : "",
            color: data.color
        });
    }

    async update(id, changes) {
        const category = await this.getById(id);

        if (changes.name !== undefined) {
            await this.ensureUniqueName(changes.name, id);
        }

        EDITABLE_FIELDS.forEach((field) => {
            if (changes[field] !== undefined) {
                category[field] = typeof changes[field] === "string" ? changes[field].trim() : changes[field];
            }
        });

        await category.save();

        return category;
    }

    async remove(id) {
        const category = await this.getById(id);

        const inUse = await LocationModel.countDocuments({ category: category._id });

        if (inUse > 0) {
            throw new AppError(400, `No se puede eliminar: ${inUse} ubicación(es) usan esta categoría`);
        }

        await category.deleteOne();

        return category;
    }

    async ensureUniqueName(name, excludeId = null) {
        const query = { name: new RegExp(`^${escapeRegex(name.trim())}$`, "i") };

        if (excludeId) {
            query._id = { $ne: excludeId };
        }

        if (await CategoryModel.exists(query)) {
            throw new AppError(400, `Ya existe una categoría llamada "${name.trim()}"`);
        }
    }
}

module.exports = CategoriesService;
