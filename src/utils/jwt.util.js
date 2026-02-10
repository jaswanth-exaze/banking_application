/**
 * JWT helper utilities.
 */

const jwt = require("jsonwebtoken");

// Signs a short-lived access token for authenticated sessions.
exports.generateToken = (payload) => {
  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: "1h"
  });
};
