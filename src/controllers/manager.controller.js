const managerService = require("../services/manager.service");
/* Dashboard Summary */
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
exports.getCustomersByBranch = async (req, res) => {
try {
const branchId = req.user.branch_id;
const customers = await managerService.getCustomersByBranch(branchId);
res.json(customers);
} catch (err) {
res.status(500).json({ message: err.message });
}
};