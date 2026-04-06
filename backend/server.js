const express = require("express");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 10000;

// 🔥 In-memory database (for now)
let users = {};

// 👉 Create account
app.post("/register", (req, res) => {
  const { username } = req.body;

  if (!username) {
    return res.json({ error: "Username required" });
  }

  if (users[username]) {
    return res.json({ error: "User already exists" });
  }

  users[username] = { balance: 0 };

  res.json({ message: "User created", user: username });
});

// 👉 Get balance
app.get("/balance/:username", (req, res) => {
  const user = users[req.params.username];

  if (!user) {
    return res.json({ error: "User not found" });
  }

  res.json({ balance: user.balance });
});

// 👉 Deposit
app.post("/deposit", (req, res) => {
  const { username, amount } = req.body;

  const user = users[username];

  if (!user) {
    return res.json({ error: "User not found" });
  }

  user.balance += amount;

  res.json({ message: "Deposit successful", balance: user.balance });
});

// 👉 Withdraw
app.post("/withdraw", (req, res) => {
  const { username, amount } = req.body;

  const user = users[username];

  if (!user) {
    return res.json({ error: "User not found" });
  }

  if (user.balance < amount) {
    return res.json({ error: "Insufficient balance" });
  }

  user.balance -= amount;

  res.json({ message: "Withdraw successful", balance: user.balance });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});