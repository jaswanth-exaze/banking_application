const customerService = require("../services/customer.service");

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

