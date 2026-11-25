"use strict";

const mongoose = require("mongoose");

const ALLOWED_RISKS = ["bajo", "medio", "alto"];

// Zona dibujada en el mapa (sector de cobertura / alerta sanitaria)
const zoneSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true,
            minlength: 3,
            maxlength: 80
        },
        risk: {
            type: String,
            enum: ALLOWED_RISKS,
            default: "bajo"
        },
        notes: {
            type: String,
            trim: true,
            maxlength: 200,
            default: ""
        },
        // GeoJSON Polygon: arreglo de anillos, cada vértice en [longitud, latitud]
        area: {
            type: {
                type: String,
                enum: ["Polygon"],
                default: "Polygon",
                required: true
            },
            coordinates: {
                type: [[[Number]]],
                required: true
            }
        },
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        }
    },
    {
        timestamps: true,
        toJSON: {
            versionKey: false,
            transform(doc, ret) {
                ret.id = ret._id.toString();
                delete ret._id;
                return ret;
            }
        }
    }
);

zoneSchema.index({ area: "2dsphere" });

module.exports = mongoose.model("Zone", zoneSchema);
module.exports.ALLOWED_RISKS = ALLOWED_RISKS;
