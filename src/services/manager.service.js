const db = require("../config/db");

/* DASHBOARD SUMMARY */
exports.getDashboardSummary = (branchId) => {
  return new Promise((resolve, reject) => {
    const sql = `
      SELECT
        b.branch_id,
        b.branch_name,
        b.branch_code,
        CONCAT(b.city, ', ', b.state) AS branch_address,
        (SELECT COUNT(*) 
         FROM users 
         WHERE branch_id = ? AND role_id = 2) AS total_employees,

        (SELECT COUNT(*) 
         FROM customers c
         JOIN users u ON c.user_id = u.user_id
         WHERE u.branch_id = ?) AS total_customers,

        (SELECT COUNT(*) 
         FROM accounts a
         JOIN customers c ON a.customer_id = c.customer_id
         JOIN users u ON c.user_id = u.user_id
         WHERE u.branch_id = ?) AS total_accounts,

        (SELECT COALESCE(SUM(a.balance), 0)
         FROM accounts a
         JOIN customers c ON a.customer_id = c.customer_id
         JOIN users u ON c.user_id = u.user_id
         WHERE u.branch_id = ? AND a.status = 'ACTIVE') AS branch_balance
      FROM branches b
      WHERE b.branch_id = ?
    `;

    db.query(
      sql,
      [branchId, branchId, branchId, branchId, branchId],
      (err, rows) => {
      if (err) return reject(err);

      resolve(rows[0]);
      },
    );
  });
};

/* EMPLOYEES OF BRANCH */
exports.getEmployeesByBranch = (branchId) => {
  return new Promise((resolve, reject) => {
    const sql = `
      SELECT
        e.employee_id,
        u.user_id,
        e.first_name,
        e.last_name,
        e.email,
        e.phone,
        e.designation as role_name
      FROM users u
      JOIN roles r ON u.role_id = r.role_id
      JOIN employees e ON u.user_id = e.user_id
      WHERE u.branch_id = ? AND r.role_name = 'EMPLOYEE'
    `;

    db.query(sql, [branchId], (err, rows) => {
      if (err) return reject(err);
      resolve(rows);
    });
  });
};

/* CUSTOMERS OF BRANCH */
exports.getCustomersByBranch = (branchId) => {
  return new Promise((resolve, reject) => {
    const sql = `
      SELECT
        c.customer_id,
        c.first_name,
        c.last_name,
        c.email,
        c.phone
      FROM customers c
      JOIN users u ON c.user_id = u.user_id
      WHERE u.branch_id = ?
    `;

    db.query(sql, [branchId], (err, rows) => {
      if (err) return reject(err);
      resolve(rows);
    });
  });
};
