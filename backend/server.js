const express = require("express");
const cors = require("cors");

const app = express();

// middleware
app.use(cors());
app.use(express.json());

// use Render port
const PORT = process.env.PORT || 10000;

// 🧠 SIMPLE IN-MEMORY WALLET (for now)
let wallet = {
  balance: 0
};

// ✅ TEST ROUTE
app.get("/", (req, res) => {
  res.send("Backend is running 🚀");
});

// ✅ GET BALANCE
app.get("/balance", (req, res) => {
  res.json({ balance: wallet.balance });
});

// ✅ DEPOSIT
app.post("/deposit", (req, res) => {
  const { amount } = req.body;

  if (!amount || amount <= 0) {
    return res.status(400).json({ error: "Invalid amount" });
  }

  wallet.balance += amount;

  res.json({
    message: "Deposit successful",
    balance: wallet.balance
  });
});

// ✅ WITHDRAW
app.post("/withdraw", (req, res) => {
  const { amount } = req.body;

  if (!amount || amount <= 0) {
    return res.status(400).json({ error: "Invalid amount" });
  }

  if (amount > wallet.balance) {
    return res.status(400).json({ error: "Insufficient balance" });
  }

  wallet.balance -= amount;

  res.json({
    message: "Withdraw successful",
    balance: wallet.balance
  });
});

// start server
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
});