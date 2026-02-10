/**
 * Customer API routes.
 * Covers accounts, transfers, profile, transactions, and loan workflows.
 */

const express = require("express");
const router = express.Router();

const customerController = require("../controllers/customer.controller");
const { verifyToken } = require("../middlewares/auth.middleware");
const { checkRole } = require("../middlewares/role.middleware");

// Returns all accounts mapped to the logged-in customer.
router.get(
  "/accounts",
  verifyToken,
  checkRole("CUSTOMER"),
  customerController.getAccounts,
);

// Returns transaction history for logged-in customer.
router.get(
  "/transactions",
  verifyToken,
  checkRole("CUSTOMER"),
  customerController.getTransactions,
);
// Returns profile details for logged-in customer.
router.get(
  "/profile",
  verifyToken,
  checkRole("CUSTOMER"),
  customerController.getProfile,
);
// Executes transfer between accounts through backend validation/procedure.
router.post(
  "/transfer",
  verifyToken,
  checkRole("CUSTOMER"),
  customerController.transferMoney,
);

// Creates a new loan request for logged-in customer.
router.post("/applyLoan", verifyToken, checkRole("CUSTOMER"), customerController.applyLoan);
// Returns loan requests created by logged-in customer.
router.get("/getLoans", verifyToken, checkRole("CUSTOMER"), customerController.getMyLoans);


module.exports = router;
