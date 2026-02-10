/**
 * Sample protected routes.
 * Demonstrates token verification and role-based authorization.
 */

const express = require("express");
const router = express.Router();

const { verifyToken } = require("../middlewares/auth.middleware");
const { checkRole } = require("../middlewares/role.middleware");

// Accessible to any authenticated user.
router.get(
  "/profile",
  verifyToken,
  (req, res) => {
    res.json({
      message: "Access granted",
      user: req.user
    });
  }
);

// Accessible only to managers.
router.get(
  "/manager-only",
  verifyToken,
  checkRole("MANAGER"),
  (req, res) => {
    res.json({ message: "Manager access granted" });
  }
);

module.exports = router;
