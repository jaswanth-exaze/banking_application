const express = require("express");
const cors = require("cors");
require("./config/db");

const app = express();
const authRoutes = require("./routes/auth.routes");
const protectedRoutes = require("./routes/protected.routes");
const customerRoutes = require("./routes/customer.routes");
const employeeRoutes = require("./routes/employee.routes")
const managerRoutes= require("./routes/manager.routes")

// Global middlewares
// CORS configuration - allow frontend domain in production
const corsOptions = {
  origin: process.env.FRONTEND_URL || '*', // Allow all origins in development, specific URL in production
  credentials: true,
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));
app.use(express.json());



// Health check route
app.get("/", (req, res) => {
  res.send("Banking backend API is running");
});

app.use("/auth", authRoutes);
app.use("/protected", protectedRoutes);
app.use("/customer", customerRoutes);
app.use("/employee",employeeRoutes);

app.use('/manager',managerRoutes);

module.exports = app;
