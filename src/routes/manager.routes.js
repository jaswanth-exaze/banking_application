const express = require("express");
const router = express.Router();

const { verifyToken } = require("../middlewares/auth.middleware");
const { checkRole } = require("../middlewares/role.middleware");
const managerController = require("../controllers/manager.controller");

router.get(
  "/dashboard-summary",
  verifyToken,
  checkRole("MANAGER"),
  managerController.getDashboardSummary,
);

router.get(
  "/employees",
  verifyToken,
  checkRole("MANAGER"),
  managerController.getEmployeesByBranch,
);

/* Customers of branch */
router.get(
  "/customers",
  verifyToken,
  checkRole("MANAGER"),
  managerController.getCustomersByBranch,
);

router.get(
  "/transactions",
  verifyToken,
  checkRole("MANAGER"),
  managerController.getTransactions,
);

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
router.get(
  "/loans",
  verifyToken,
  checkRole("MANAGER"),
  managerController.getAllLoans,
);
module.exports = router;
