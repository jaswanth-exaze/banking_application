const express = require("express");
const router = express.Router();

const { verifyToken } = require("../middlewares/auth.middleware");
const { checkRole } = require("../middlewares/role.middleware");

// Any logged-in user
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

// Manager-only
router.get(
  "/manager-only",
  verifyToken,
  checkRole("MANAGER"),
  (req, res) => {
    res.json({ message: "Manager access granted" });
  }
);

module.exports = router;
