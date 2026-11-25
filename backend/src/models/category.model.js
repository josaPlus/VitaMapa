"use strict";

const mongoose = require("mongoose");

// Categoría de unidad de salud: hospital, farmacia, laboratorio, vacunación...
const categorySchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true,
            unique: true,
            minlength: 3,
            maxlength: 50
        },
        description: {
            type: String,
            trim: true,
            maxlength: 200,
            default: ""
        },
        // color hexadecimal con el que se pinta el marcador en el mapa
        color: {
            type: String,
            required: true,
            match: /^#[0-9a-fA-F]{6}$/
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

module.exports = mongoose.model("Category", categorySchema);
