const express = require("express");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());

// Root route (important for Render)
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

// 🔥 FINAL FIX (THIS IS THE ONE THAT WORKS)
const PORT = process.env.PORT || 10000;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
});