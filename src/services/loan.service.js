/**
 * Loan workflow service.
 * Handles loan creation, employee/manager decisions, and loan listing/history queries.
 */

const db = require("../config/db");

/* ================================
   CUSTOMER → Apply Loan
   user_id → customer_id (resolved here)
================================ */
exports.applyLoan = async ({
  userId,
  branchId,
  amount,
  tenureMonths,
  purpose,
}) => {
  // Insert loan request by resolving customer_id from authenticated user id.
  const sql = `
    INSERT INTO loan_requests (
      customer_id,
      branch_id,
      amount,
      tenure_months,
      purpose
    )
    SELECT
      c.customer_id,
      ?,
      ?,
      ?,
      ?
    FROM customers c
    WHERE c.user_id = ?
  `;

  const [result] = await db.promise().query(sql, [
    branchId,
    amount,
    tenureMonths,
    purpose || null,
    userId,
  ]);

  if (result.affectedRows === 0) {
    throw new Error("Customer profile not found");
  }

  return result.insertId;
};

/* ================================
   EMPLOYEE → Approve / Reject
   user_id → employee_id
================================ */
exports.employeeDecision = async ({
  loanId,
  userId,
  status,
  comment,
}) => {
  // Persist employee decision and attach acting employee_id.
  const sql = `
    UPDATE loan_requests
    SET
      status = ?,
      employee_id = (
        SELECT employee_id FROM employees WHERE user_id = ?
      ),
      employee_comment = ?
    WHERE loan_id = ?
  `;

  const [result] = await db.promise().query(sql, [
    status,
    userId,
    comment,
    loanId,
  ]);

  if (result.affectedRows === 0) {
    throw new Error("Employee profile not found or invalid loan");
  }
};

/* ================================
   MANAGER → Approve / Reject
   user_id → employee_id
================================ */
exports.managerDecision = async ({
  loanId,
  userId,
  status,
  comment,
}) => {
  const conn = db.promise();
  try {
    // Use transaction to keep loan status update + optional credit atomic.
    await conn.query("START TRANSACTION");

    /* Lock and read loan for payout info */
    const [loanRows] = await conn.query(
      `SELECT customer_id, amount FROM loan_requests WHERE loan_id = ? FOR UPDATE`,
      [loanId],
    );
    if (loanRows.length === 0) {
      throw new Error("Invalid loan id");
    }
    const loan = loanRows[0];

    /* Update status + manager assignment */
    const [result] = await conn.query(
      `
        UPDATE loan_requests
        SET
          status = ?,
          manager_id = (SELECT employee_id FROM employees WHERE user_id = ?),
          manager_comment = ?
        WHERE loan_id = ?
      `,
      [status, userId, comment, loanId],
    );

    if (result.affectedRows === 0) {
      throw new Error("Manager profile not found or invalid loan");
    }

    /* Credit customer account only on approval */
    if (status === "MANAGER_APPROVED") {
      const [accountRows] = await conn.query(
        `
          SELECT account_id, account_type
          FROM accounts
          WHERE customer_id = ?
            AND status = 'ACTIVE'
          ORDER BY CASE account_type WHEN 'SAVINGS' THEN 0 ELSE 1 END, account_id
          LIMIT 1
        `,
        [loan.customer_id],
      );

      if (accountRows.length === 0) {
        throw new Error("No active account found for this customer");
      }

      const accountId = accountRows[0].account_id;
      const ref = `LN${Date.now()}${Math.floor(Math.random() * 1000)}`;

      await conn.query(
        `
          INSERT INTO transactions (
            from_account_id,
            to_account_id,
            amount,
            transaction_type,
            description,
            reference_number,
            status,
            created_at
          ) VALUES (
            NULL,
            ?,
            ?,
            'CREDIT',
            'loan amount credited',
            ?,
            'SUCCESS',
            NOW()
          )
        `,
        [accountId, loan.amount, ref],
      );

      await conn.query(
        `
          UPDATE accounts
          SET balance = balance + ?, updated_at = NOW()
          WHERE account_id = ?
        `,
        [loan.amount, accountId],
      );
    }

    await conn.query("COMMIT");
  } catch (err) {
    try {
      await conn.query("ROLLBACK");
    } catch (rollbackErr) {
      // swallow rollback errors to avoid masking the original issue
    }
    throw err;
  }
};

/* ================================
   LIST loans by status + branch
================================ */
exports.getLoansByStatus = async ({ status, branchId }) => {
  const sql = `
    SELECT *
    FROM loan_requests
    WHERE status = ?
      AND branch_id = ?
    ORDER BY created_at DESC
  `;

  const [rows] = await db.promise().query(sql, [status, branchId]);
  return rows;
};

/* ================================
   All loans for a branch (optional status filter)
================================ */
exports.getLoansByBranch = async ({ branchId, status }) => {
  const params = [branchId];
  let statusClause = "";
  if (status) {
    statusClause = "AND lr.status = ?";
    params.push(status);
  }

  const sql = `
    SELECT
      lr.*,
      c.first_name,
      c.last_name
    FROM loan_requests lr
    JOIN customers c ON lr.customer_id = c.customer_id
    WHERE lr.branch_id = ?
      ${statusClause}
    ORDER BY lr.created_at DESC
  `;

  const [rows] = await db.promise().query(sql, params);
  return rows;
};
/* ================================
   CUSTOMER → My Loans
================================ */
exports.getCustomerLoans = async (userId) => {
  const sql = `
    SELECT lr.*
    FROM loan_requests lr
    JOIN customers c ON lr.customer_id = c.customer_id
    WHERE c.user_id = ?
    ORDER BY lr.created_at DESC
  `;

  const [rows] = await db.promise().query(sql, [userId]);
  return rows;
};

/* ================================
   Loan History
================================ */
exports.getLoanHistory = async (loanId) => {
  const sql = `
    SELECT
      from_status,
      to_status,
      changed_by_role,
      comment,
      created_at
    FROM loan_status_history
    WHERE loan_id = ?
    ORDER BY created_at
  `;

  const [rows] = await db.promise().query(sql, [loanId]);
  return rows;
};
