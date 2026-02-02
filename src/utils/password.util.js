const bcrypt = require("bcrypt");

exports.comparePassword = (plain, hash) => {
  return bcrypt.compare(plain, hash);
};

