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
        COALESCE(t.from_account_id, tp.from_account_id, tp.to_account_id) AS from_account_id,
        COALESCE(t.to_account_id, tp.to_account_id, tp.from_account_id)   AS to_account_id,
        af.account_number AS from_account_number,
        at.account_number AS to_account_number,
        CONCAT(cf.first_name, ' ', cf.last_name) AS from_customer_name,
        CONCAT(ct.first_name, ' ', ct.last_name) AS to_customer_name,
        CASE
            WHEN t.to_account_id = a.account_id THEN 'CREDIT'
            WHEN t.from_account_id = a.account_id THEN 'DEBIT'
        END AS transaction_direction
      FROM transactions t
      LEFT JOIN transactions tp
        ON SUBSTRING_INDEX(tp.reference_number, '-', 1) = SUBSTRING_INDEX(t.reference_number, '-', 1)
       AND tp.transaction_id <> t.transaction_id
      LEFT JOIN accounts af
        ON COALESCE(t.from_account_id, tp.from_account_id, tp.to_account_id) = af.account_id
      LEFT JOIN customers cf ON af.customer_id = cf.customer_id
      LEFT JOIN accounts at
        ON COALESCE(t.to_account_id, tp.to_account_id, tp.from_account_id) = at.account_id
      LEFT JOIN customers ct ON at.customer_id = ct.customer_id
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

exports.transfer_money = (myId, toID, amount, desc) => {
  return new Promise((resolve, reject) => {
    const sql = `CALL transfer_money(?, ?, ?, ?)`;

    db.query(sql, [myId, toID, amount, desc], (err, rows) => {
      if (err) {
        return reject(err);
      }

      resolve({ message: "Successfully transferred" });
    });
  });
};

