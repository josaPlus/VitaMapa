"use strict";

const express = require("express");

const AuthService = require("../services/auth.service");
const { validateRegister, validateLogin } = require("../middlewares/auth.validator");
const { requireAuth } = require("../middlewares/auth.handler");

const router = express.Router();
const service = new AuthService();

// POST /api/auth/register -> crea la cuenta y regresa la sesión
router.post("/register", validateRegister, async (req, res) => {
    const { user, token } = await service.register(req.body);

    res.status(201).json({ message: "Cuenta creada correctamente", data: { user, token } });
});

// POST /api/auth/login -> compara la contraseña con el hash guardado
router.post("/login", validateLogin, async (req, res) => {
    const { user, token } = await service.login(req.body);

    res.status(200).json({ message: `Bienvenido, ${user.name}`, data: { user, token } });
});

// GET /api/auth/me -> datos del usuario de la sesión actual
router.get("/me", requireAuth, async (req, res) => {
    const user = await service.getProfile(req.user.id);

    res.status(200).json({ data: user });
});

module.exports = router;
