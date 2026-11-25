"use strict";

/**
 * Carga datos de ejemplo (León, Gto.) para revisar la aplicación:
 *   npm run seed
 * Borra las colecciones y vuelve a insertar todo, incluido el usuario de prueba.
 */

require("dotenv").config();

const bcrypt = require("bcryptjs");

const { connectDatabase, disconnectDatabase } = require("../config/database");

const UserModel = require("../models/user.model");
const CategoryModel = require("../models/category.model");
const SpecialtyModel = require("../models/specialty.model");
const DoctorModel = require("../models/doctor.model");
const LocationModel = require("../models/location.model");
const ZoneModel = require("../models/zone.model");

const { demoUser, categories, specialties, locations, zones, doctors } = require("./seed.data");

async function runSeed() {
    try {
        await connectDatabase();

        await Promise.all([
            UserModel.deleteMany({}),
            CategoryModel.deleteMany({}),
            SpecialtyModel.deleteMany({}),
            DoctorModel.deleteMany({}),
            LocationModel.deleteMany({}),
            ZoneModel.deleteMany({})
        ]);

        // 1) usuario de prueba con contraseña cifrada
        const user = await UserModel.create({
            name: demoUser.name,
            email: demoUser.email,
            password: await bcrypt.hash(demoUser.password, 10)
        });
        console.log(`Usuario de prueba: ${demoUser.email}`);

        // 2) catálogos
        const insertedCategories = await CategoryModel.insertMany(categories);
        const categoryByName = new Map(insertedCategories.map((item) => [item.name, item._id]));
        console.log(`Categorías: ${insertedCategories.length}`);

        const insertedSpecialties = await SpecialtyModel.insertMany(specialties);
        const specialtyByName = new Map(insertedSpecialties.map((item) => [item.name, item._id]));
        console.log(`Especialidades: ${insertedSpecialties.length}`);

        // 3) ubicaciones como GeoJSON Point [longitud, latitud]
        const insertedLocations = await LocationModel.insertMany(
            locations.map(({ lat, lng, category, ...rest }) => ({
                ...rest,
                category: categoryByName.get(category),
                location: { type: "Point", coordinates: [lng, lat] },
                createdBy: user._id
            }))
        );
        const locationByName = new Map(insertedLocations.map((item) => [item.name, item._id]));
        console.log(`Ubicaciones: ${insertedLocations.length}`);

        // 4) zonas como GeoJSON Polygon (el anillo se cierra repitiendo el primer vértice)
        const insertedZones = await ZoneModel.insertMany(
            zones.map(({ ring, ...rest }) => ({
                ...rest,
                area: { type: "Polygon", coordinates: [[...ring, ring[0]]] },
                createdBy: user._id
            }))
        );
        console.log(`Zonas: ${insertedZones.length}`);

        // 5) médicos con referencias a especialidad y unidad
        const insertedDoctors = await DoctorModel.insertMany(
            doctors.map(({ specialty, unit, ...rest }) => ({
                ...rest,
                specialty: specialtyByName.get(specialty),
                unit: unit ? locationByName.get(unit) : null
            }))
        );
        console.log(`Médicos: ${insertedDoctors.length}`);

        console.log("\nSeed terminado correctamente.");
    } catch (error) {
        console.error("Error al ejecutar el seed:", error);
        process.exitCode = 1;
    } finally {
        await disconnectDatabase();
    }
}

runSeed();
