"use strict";

const mongoose = require("mongoose");

const ALLOWED_AREAS = ["consulta", "urgencias", "diagnostico", "quirurgica"];

// Especialidad médica (pediatría, cardiología...). Los médicos la referencian.
const specialtySchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true,
            unique: true,
            minlength: 3,
            maxlength: 60
        },
        area: {
            type: String,
            required: true,
            enum: ALLOWED_AREAS
        },
        description: {
            type: String,
            trim: true,
            maxlength: 200,
            default: ""
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

module.exports = mongoose.model("Specialty", specialtySchema);
module.exports.ALLOWED_AREAS = ALLOWED_AREAS;
