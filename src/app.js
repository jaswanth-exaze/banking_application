/**
 * Express app composition.
 * Registers global middleware and mounts all feature route groups.
 */

const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
require("./config/db");

const app = express();
const authRoutes = require("./routes/auth.routes");
const protectedRoutes = require("./routes/protected.routes");
const customerRoutes = require("./routes/customer.routes");
const employeeRoutes = require("./routes/employee.routes")
const managerRoutes= require("./routes/manager.routes")

// CORS policy for local development and deployed frontend.
const corsOptions = {
  origin: [
    "http://localhost:5500",
    "http://127.0.0.1:5500",
    "https://bankingapplicationfrontend.vercel.app"
  ],
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"]
};

app.use(cors(corsOptions));

// Parses incoming JSON request bodies.
app.use(express.json());
app.use(cookieParser());



// Health endpoint used by uptime checks and deployment validation.
app.get("/", (req, res) => {
  res.send("Banking backend API is running");
});

// Route mounting by domain module.
app.use("/auth", authRoutes);
app.use("/protected", protectedRoutes);
app.use("/customer", customerRoutes);
app.use("/employee",employeeRoutes);

app.use('/manager',managerRoutes);

module.exports = app;
