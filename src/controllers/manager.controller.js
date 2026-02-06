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

/* Branch transactions */
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
