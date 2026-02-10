/**
 * Customer controller.
 * Handles customer-facing account, transfer, profile, and loan endpoints.
 */

const customerService = require("../services/customer.service");
const loanService = require("../services/loan.service");

// Returns all accounts owned by the authenticated customer.
exports.getAccounts = async (req, res) => {
  try {
    const accounts = await customerService.getAccounts(req.user.user_id);
    res.json(accounts);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Returns customer transaction list.
exports.getTransactions = async (req, res) => {
  try {
    const transactions = await customerService.getTransactions(
      req.user.user_id,
    );
    res.json(transactions);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
// Returns profile information for the logged-in customer.
exports.getProfile = async (req, res) => {
  try {
    const profile = await customerService.getProfile(req.user.user_id);

    res.json(profile);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Initiates transfer request via service-level DB procedure.
exports.transferMoney = async (req, res) => {
  try {
    const { fromId, toId, amount, desc } = req.body;

    await customerService.transfer_money(fromId, toId, amount, desc);

    res.status(201).json({
      message: "Amount transferred successfully",
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Creates a new loan request for the authenticated customer.
exports.applyLoan = async (req, res) => {
  try {
    const { amount, tenure_months, purpose } = req.body;

    if (!amount || !tenure_months) {
      return res.status(400).json({
        message: "amount and tenure_months are required",
      });
    }

    const loanId = await loanService.applyLoan({
      userId: req.user.user_id,
      branchId: req.user.branch_id,
      amount,
      tenureMonths: tenure_months,
      purpose,
    });

    res.status(201).json({
      message: "Loan request submitted",
      loan_id: loanId,
    });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// Returns all loan requests made by the authenticated customer.
exports.getMyLoans = async (req, res) => {
  const loans = await loanService.getCustomerLoans(req.user.user_id);
  res.json(loans);
};

// Returns status transition history for a specific loan.
exports.getLoanHistory = async (req, res) => {
  const history = await loanService.getLoanHistory(req.params.loanId);
  res.json(history);
};
