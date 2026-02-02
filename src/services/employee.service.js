const db = require("../config/db");
const bcrypt = require("bcrypt");

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
// helper fuction to generate account number
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

//add customers by employees
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
