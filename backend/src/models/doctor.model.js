"use strict";

const mongoose = require("mongoose");

const ALLOWED_SHIFTS = ["matutino", "vespertino", "nocturno", "fin_de_semana"];

// Médico: relación por referencia con Specialty y con la unidad (Location) donde atiende
const doctorSchema = new mongoose.Schema(
    {
        fullName: {
            type: String,
            required: true,
            trim: true,
            minlength: 5,
            maxlength: 100
        },
        // cédula profesional
        license: {
            type: String,
            required: true,
            trim: true,
            unique: true,
            match: /^[0-9]{7,8}$/
        },
        shift: {
            type: String,
            required: true,
            enum: ALLOWED_SHIFTS
        },
        phone: {
            type: String,
            trim: true,
            default: ""
        },
        specialty: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Specialty",
            required: true
        },
        unit: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Location",
            default: null
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

module.exports = mongoose.model("Doctor", doctorSchema);
module.exports.ALLOWED_SHIFTS = ALLOWED_SHIFTS;
