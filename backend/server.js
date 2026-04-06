const express = require("express");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());

// Test route (VERY IMPORTANT for Render detection)
app.get("/", (req, res) => {
  res.send("API is running");
});

// Data
let balance = 200;

// Routes
app.get("/balance", (req, res) => {
  res.json({ balance });
});

app.post("/deposit", (req, res) => {
  const { amount } = req.body;

  if (!amount || amount <= 0) {
    return res.status(400).json({ message: "Invalid amount" });
  }

  balance += Number(amount);
  res.json({ message: "Deposit successful", balance });
});

app.post("/withdraw", (req, res) => {
  const { amount } = req.body;

  if (!amount || amount <= 0) {
    return res.status(400).json({ message: "Invalid amount" });
  }

  if (amount > balance) {
    return res.status(400).json({ message: "Insufficient balance" });
  }

  balance -= Number(amount);
  res.json({ message: "Withdraw successful", balance });
});

// 🔥 CRITICAL FIX
const PORT = process.env.PORT;

app.listen(PORT, () => {
  console.log("Server running on port " + PORT);
});