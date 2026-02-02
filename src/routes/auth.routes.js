const express = require("express");
const router = express.Router();
const authController = require("../controllers/auth.controller");

// Test route
router.get("/test", authController.test);

router.post("/login", authController.login);

module.exports = router;
