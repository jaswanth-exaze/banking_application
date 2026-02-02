const authService = require("../services/auth.service");

exports.test = (req, res) => {
  res.json({ message: "Auth module working" });
};

exports.login = async (req, res) => {
  try {
    const result = await authService.login(req.body);
    res.json(result);
  } catch (err) {
    res.status(401).json({ message: err.message });
  }
};
