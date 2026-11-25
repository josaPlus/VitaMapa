"use strict";

const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true,
            minlength: 3,
            maxlength: 80
        },
        email: {
            type: String,
            required: true,
            trim: true,
            lowercase: true,
            unique: true // no se permiten correos duplicados (índice único en MongoDB)
        },
        // aquí solo se guarda el HASH de bcrypt, nunca la contraseña en texto plano
        password: {
            type: String,
            required: true,
            select: false // no se regresa en las consultas a menos que se pida explícitamente
        }
    },
    {
        timestamps: true,
        toJSON: {
            versionKey: false,
            transform(doc, ret) {
                ret.id = ret._id.toString();
                delete ret._id;
                delete ret.password;
                return ret;
            }
        }
    }
);

module.exports = mongoose.model("User", userSchema);
