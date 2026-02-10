/**
 * Auth route definitions.
 * Exposes login and simple auth-module health endpoints.
 */

const express = require("express");
const router = express.Router();
const authController = require("../controllers/auth.controller");

// Health-style route to verify auth module wiring.
router.get("/test", authController.test);

// User login route.
router.post("/login", authController.login);

module.exports = router;
