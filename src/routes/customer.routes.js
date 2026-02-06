const express = require("express");
const router = express.Router();

const customerController = require("../controllers/customer.controller");
const { verifyToken } = require("../middlewares/auth.middleware");
const { checkRole } = require("../middlewares/role.middleware");

// GET /customer/accounts
router.get(
  "/accounts",
  verifyToken,
  checkRole("CUSTOMER"),
  customerController.getAccounts,
);

// GET /customer/transactions
router.get(
  "/transactions",
  verifyToken,
  checkRole("CUSTOMER"),
  customerController.getTransactions,
);
router.get(
  "/profile",
  verifyToken,
  checkRole("CUSTOMER"),
  customerController.getProfile,
);
router.post(
  "/transfer",
  verifyToken,
  checkRole("CUSTOMER"),
  customerController.transferMoney,
);

router.post("/applyLoan", verifyToken, checkRole("CUSTOMER"), customerController.applyLoan);
router.get("/getLoans", verifyToken, checkRole("CUSTOMER"), customerController.getMyLoans);


module.exports = router;
