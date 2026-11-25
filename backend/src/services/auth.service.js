"use strict";

const bcrypt = require("bcryptjs");

const AppError = require("../utils/appError");
const UserModel = require("../models/user.model");
const { signToken } = require("../utils/token");

const SALT_ROUNDS = 10;

class AuthService {

    async register({ name, email, password }) {
        const normalizedEmail = email.trim().toLowerCase();

        const exists = await UserModel.exists({ email: normalizedEmail });

        if (exists) {
            throw new AppError(400, "Ese correo ya está registrado");
        }

        // se guarda el hash, nunca la contraseña original
        const hash = await bcrypt.hash(password, SALT_ROUNDS);

        const user = await UserModel.create({
            name: name.trim(),
            email: normalizedEmail,
            password: hash
        });

        return { user, token: signToken(user) };
    }

    async login({ email, password }) {
        // password tiene select:false, por eso se pide con +password
        const user = await UserModel.findOne({ email: email.trim().toLowerCase() }).select("+password");

        // mismo mensaje en ambos casos para no revelar qué correos existen
        const invalid = new AppError(401, "Correo o contraseña incorrectos");

        if (!user) {
            throw invalid;
        }

        const matches = await bcrypt.compare(password, user.password);

        if (!matches) {
            throw invalid;
        }

        return { user, token: signToken(user) };
    }

    async getProfile(userId) {
        const user = await UserModel.findById(userId);

        if (!user) {
            throw new AppError(401, "La cuenta de esta sesión ya no existe");
        }

        return user;
    }
}

module.exports = AuthService;
