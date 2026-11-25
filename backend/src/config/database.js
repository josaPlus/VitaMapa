"use strict";

const mongoose = require("mongoose");

async function connectDatabase() {
    const uri = process.env.MONGODB_URI;

    if (!uri) {
        throw new Error("falta la variable de entorno MONGODB_URI");
    }

    await mongoose.connect(uri);

    // asegura que los índices (2dsphere, unique) existan antes de recibir peticiones
    await Promise.all(Object.values(mongoose.models).map((model) => model.init()));

    console.log("Conexión a MongoDB establecida");
}

async function disconnectDatabase() {
    await mongoose.disconnect();
    console.log("Conexión a MongoDB cerrada");
}

module.exports = { connectDatabase, disconnectDatabase };
