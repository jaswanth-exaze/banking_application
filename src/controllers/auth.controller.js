/**
 * Auth controller.
 * Coordinates HTTP input/output for authentication endpoints.
 */

const authService = require("../services/auth.service");

// Lightweight endpoint used to verify module wiring.
exports.test = (req, res) => {
  res.json({ message: "Auth module working" });
};

// Validates credentials via service and returns JWT payload on success.
exports.login = async (req, res) => {
  try {
    const result = await authService.login(req.body);
    res.json(result);
  } catch (err) {
    res.status(401).json({ message: err.message });
  }
};
