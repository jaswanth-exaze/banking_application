const customerService = require("../services/customer.service");
const loanService = require("../services/loan.service");

exports.getAccounts = async (req, res) => {
  try {
    const accounts = await customerService.getAccounts(req.user.user_id);
    res.json(accounts);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

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
exports.getProfile = async (req, res) => {
  try {
    const profile = await customerService.getProfile(req.user.user_id);

    res.json(profile);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

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

exports.getMyLoans = async (req, res) => {
  const loans = await loanService.getCustomerLoans(req.user.user_id);
  res.json(loans);
};

exports.getLoanHistory = async (req, res) => {
  const history = await loanService.getLoanHistory(req.params.loanId);
  res.json(history);
};
