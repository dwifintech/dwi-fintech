const express = require("express");
const fs = require("fs");
const path = require("path");
const cors = require("cors");

const app = express();
app.use(express.json());
app.use(cors());

// ✅ FIXED DB PATH (VERY IMPORTANT)
const DB_FILE = path.join(__dirname, "db.json");

// Load DB
function loadDB() {
  if (!fs.existsSync(DB_FILE)) {
    return { users: {} };
  }
  const data = fs.readFileSync(DB_FILE);
  return JSON.parse(data);
}

// Save DB
function saveDB(data) {
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
}

// Root route
app.get("/", (req, res) => {
  res.send("Backend is running 🚀");
});

// Register user
app.post("/register", (req, res) => {
  const { username } = req.body;
  const db = loadDB();

  if (!username) {
    return res.status(400).json({ error: "Username required" });
  }

  if (db.users[username]) {
    return res.status(400).json({ error: "User already exists" });
  }

  db.users[username] = { balance: 0 };
  saveDB(db);

  res.json({ message: "User created", user: username });
});

// Check balance
app.post("/balance", (req, res) => {
  const { username } = req.body;
  const db = loadDB();

  if (!db.users[username]) {
    return res.status(404).json({ error: "User not found" });
  }

  res.json({ balance: db.users[username].balance });
});

// Deposit
app.post("/deposit", (req, res) => {
  const { username, amount } = req.body;
  const db = loadDB();

  if (!db.users[username]) {
    return res.status(404).json({ error: "User not found" });
  }

  db.users[username].balance += Number(amount);
  saveDB(db);

  res.json({ balance: db.users[username].balance });
});

// Withdraw
app.post("/withdraw", (req, res) => {
  const { username, amount } = req.body;
  const db = loadDB();

  if (!db.users[username]) {
    return res.status(404).json({ error: "User not found" });
  }

  if (db.users[username].balance < amount) {
    return res.status(400).json({ error: "Insufficient funds" });
  }

  db.users[username].balance -= Number(amount);
  saveDB(db);

  res.json({
    message: "Withdraw successful",
    balance: db.users[username].balance,
  });
});

// Transfer
app.post("/transfer", (req, res) => {
  const { from, to, amount } = req.body;
  const db = loadDB();

  if (!db.users[from] || !db.users[to]) {
    return res.status(404).json({ error: "User not found" });
  }

  if (db.users[from].balance < amount) {
    return res.status(400).json({ error: "Insufficient funds" });
  }

  db.users[from].balance -= Number(amount);
  db.users[to].balance += Number(amount);

  saveDB(db);

  res.json({
    message: "Transfer successful",
    fromBalance: db.users[from].balance,
    toBalance: db.users[to].balance,
  });
});

// ✅ PORT FIX (RENDER SAFE)
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("Server running on port " + PORT);
});