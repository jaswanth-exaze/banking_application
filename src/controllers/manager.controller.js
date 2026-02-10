/**
 * Manager controller.
 * Handles manager-level branch oversight and loan decision actions.
 */

const managerService = require("../services/manager.service");
const loanService = require("../services/loan.service")

/* Dashboard Summary */
// Returns branch dashboard totals and branch identity details.
exports.getDashboardSummary = async (req, res) => {
  try {
    const branchId = req.user.branch_id;
    const summary = await managerService.getDashboardSummary(branchId);
    res.json(summary)
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
/* Employees by branch */
// Lists employees assigned to manager's branch.
exports.getEmployeesByBranch = async (req, res) => {
try {
const branchId = req.user.branch_id;
const employees = await managerService.getEmployeesByBranch(branchId);
res.json(employees);
} catch (err) {
res.status(500).json({ message: err.message });
}
};

/* Customers by branch */
// Lists customers assigned to manager's branch.
exports.getCustomersByBranch = async (req, res) => {
try {
const branchId = req.user.branch_id;
const customers = await managerService.getCustomersByBranch(branchId);
res.json(customers);
} catch (err) {
res.status(500).json({ message: err.message });
}
};

/* Branch transactions */
// Returns paginated branch transactions with optional filters.
exports.getTransactions = async (req, res) => {
  try {
    const branchId = req.user.branch_id;
    const {
      page = 1,
      limit = 15,
      customerId,
      userId,
    } = req.query;

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const perPage = Math.max(1, Math.min(parseInt(limit, 10) || 15, 100));
    const offset = (pageNum - 1) * perPage;

    const { data, total } = await managerService.getBranchTransactions({
      branchId,
      customerId: customerId ? Number(customerId) : undefined,
      userId: userId ? Number(userId) : undefined,
      limit: perPage,
      offset,
    });

    res.json({
      data,
      page: pageNum,
      limit: perPage,
      total,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Returns loans waiting for manager decision.
exports.getPendingLoans = async (req, res) => {
  const loans = await loanService.getLoansByStatus({
    status: "EMPLOYEE_APPROVED",
    branchId: req.user.branch_id,
  });
  res.json(loans);
};

// Saves manager approve/reject decision and applies disbursal on approval.
exports.decideLoan = async (req, res) => {
  try {
    const status =
      req.body.action === "APPROVE"
        ? "MANAGER_APPROVED"
        : "MANAGER_REJECTED";

    await loanService.managerDecision({
      loanId: req.params.loanId,
      userId: req.user.user_id,
      status,
      comment: req.body.comment,
    });

    res.json({ message: `Loan ${req.body.action.toLowerCase()}d` });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// Returns all branch loans with optional status filtering.
exports.getAllLoans = async (req, res) => {
  try {
    const { status } = req.query;
    const loans = await loanService.getLoansByBranch({
      branchId: req.user.branch_id,
      status,
    });
    res.json(loans);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
