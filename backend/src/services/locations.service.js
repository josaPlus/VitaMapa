"use strict";

const AppError = require("../utils/appError");
const LocationModel = require("../models/location.model");
const CategoryModel = require("../models/category.model");
const DoctorModel = require("../models/doctor.model");
const ZonesService = require("./zones.service");
const { assertObjectId } = require("../utils/validation");
const { buildSearchRegex } = require("../utils/text");

const zonesService = new ZonesService();

// populate: la categoría y el usuario se regresan con su nombre, no como ObjectId
const POPULATE = [
    { path: "category", select: "name color" },
    { path: "createdBy", select: "name email" }
];

class LocationsService {

    /**
     * Filtros resueltos en el backend:
     *  - search:   texto parcial en el nombre (sin mayúsculas ni acentos)
     *  - category: id de la categoría
     *  - status:   disponible | saturada | cerrada
     *  - zone:     id de una zona -> solo las ubicaciones dentro del polígono
     */
    async getAll(filters = {}) {
        const { search = "", category = "all", status = "all", zone = "all" } = filters;

        const query = {};

        if (category !== "all") query.category = category;
        if (status !== "all") query.status = status;

        if (search.trim()) {
            query.name = buildSearchRegex(search.trim());
        }

        if (zone !== "all") {
            const selectedZone = await zonesService.getById(zone);
            query.location = { $geoWithin: { $geometry: selectedZone.area } };
        }

        // los más recientes primero
        return LocationModel.find(query).populate(POPULATE).sort({ createdAt: -1 });
    }

    async getById(id) {
        assertObjectId(id, "la ubicación");

        const location = await LocationModel.findById(id).populate(POPULATE);

        if (!location) {
            throw new AppError(404, "Ubicación no encontrada");
        }

        return location;
    }

    async create(data, userId) {
        await this.ensureCategory(data.category);

        const location = await LocationModel.create({
            name: data.name.trim(),
            description: data.description.trim(),
            category: data.category,
            status: data.status || "disponible",
            phone: data.phone ? data.phone.trim() : "",
            location: {
                type: "Point",
                // GeoJSON: primero longitud y luego latitud
                coordinates: [Number(data.longitude), Number(data.latitude)]
            },
            createdBy: userId
        });

        return location.populate(POPULATE);
    }

    // actualización parcial: solo cambian los campos que vienen en el body
    async update(id, changes) {
        const location = await this.getById(id);

        if (changes.category !== undefined) {
            await this.ensureCategory(changes.category);
            location.category = changes.category;
        }

        if (changes.name !== undefined) location.name = changes.name.trim();
        if (changes.description !== undefined) location.description = changes.description.trim();
        if (changes.status !== undefined) location.status = changes.status;
        if (changes.phone !== undefined) location.phone = (changes.phone || "").trim();

        if (changes.longitude !== undefined || changes.latitude !== undefined) {
            const [currentLng, currentLat] = location.location.coordinates;

            location.location = {
                type: "Point",
                coordinates: [
                    changes.longitude !== undefined ? Number(changes.longitude) : currentLng,
                    changes.latitude !== undefined ? Number(changes.latitude) : currentLat
                ]
            };
        }

        await location.save();

        return location.populate(POPULATE);
    }

    async remove(id) {
        const location = await this.getById(id);

        // los médicos que atendían aquí quedan sin unidad asignada
        await DoctorModel.updateMany({ unit: location._id }, { $set: { unit: null } });

        await location.deleteOne();

        return location;
    }

    async getGeoJSON(filters = {}) {
        const items = await this.getAll(filters);

        return {
            type: "FeatureCollection",
            features: items.map((item) => {
                const { location, ...properties } = item.toJSON();

                return {
                    type: "Feature",
                    geometry: { type: "Point", coordinates: location.coordinates },
                    properties
                };
            })
        };
    }

    // Unidades más cercanas a un punto ($geoNear usa el índice 2dsphere)
    async getNearby({ latitude, longitude, limit = 3, includeClosed = false }) {
        const results = await LocationModel.aggregate([
            {
                $geoNear: {
                    near: { type: "Point", coordinates: [Number(longitude), Number(latitude)] },
                    distanceField: "distance", // metros
                    spherical: true,
                    query: includeClosed ? {} : { status: { $ne: "cerrada" } }
                }
            },
            { $limit: Number(limit) }
        ]);

        await LocationModel.populate(results, { path: "category", select: "name color" });

        return results.map((item) => ({
            id: item._id.toString(),
            name: item.name,
            status: item.status,
            phone: item.phone,
            category: item.category
                ? { id: item.category._id.toString(), name: item.category.name, color: item.category.color }
                : null,
            location: item.location,
            distance: Math.round(item.distance)
        }));
    }

    async ensureCategory(categoryId) {
        if (!(await CategoryModel.exists({ _id: categoryId }))) {
            throw new AppError(400, "La categoría seleccionada no existe");
        }
    }
}

module.exports = LocationsService;
