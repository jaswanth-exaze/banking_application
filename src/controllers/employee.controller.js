/**
 * Employee controller.
 * Handles branch operations exposed to employee dashboards.
 */

const employeeService = require("../services/employee.service");
const loanService = require("../services/loan.service")

// Lists active customers in the employee's branch.
exports.getCustomers = async (req, res) => {
  try {
    const customers = await employeeService.getCustomersByBranch(
      req.user.branch_id,
    );
    res.json(customers);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
// Returns branch summary metrics (customers and balance).
exports.getDashboardSummary = async (req, res) => {
  try {
    const branchId = req.user.branch_id;
    const data = await employeeService.getDashboardSummary(branchId);
    res.json(data);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Creates a customer account after branch and input validation.
exports.createAccount = async (req, res) => {
  try {
    const { customer_id, account_type, opening_balance } = req.body;
    //basic validation
    if (!customer_id || !account_type || opening_balance === undefined) {
      return res.status(400).json({ message: "Missing required fields" });
    }
    const result = await employeeService.createAccount({
      customer_id,
      account_type,
      opening_balance,
      branch_id: req.user.branch_id, // comes from jwt
    });
    res.status(201).json({
      message: "Account created successfully",
      account_id: result.account_id,
      account_number: result.account_number,
    });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// Creates user/customer records and optional account in one flow.
exports.onboardCustomer = async (req, res) => {
  try {
    const {
      username,
      password,
      first_name,
      last_name,
      email,
      phone,
      create_account,
      account_type,
      opening_balance,
    } = req.body;

    // Mandatory fields
    if (!username || !password || !first_name || !email || !phone) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const result = await employeeService.onboardCustomer({
      username,
      password,
      first_name,
      last_name,
      email,
      phone,
      create_account,
      account_type,
      opening_balance,
      branch_id: req.user.branch_id,
    });

    res.status(201).json({
      message: "Customer onboarded successfully",
      customer_id: result.customer_id,
      username: result.username,
      account_number: result.account_number,
    });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};
// Returns employee profile details.
exports.getProfile = async (req, res) => {
  try {
    const profile = await employeeService.getProfile(req.user.user_id);
    res.json(profile);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

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

    const { data, total } = await employeeService.getBranchTransactions({
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

// Deposits amount into an account through DB stored procedure.
exports.depositMoney = async (req, res) => {
  try {
    const { toId, amount, desc } = req.body;

    await employeeService.deposit(toId, amount, desc);

    res.status(201).json({
      message: "Amount deposited successfully",
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Withdraws amount from an account through DB stored procedure.
exports.withdrawalMoney = async (req, res) => {
  try {
    const { fromId, amount, desc } = req.body;

    await employeeService.withdrawal(fromId, amount, desc);

    res.status(201).json({
      message: "Amount withdrawn successfully",
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


// Lists loans waiting for employee review.
exports.getPendingLoans = async (req, res) => {
  const loans = await loanService.getLoansByStatus({
    status: "REQUESTED",
    branchId: req.user.branch_id,
  });
  res.json(loans);
};

// Saves employee approve/reject decision for a loan.
exports.decideLoan = async (req, res) => {
  try {
    const status =
      req.body.action === "APPROVE"
        ? "EMPLOYEE_APPROVED"
        : "EMPLOYEE_REJECTED";

    await loanService.employeeDecision({
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
