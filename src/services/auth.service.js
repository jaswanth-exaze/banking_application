/**
 * Auth service.
 * Validates credentials against DB and returns JWT/session payload.
 */

const db = require("../config/db");
const { comparePassword } = require("../utils/password.util");
const {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} = require("../utils/jwt.util");
const crypto = require("crypto");

const USER_BY_USERNAME_SQL = `
  SELECT u.user_id, u.username, u.password_hash, u.branch_id, r.role_name
  FROM users u
  JOIN roles r ON u.role_id = r.role_id
  WHERE u.username = ? AND u.is_active = 1
`;

const USER_BY_ID_SQL = `
  SELECT u.user_id, u.branch_id, r.role_name
  FROM users u
  JOIN roles r ON u.role_id = r.role_id
  WHERE u.user_id = ? AND u.is_active = 1
`;

const INSERT_REFRESH_TOKEN_SQL = `
  INSERT INTO refresh_tokens (user_id, token, expires_at, is_revoked, created_at)
  VALUES (?, ?, ?, false, NOW())
`;

const REFRESH_TOKEN_LOOKUP_SQL = `
  SELECT id, user_id, is_revoked, expires_at
  FROM refresh_tokens
  WHERE token = ? AND user_id = ?
  LIMIT 1
  FOR UPDATE
`;

const REVOKE_REFRESH_TOKEN_BY_ID_SQL = `
  UPDATE refresh_tokens
  SET is_revoked = true
  WHERE id = ?
`;

const REVOKE_REFRESH_TOKEN_BY_HASH_SQL = `
  UPDATE refresh_tokens
  SET is_revoked = true
  WHERE token = ?
`;

// Hashes refresh tokens before storing them in DB.
const hashRefreshToken = (token) => {
  return crypto.createHash("sha256").update(token).digest("hex");
};

// Returns refresh-token expiry timestamp used for DB persistence.
const getRefreshTokenExpiry = () => {
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);
  return expiresAt;
};

// Generates an access token from canonical user auth claims.
const buildAccessToken = (user) => {
  return generateAccessToken({
    user_id: user.user_id,
    role: user.role_name,
    branch_id: user.branch_id,
  });
};

// Authenticates user credentials and builds login response data.
exports.login = async ({ username, password }) => {
  if (!username || !password) {
    throw new Error("Username and password required");
  }

  const cleanUsername = username.trim().toLowerCase();

  let rows;
  try {
    [rows] = await db.promise().query(USER_BY_USERNAME_SQL, [cleanUsername]);
  } catch (err) {
    console.log("DB ERROR:", err);
    throw new Error("Invalid credentials");
  }

  if (!rows.length) {
    throw new Error("Invalid credentials");
  }

  const user = rows[0];
  const isValid = await comparePassword(password, user.password_hash);

  if (!isValid) {
    throw new Error("Invalid credentials");
  }

  const token = buildAccessToken(user);
  const refreshToken = generateRefreshToken({ user_id: user.user_id });
  const hashedRefreshToken = hashRefreshToken(refreshToken);

  await db
    .promise()
    .query(INSERT_REFRESH_TOKEN_SQL, [
      user.user_id,
      hashedRefreshToken,
      getRefreshTokenExpiry(),
    ]);

  return {
    message: "Login successful",
    token,
    refreshToken,
    role: user.role_name,
  };
};

// Rotates refresh token, revokes old token, and returns a new access token pair.
exports.refreshAccessToken = async (refreshToken) => {
  if (!refreshToken) {
    throw new Error("Refresh token missing");
  }

  let decoded;
  try {
    decoded = verifyRefreshToken(refreshToken);
  } catch (err) {
    throw new Error("Invalid refresh token");
  }

  const hashedIncomingToken = hashRefreshToken(refreshToken);
  const connection = await db.promise().getConnection();

  try {
    await connection.beginTransaction();

    const [tokenRows] = await connection.query(REFRESH_TOKEN_LOOKUP_SQL, [
      hashedIncomingToken,
      decoded.user_id,
    ]);

    if (!tokenRows.length) {
      throw new Error("Refresh token not recognized");
    }

    const tokenRecord = tokenRows[0];

    if (tokenRecord.is_revoked) {
      throw new Error("Refresh token revoked");
    }

    if (new Date(tokenRecord.expires_at) <= new Date()) {
      throw new Error("Refresh token expired");
    }

    const [userRows] = await connection.query(USER_BY_ID_SQL, [decoded.user_id]);
    if (!userRows.length) {
      throw new Error("User not found");
    }

    const user = userRows[0];
    const nextAccessToken = buildAccessToken(user);
    const nextRefreshToken = generateRefreshToken({ user_id: user.user_id });
    const hashedNextRefreshToken = hashRefreshToken(nextRefreshToken);

    await connection.query(REVOKE_REFRESH_TOKEN_BY_ID_SQL, [tokenRecord.id]);
    await connection.query(INSERT_REFRESH_TOKEN_SQL, [
      user.user_id,
      hashedNextRefreshToken,
      getRefreshTokenExpiry(),
    ]);

    await connection.commit();

    return {
      message: "Token refreshed",
      token: nextAccessToken,
      refreshToken: nextRefreshToken,
      role: user.role_name,
    };
  } catch (err) {
    await connection.rollback();
    throw err;
  } finally {
    connection.release();
  }
};

// Revokes a refresh token represented by the plain token value from cookie.
exports.revokeRefreshToken = async (refreshToken) => {
  if (!refreshToken) return;

  const hashedRefreshToken = hashRefreshToken(refreshToken);

  await db
    .promise()
    .query(REVOKE_REFRESH_TOKEN_BY_HASH_SQL, [hashedRefreshToken]);
};
