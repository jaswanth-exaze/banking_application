/**
 * Employee data service.
 * Contains branch-scoped customer/account operations, onboarding, transactions, and cash desk flows.
 */

const db = require("../config/db");
const bcrypt = require("bcrypt");

// Returns active customers belonging to the provided branch.
exports.getCustomersByBranch = (branchId) => {
  return new Promise((resolve, reject) => {
    const sql = `
        SELECT
        c.customer_id,c.first_name,c.last_name,c.email,c.phone 
        FROM customers c JOIN users u ON c.user_id = u.user_id
        WHERE u.branch_id = ? AND u.is_active = 1;
     `;
    db.query(sql, [branchId], (err, result) => {
      if (err) return reject(err);
      resolve(result);
    });
  });
};
// Generates the next sequential account number in ACC########## format.
function generateAccountNumber(db) {
  return new Promise((resolve, reject) => {
    const sql = `
      SELECT account_number
      FROM accounts
      ORDER BY account_id DESC
      LIMIT 1
    `;

    db.query(sql, (err, rows) => {
      if (err) return reject(err);

      let nextNumber = 1000000001; // base if no accounts exist

      if (rows.length > 0) {
        const lastAcc = rows[0].account_number; // e.g. ACC1000000281
        const numericPart = parseInt(lastAcc.replace("ACC", ""), 10);
        nextNumber = numericPart + 1;
      }

      resolve(`ACC${nextNumber}`);
    });
  });
}

// Creates a new bank account for an existing branch customer.
exports.createAccount = ({
  customer_id,
  account_type,
  opening_balance,
  branch_id,
}) => {
  return new Promise((resolve, reject) => {
    const allowedTypes = ["SAVINGS", "CURRENT", "SALARY"];
    if (!allowedTypes.includes(account_type)) {
      return reject(new Error("Invalid account type"));
    }

    if (opening_balance < 0) {
      return reject(new Error("Opening balance cannot be negative"));
    }

    // 1. Check customer exists AND belongs to employee's branch
    const customerCheckSql = `
      SELECT c.customer_id
      FROM customers c
      JOIN users u ON c.user_id = u.user_id
      WHERE c.customer_id = ? AND u.branch_id = ?
    `;

    db.query(customerCheckSql, [customer_id, branch_id], async (err, rows) => {
      if (err) return reject(err);

      if (rows.length === 0) {
        return reject(new Error("Customer not found in your branch"));
      }

      try {
        // 2. Generate proper bank-style account number
        const account_number = await generateAccountNumber(db);

        // 3. Insert account
        const insertSql = `
          INSERT INTO accounts
          (customer_id, account_number, account_type, balance, status)
          VALUES (?, ?, ?, ?, 'ACTIVE')
        `;

        db.query(
          insertSql,
          [customer_id, account_number, account_type, opening_balance],
          (err, result) => {
            if (err) return reject(err);

            resolve({
              account_id: result.insertId,
              account_number,
            });
          },
        );
      } catch (err) {
        reject(err);
      }
    });
  });
};

// Onboards a customer (user + profile + optional initial account) in one transaction.
exports.onboardCustomer = ({
  username,
  password,
  first_name,
  last_name,
  email,
  phone,
  create_account,
  account_type,
  opening_balance,
  branch_id,
}) => {
  return new Promise((resolve, reject) => {
    db.beginTransaction(async (err) => {
      if (err) return reject(err);

      try {
        /* 1️⃣ Uniqueness checks */
        const [userExists] = await db
          .promise()
          .query("SELECT user_id FROM users WHERE username = ?", [username]);
        if (userExists.length > 0) {
          throw new Error("Username already exists");
        }

        const [emailExists] = await db
          .promise()
          .query("SELECT customer_id FROM customers WHERE email = ?", [email]);
        if (emailExists.length > 0) {
          throw new Error("Customer already exists");
        }

        /* 2️⃣ Create USER */
        const passwordHash = await bcrypt.hash(password, 10);

        const [userResult] = await db.promise().query(
          `INSERT INTO users (username, password_hash, role_id, branch_id)
           VALUES (?, ?, 1, ?)`,
          [username, passwordHash, branch_id],
        );
        const user_id = userResult.insertId;

        /* 3️⃣ Create CUSTOMER */
        const [customerResult] = await db.promise().query(
          `INSERT INTO customers (user_id, first_name, last_name, email, phone)
           VALUES (?, ?, ?, ?, ?)`,
          [user_id, first_name, last_name, email, phone],
        );
        const customer_id = customerResult.insertId;

        let account_number = null;

        /* 4️⃣ OPTIONAL: Create account */
        if (create_account === true) {
          if (!account_type || opening_balance === undefined) {
            throw new Error("Account details required");
          }

          const allowedTypes = ["SAVINGS", "CURRENT"];
          if (!allowedTypes.includes(account_type)) {
            throw new Error("Invalid account type");
          }

          if (opening_balance < 0) {
            throw new Error("Opening balance cannot be negative");
          }

          account_number = await generateAccountNumber(db);

          await db.promise().query(
            `INSERT INTO accounts
             (customer_id, account_number, account_type, balance, status)
             VALUES (?, ?, ?, ?, 'ACTIVE')`,
            [customer_id, account_number, account_type, opening_balance],
          );
        }

        await db.promise().commit();

        resolve({
          customer_id,
          username,
          account_number,
        });
      } catch (err) {
        await db.promise().rollback();
        reject(err);
      }
    });
  });
};

// Returns basic branch-level dashboard totals for employee view.
exports.getDashboardSummary = (branchId) => {
  return new Promise((resolve, reject) => {
    const sql = `
  SELECT
    (SELECT COUNT(*)
     FROM customers c
     JOIN users u ON c.user_id = u.user_id
     WHERE u.branch_id = ?) AS totalCustomers,

    (SELECT IFNULL(SUM(a.balance), 0)
     FROM accounts a
     JOIN customers c ON a.customer_id = c.customer_id
     JOIN users u ON c.user_id = u.user_id
     WHERE u.branch_id = ?) AS branchBalance
`;

    db.query(sql, [branchId, branchId], (err, rows) => {
      if (err) return reject(err);
      resolve(rows[0]);
    });
  });
};

// Returns employee profile details for the authenticated user.
exports.getProfile = (userId) => {
  return new Promise((resolve, reject) => {
    const sql = `SELECT
    e.employee_id,
    e.first_name,
    e.last_name,
    e.designation,
    e.joined_date,
    e.gender,
    e.email,
    e.phone,
    e.salary,

    b.branch_name,
    b.branch_code

FROM employees e
JOIN users u
    ON e.user_id = u.user_id
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

/* Branch-wide transactions (with optional filters) */
// Returns paginated transaction data restricted to the employee's branch scope.
exports.getBranchTransactions = async ({
  branchId,
  customerId,
  userId,
  limit = 15,
  offset = 0,
}) => {
  const whereParts = [
    `(
      EXISTS (
        SELECT 1
        FROM accounts a1
        JOIN customers c1 ON a1.customer_id = c1.customer_id
        JOIN users u1 ON c1.user_id = u1.user_id
        WHERE a1.account_id = t.from_account_id AND u1.branch_id = ?
      )
      OR
      EXISTS (
        SELECT 1
        FROM accounts a2
        JOIN customers c2 ON a2.customer_id = c2.customer_id
        JOIN users u2 ON c2.user_id = u2.user_id
        WHERE a2.account_id = t.to_account_id AND u2.branch_id = ?
      )
    )`,
  ];
  const params = [branchId, branchId];

  if (customerId) {
    whereParts.push("(cf.customer_id = ? OR ct.customer_id = ?)");
    params.push(customerId, customerId);
  }

  if (userId) {
    whereParts.push("(ufrom.user_id = ? OR uto.user_id = ?)");
    params.push(userId, userId);
  }

  const whereClause = `WHERE ${whereParts.join(" AND ")}`;

  const baseSql = `
    SELECT
      t.transaction_id,
      t.transaction_type,
      t.amount,
      t.description,
      t.created_at,
      t.from_account_id,
      t.to_account_id,
      af.account_number AS from_account_number,
      at.account_number AS to_account_number,
      COALESCE(
        NULLIF(TRIM(CONCAT(cf.first_name, ' ', cf.last_name)), ''),
        CONCAT('Customer ', cf.customer_id),
        CONCAT('Account ', af.account_number),
        'Cash Desk'
      ) AS from_customer_name,
      COALESCE(
        NULLIF(TRIM(CONCAT(ct.first_name, ' ', ct.last_name)), ''),
        CONCAT('Customer ', ct.customer_id),
        CONCAT('Account ', at.account_number),
        'Cash Desk'
      ) AS to_customer_name,
      cf.customer_id AS from_customer_id,
      ct.customer_id AS to_customer_id,
      ufrom.user_id AS from_user_id,
      uto.user_id AS to_user_id
    FROM transactions t
    LEFT JOIN accounts af ON t.from_account_id = af.account_id
    LEFT JOIN customers cf ON af.customer_id = cf.customer_id
    LEFT JOIN users ufrom ON cf.user_id = ufrom.user_id
    LEFT JOIN accounts at ON t.to_account_id = at.account_id
    LEFT JOIN customers ct ON at.customer_id = ct.customer_id
    LEFT JOIN users uto ON ct.user_id = uto.user_id
    ${whereClause}
  `;

  const countSql = `SELECT COUNT(*) AS total FROM (${baseSql}) AS tx`;
  const dataSql = `${baseSql} ORDER BY t.created_at DESC LIMIT ? OFFSET ?`;

  const dbp = db.promise();
  const [[countRow]] = await dbp.query(countSql, params);
  const [rows] = await dbp.query(dataSql, [...params, Number(limit), Number(offset)]);

  return {
    total: countRow?.total ?? 0,
    data: rows,
  };
};

// Executes a cash deposit into a target account.
exports.deposit = (toID, amount, desc='Deposited by bank') => {
  return new Promise((resolve, reject) => {
    const sql = `CALL add_money(?, ?, ?)`;

    db.query(sql, [toID, amount, desc], (err, rows) => {
      if (err) {
        return reject(err);
      }

      resolve({ message: "Successfully transferred" });
    });
  });
};

// Executes a cash withdrawal from a source account.
exports.withdrawal = (fromID, amount, desc='withdraw by bank') => {
  return new Promise((resolve, reject) => {
    const sql = `CALL remove_money(?, ?, ?)`;

    db.query(sql, [fromID, amount, desc], (err, rows) => {
      if (err) {
        return reject(err);
      }

      resolve({ message: "Successfully transferred" });
    });
  });
};
