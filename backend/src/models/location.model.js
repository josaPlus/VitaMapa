"use strict";

const mongoose = require("mongoose");

const ALLOWED_STATUSES = ["disponible", "saturada", "cerrada"];

// Ubicación exacta: una unidad de atención médica registrada desde el mapa
const locationSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true,
            minlength: 3,
            maxlength: 120
        },
        description: {
            type: String,
            required: true,
            trim: true,
            minlength: 5,
            maxlength: 300
        },
        // relación por referencia: ubicación -> categoría
        category: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Category",
            required: true
        },
        status: {
            type: String,
            enum: ALLOWED_STATUSES,
            default: "disponible"
        },
        phone: {
            type: String,
            trim: true,
            default: ""
        },
        // GeoJSON Point SIEMPRE en orden [longitud, latitud]
        location: {
            type: {
                type: String,
                enum: ["Point"],
                default: "Point",
                required: true
            },
            coordinates: {
                type: [Number],
                required: true
            }
        },
        // relación por referencia: ubicación -> usuario que la registró
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

// índice geoespacial: permite $near / $geoNear / $geoWithin
locationSchema.index({ location: "2dsphere" });

module.exports = mongoose.model("Location", locationSchema);
module.exports.ALLOWED_STATUSES = ALLOWED_STATUSES;
