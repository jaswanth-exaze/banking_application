/**
 * Manager API routes.
 * Provides branch-level oversight endpoints and final loan decision actions.
 */

const express = require("express");
const router = express.Router();

const { verifyToken } = require("../middlewares/auth.middleware");
const { checkRole } = require("../middlewares/role.middleware");
const managerController = require("../controllers/manager.controller");

// Dashboard totals and branch info.
router.get(
  "/dashboard-summary",
  verifyToken,
  checkRole("MANAGER"),
  managerController.getDashboardSummary,
);

// Employees under manager's branch.
router.get(
  "/employees",
  verifyToken,
  checkRole("MANAGER"),
  managerController.getEmployeesByBranch,
);

/* Customers of manager's branch */
router.get(
  "/customers",
  verifyToken,
  checkRole("MANAGER"),
  managerController.getCustomersByBranch,
);

// Branch transactions with pagination and filters.
router.get(
  "/transactions",
  verifyToken,
  checkRole("MANAGER"),
  managerController.getTransactions,
);

// Manager loan queue and decisions.
router.get(
  "/pendingLoans",
  verifyToken,
  checkRole("MANAGER"),
  managerController.getPendingLoans,
);
router.post(
  "/:loanId/decision",
  verifyToken,
  checkRole("MANAGER"),
  managerController.decideLoan,
);
// Returns all branch loans (optional status filter).
router.get(
  "/loans",
  verifyToken,
  checkRole("MANAGER"),
  managerController.getAllLoans,
);
module.exports = router;
