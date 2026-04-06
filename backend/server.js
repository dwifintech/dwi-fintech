const express = require("express");
const cors = require("cors");

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// In-memory balance (temporary storage)
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

// ✅ IMPORTANT FIX FOR RENDER
const PORT = process.env.PORT || 3000;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
});