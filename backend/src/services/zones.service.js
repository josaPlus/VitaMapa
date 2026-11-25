"use strict";

const AppError = require("../utils/appError");
const ZoneModel = require("../models/zone.model");
const LocationModel = require("../models/location.model");
const { assertObjectId } = require("../utils/validation");

class ZonesService {

    async getAll() {
        return ZoneModel.find().populate("createdBy", "name").sort({ createdAt: 1 });
    }

    async getById(id) {
        assertObjectId(id, "la zona");

        const zone = await ZoneModel.findById(id).populate("createdBy", "name");

        if (!zone) {
            throw new AppError(404, "Zona no encontrada");
        }

        return zone;
    }

    async create(data, userId) {
        const zone = await ZoneModel.create({
            name: data.name.trim(),
            risk: data.risk || "bajo",
            notes: data.notes ? data.notes.trim() : "",
            area: {
                type: "Polygon",
                coordinates: [this.closeRing(data.coordinates[0])]
            },
            createdBy: userId
        });

        return zone.populate("createdBy", "name");
    }

    async update(id, changes) {
        const zone = await this.getById(id);

        if (changes.name !== undefined) zone.name = changes.name.trim();
        if (changes.risk !== undefined) zone.risk = changes.risk;
        if (changes.notes !== undefined) zone.notes = (changes.notes || "").trim();

        if (changes.coordinates !== undefined) {
            zone.area = { type: "Polygon", coordinates: [this.closeRing(changes.coordinates[0])] };
        }

        await zone.save();

        return zone;
    }

    async remove(id) {
        const zone = await this.getById(id);

        await zone.deleteOne();

        return zone;
    }

    // GeoJSON exige que el primer y el último vértice del anillo sean iguales
    closeRing(ring) {
        const points = ring.map(([lng, lat]) => [Number(lng), Number(lat)]);
        const [firstLng, firstLat] = points[0];
        const [lastLng, lastLat] = points[points.length - 1];

        if (firstLng !== lastLng || firstLat !== lastLat) {
            points.push([firstLng, firstLat]);
        }

        return points;
    }

    // Cobertura: qué unidades de salud quedan DENTRO de cada zona ($geoWithin)
    async getCoverage() {
        const zones = await this.getAll();

        return Promise.all(zones.map(async (zone) => {
            const units = await LocationModel
                .find({ location: { $geoWithin: { $geometry: zone.area } } })
                .populate("category", "name color icon")
                .select("name status category location")
                .sort({ name: 1 });

            const byStatus = { disponible: 0, saturada: 0, cerrada: 0 };
            const byCategory = {};

            units.forEach((unit) => {
                byStatus[unit.status] += 1;

                const key = unit.category ? unit.category.name : "Sin categoría";
                byCategory[key] = (byCategory[key] || 0) + 1;
            });

            return {
                ...zone.toJSON(),
                summary: {
                    total: units.length,
                    byStatus,
                    byCategory: Object.entries(byCategory).map(([name, total]) => ({ name, total }))
                },
                units
            };
        }));
    }
}

module.exports = ZonesService;
