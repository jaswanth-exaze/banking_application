/**
 * Employee API routes.
 * Includes branch customer/account operations, cash desk, transactions, and loan decisions.
 */

const express = require("express");
const router = express.Router();

const employeeController = require("../controllers/employee.controller");
const { verifyToken } = require("../middlewares/auth.middleware");
const { checkRole } = require("../middlewares/role.middleware");

// List customers in the employee's branch.
router.get(
  "/customers",
  verifyToken,
  checkRole("EMPLOYEE", "MANAGER"),
  employeeController.getCustomers,
);

// Create a new account for an existing customer in branch.
router.post(
  "/accounts",
  verifyToken,
  checkRole("EMPLOYEE", "MANAGER"),
  employeeController.createAccount,
);

// Onboard a customer (user + customer profile + optional account).
router.post(
  "/onboard-customer",
  verifyToken,
  checkRole("EMPLOYEE"),
  employeeController.onboardCustomer,
);

/* Dashboard and profile */
router.get(
  "/dashboard-summary",
  verifyToken,
  checkRole("EMPLOYEE"),
  employeeController.getDashboardSummary,
);
// Branch-level transaction listing with optional filters and paging.
router.get(
  "/profile",
  verifyToken,
  checkRole("EMPLOYEE"),
  employeeController.getProfile,
);
router.get(
  "/transactions",
  verifyToken,
  checkRole("EMPLOYEE"),
  employeeController.getTransactions,
);

// Cash desk withdrawal operation.
router.post(
  "/withdrawal",
  verifyToken,
  checkRole("EMPLOYEE"),
  employeeController.withdrawalMoney,
);
// Cash desk deposit operation.
router.post(
  "/deposit",
  verifyToken,
  checkRole("EMPLOYEE"),
  employeeController.depositMoney,
);

// Loan queue endpoints for employee review stage.
router.get("/pendingLoans", verifyToken, checkRole("EMPLOYEE"), employeeController.getPendingLoans);
router.post("/:loanId/decision", verifyToken, checkRole("EMPLOYEE"), employeeController.decideLoan);

module.exports = router;
