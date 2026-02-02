const employeeService = require("../services/employee.service");

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
exports.getDashboardSummary = async (req, res) => {
  try {
    const branchId = req.user.branch_id;
    const data = await employeeService.getDashboardSummary(branchId);
    res.json(data);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

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
exports.getProfile = async (req, res) => {
  try {
    const profile = await employeeService.getProfile(req.user.user_id);
    res.json(profile);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
