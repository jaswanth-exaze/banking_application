const express = require("express");
const router = express.Router();

const employeeController = require("../controllers/employee.controller");
const { verifyToken } = require("../middlewares/auth.middleware");
const { checkRole } = require("../middlewares/role.middleware");

router.get(
  "/customers",
  verifyToken,
  checkRole("EMPLOYEE", "MANAGER"),
  employeeController.getCustomers,
);

router.post(
  "/accounts",
  verifyToken,
  checkRole("EMPLOYEE", "MANAGER"),
  employeeController.createAccount
);

router.post(
"/onboard-customer",
verifyToken,
checkRole("EMPLOYEE"),
employeeController.onboardCustomer
);

/* DASHBOARD SUMMARY */
router.get(
"/dashboard-summary",
verifyToken,
checkRole("EMPLOYEE"),
employeeController.getDashboardSummary
);
router.get(
  "/profile",
  verifyToken,
  checkRole("EMPLOYEE"),
  employeeController.getProfile,
);
module.exports = router;
