const db = require("../config/db");
const { comparePassword } = require("../utils/password.util");
const { generateToken } = require("../utils/jwt.util");

exports.login = ({ username, password }) => {
  return new Promise((resolve, reject) => {

    if (!username || !password) {
      return reject(new Error("Username and password required"));
    }

    const cleanUsername = username.trim().toLowerCase();



    const sql = `
      SELECT u.user_id, u.username, u.password_hash,
             r.role_name, u.branch_id
      FROM users u
      JOIN roles r ON u.role_id = r.role_id
      WHERE u.username = ?
    `;

    db.query(sql, [cleanUsername], async (err, rows) => {
      if (err) {
        console.log("DB ERROR:", err);
        return reject(new Error("Invalid credentials"));
      }

      if (rows.length === 0) {
        console.log("NO USER FOUND");
        return reject(new Error("Invalid credentials"));
      }

      const user = rows[0];


      const isValid = await comparePassword(password, user.password_hash);

      if (!isValid) {
        return reject(new Error("Invalid credentials"));
      }

      const token = generateToken({
        user_id: user.user_id,
        role: user.role_name,
        branch_id: user.branch_id
        
      });

      resolve({
        message: "Login successful",
        token,
        role: user.role_name
      });
    });
  });
};
