const express = require("express");
const cors = require("cors");
const fs = require("fs");

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 10000;

const DB_FILE = "./db.json";

// 👉 Load DB
function loadDB() {
  try {
    return JSON.parse(fs.readFileSync(DB_FILE));
  } catch {
    return { users: {} };
  }
}

// 👉 Save DB
function saveDB(data) {
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
}

// ✅ ROOT
app.get("/", (req, res) => {
  res.send("DWI Backend API is running 🚀");
});

// 👉 Register
app.post("/register", (req, res) => {
  const { username } = req.body;
  let db = loadDB();

  if (!username) {
    return res.json({ error: "Username required" });
  }

  if (db.users[username]) {
    return res.json({ error: "User already exists" });
  }

  db.users[username] = { balance: 0 };
  saveDB(db);

  res.json({ message: "User created", user: username });
});

// 👉 Balance
app.get("/balance/:username", (req, res) => {
  let db = loadDB();
  const user = db.users[req.params.username];

  if (!user) {
    return res.json({ error: "User not found" });
  }

  res.json({ balance: user.balance });
});

// 👉 Deposit
app.post("/deposit", (req, res) => {
  const { username, amount } = req.body;
  let db = loadDB();

  const user = db.users[username];

  if (!user) {
    return res.json({ error: "User not found" });
  }

  user.balance += amount;
  saveDB(db);

  res.json({ message: "Deposit successful", balance: user.balance });
});

// 👉 Withdraw
app.post("/withdraw", (req, res) => {
  const { username, amount } = req.body;
  let db = loadDB();

  const user = db.users[username];

  if (!user) {
    return res.json({ error: "User not found" });
  }

  if (user.balance < amount) {
    return res.json({ error: "Insufficient balance" });
  }

  user.balance -= amount;
  saveDB(db);

  res.json({ message: "Withdraw successful", balance: user.balance });
});

// 👉 Transfer
app.post("/transfer", (req, res) => {
  const { from, to, amount } = req.body;
  let db = loadDB();

  const sender = db.users[from];
  const receiver = db.users[to];

  if (!sender) {
    return res.json({ error: "Sender not found" });
  }

  if (!receiver) {
    return res.json({ error: "Receiver not found" });
  }

  if (sender.balance < amount) {
    return res.json({ error: "Insufficient balance" });
  }

  sender.balance -= amount;
  receiver.balance += amount;

  saveDB(db);

  res.json({
    message: "Transfer successful",
    fromBalance: sender.balance,
    toBalance: receiver.balance
  });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});