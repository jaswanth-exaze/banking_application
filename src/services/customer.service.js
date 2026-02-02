const db = require("../config/db");

// Fetch customer accounts
exports.getAccounts = (userId) => {
  return new Promise((resolve, reject) => {
    const sql = `
      SELECT a.account_id, a.account_number, a.account_type,
             a.balance, a.status
      FROM accounts a
      JOIN customers c ON a.customer_id = c.customer_id
      WHERE c.user_id = ?
    `;

    db.query(sql, [userId], (err, rows) => {
      if (err) return reject(err);
      resolve(rows);
    });
  });
};

// Fetch customer transactions
exports.getTransactions = (userId) => {
  return new Promise((resolve, reject) => {
    const sql = `
      SELECT
    t.transaction_id,
    t.transaction_type,
    t.amount,
    t.description,
    t.created_at,
    CASE
        WHEN t.to_account_id = a.account_id THEN 'CREDIT'
        WHEN t.from_account_id = a.account_id THEN 'DEBIT'
    END AS transaction_direction
FROM transactions t
JOIN accounts a
    ON (t.from_account_id = a.account_id OR t.to_account_id = a.account_id)
JOIN customers c
    ON a.customer_id = c.customer_id
WHERE c.user_id = ?
ORDER BY t.created_at DESC;

    `;

    db.query(sql, [userId], (err, rows) => {
      if (err) return reject(err);
      resolve(rows);
    });
  });
};

exports.getProfile = (userId) => {
  return new Promise((resolve, reject) => {
    const sql = `
      SELECT
  u.username,
  c.first_name,
  c.last_name,
  c.email,
  c.phone,
  b.branch_name,
  b.branch_code,
CONCAT(b.city,',',b.state) AS branch_address
FROM users u
JOIN customers c
  ON u.user_id = c.user_id
JOIN branches b
  ON u.branch_id = b.branch_id
WHERE u.user_id = ?;
    `;

    db.query(sql, [userId], (err, rows) => {
      if (err) return reject(err);

      resolve(rows[0]);
    });
  });
};
