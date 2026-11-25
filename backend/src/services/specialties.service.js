"use strict";

const AppError = require("../utils/appError");
const SpecialtyModel = require("../models/specialty.model");
const DoctorModel = require("../models/doctor.model");
const { assertObjectId } = require("../utils/validation");
const { buildSearchRegex, escapeRegex } = require("../utils/text");

const EDITABLE_FIELDS = ["name", "area", "description"];

class SpecialtiesService {

    async getAll({ search = "", area = "all" } = {}) {
        const query = {};

        if (area !== "all") {
            query.area = area;
        }

        if (search.trim()) {
            query.name = buildSearchRegex(search.trim());
        }

        const specialties = await SpecialtyModel.find(query).sort({ name: 1 });

        const counts = await DoctorModel.aggregate([
            { $group: { _id: "$specialty", total: { $sum: 1 } } }
        ]);

        const totals = new Map(counts.map((item) => [String(item._id), item.total]));

        return specialties.map((specialty) => ({
            ...specialty.toJSON(),
            doctorsCount: totals.get(specialty.id) || 0
        }));
    }

    async getById(id) {
        assertObjectId(id, "la especialidad");

        const specialty = await SpecialtyModel.findById(id);

        if (!specialty) {
            throw new AppError(404, "Especialidad no encontrada");
        }

        return specialty;
    }

    async create(data) {
        await this.ensureUniqueName(data.name);

        return SpecialtyModel.create({
            name: data.name.trim(),
            area: data.area,
            description: data.description ? data.description.trim() : ""
        });
    }

    async update(id, changes) {
        const specialty = await this.getById(id);

        if (changes.name !== undefined) {
            await this.ensureUniqueName(changes.name, id);
        }

        EDITABLE_FIELDS.forEach((field) => {
            if (changes[field] !== undefined) {
                specialty[field] = typeof changes[field] === "string" ? changes[field].trim() : changes[field];
            }
        });

        await specialty.save();

        return specialty;
    }

    async remove(id) {
        const specialty = await this.getById(id);

        const inUse = await DoctorModel.countDocuments({ specialty: specialty._id });

        if (inUse > 0) {
            throw new AppError(400, `No se puede eliminar: ${inUse} médico(s) tienen esta especialidad`);
        }

        await specialty.deleteOne();

        return specialty;
    }

    async ensureUniqueName(name, excludeId = null) {
        const query = { name: new RegExp(`^${escapeRegex(name.trim())}$`, "i") };

        if (excludeId) {
            query._id = { $ne: excludeId };
        }

        if (await SpecialtyModel.exists(query)) {
            throw new AppError(400, `Ya existe la especialidad "${name.trim()}"`);
        }
    }
}

module.exports = SpecialtiesService;
