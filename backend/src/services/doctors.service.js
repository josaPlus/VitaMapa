"use strict";

const AppError = require("../utils/appError");
const DoctorModel = require("../models/doctor.model");
const SpecialtyModel = require("../models/specialty.model");
const LocationModel = require("../models/location.model");
const { assertObjectId } = require("../utils/validation");
const { buildSearchRegex } = require("../utils/text");

// populate: en lugar del ObjectId se regresa el documento relacionado
const POPULATE = [
    { path: "specialty", select: "name area" },
    { path: "unit", select: "name status location" }
];

class DoctorsService {

    async getAll({ search = "", specialty = "all", unit = "all", shift = "all" } = {}) {
        const query = {};

        if (specialty !== "all") query.specialty = specialty;
        if (unit !== "all") query.unit = unit;
        if (shift !== "all") query.shift = shift;

        if (search.trim()) {
            const regex = buildSearchRegex(search.trim());
            query.$or = [{ fullName: regex }, { license: regex }];
        }

        return DoctorModel.find(query).populate(POPULATE).sort({ fullName: 1 });
    }

    async getById(id) {
        assertObjectId(id, "el médico");

        const doctor = await DoctorModel.findById(id).populate(POPULATE);

        if (!doctor) {
            throw new AppError(404, "Médico no encontrado");
        }

        return doctor;
    }

    async create(data) {
        await this.ensureUniqueLicense(data.license);
        await this.ensureReferences(data);

        const doctor = await DoctorModel.create({
            fullName: data.fullName.trim(),
            license: data.license.trim(),
            shift: data.shift,
            phone: data.phone ? data.phone.trim() : "",
            specialty: data.specialty,
            unit: data.unit || null
        });

        return doctor.populate(POPULATE);
    }

    async update(id, changes) {
        const doctor = await this.getById(id);

        if (changes.license !== undefined) {
            await this.ensureUniqueLicense(changes.license, id);
        }

        await this.ensureReferences(changes);

        if (changes.fullName !== undefined) doctor.fullName = changes.fullName.trim();
        if (changes.license !== undefined) doctor.license = changes.license.trim();
        if (changes.shift !== undefined) doctor.shift = changes.shift;
        if (changes.phone !== undefined) doctor.phone = (changes.phone || "").trim();
        if (changes.specialty !== undefined) doctor.specialty = changes.specialty;
        // unit vacío o null = el médico queda sin unidad asignada
        if (changes.unit !== undefined) doctor.unit = changes.unit || null;

        await doctor.save();

        return doctor.populate(POPULATE);
    }

    async remove(id) {
        const doctor = await this.getById(id);

        await doctor.deleteOne();

        return doctor;
    }

    // revisa que la especialidad y la unidad referenciadas existan de verdad
    async ensureReferences({ specialty, unit }) {
        if (specialty && !(await SpecialtyModel.exists({ _id: specialty }))) {
            throw new AppError(400, "La especialidad seleccionada no existe");
        }

        if (unit && !(await LocationModel.exists({ _id: unit }))) {
            throw new AppError(400, "La unidad de salud seleccionada no existe");
        }
    }

    async ensureUniqueLicense(license, excludeId = null) {
        const query = { license: license.trim() };

        if (excludeId) {
            query._id = { $ne: excludeId };
        }

        if (await DoctorModel.exists(query)) {
            throw new AppError(400, `La cédula ${license.trim()} ya está registrada`);
        }
    }
}

module.exports = DoctorsService;
