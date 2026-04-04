const express = require("express");
const fs = require("fs");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

const DB_FILE = "db.json";

function loadDB() {
  return JSON.parse(fs.readFileSync(DB_FILE));
}

function saveDB(data) {
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
}

// REGISTER
app.post("/register", (req, res) => {
  const { email, password } = req.body;
  let db = loadDB();

  if (db.users.find(u => u.email === email)) {
    return res.send("User already exists");
  }

  db.users.push({
    email,
    password,
    balance: 0,
    investments: []
  });

  saveDB(db);
  res.send("Registered successfully");
});

// LOGIN
app.post("/login", (req, res) => {
  const { email, password } = req.body;
  let db = loadDB();

  let user = db.users.find(u => u.email === email && u.password === password);

  if (!user) return res.send("Invalid login");

  res.json({ email });
});

// DASHBOARD
app.post("/dashboard", (req, res) => {
  let db = loadDB();
  let user = db.users.find(u => u.email === req.body.email);

  res.json({
    available: user.balance
  });
});

// PLANS
app.get("/plans", (req, res) => {
  let db = loadDB();
  res.json(db.plans);
});

// INVEST
app.post("/invest", (req, res) => {
  let db = loadDB();
  let user = db.users.find(u => u.email === req.body.email);

  let amount = Number(req.body.amount);
  let profit = Math.floor(Math.random()*20);

  user.investments.push({
    type: req.body.planName,
    amount,
    profit,
    date: new Date().toLocaleString()
  });

  saveDB(db);
  res.send("Investment successful");
});

// ================= WALLET =================

// DEPOSIT
app.post("/deposit", (req, res) => {
  let db = loadDB();

  db.deposits.push({
    email: req.body.email,
    amount: Number(req.body.amount),
    status: "pending",
    date: new Date().toLocaleString()
  });

  saveDB(db);
  res.send("Deposit request submitted");
});

// WITHDRAW
app.post("/withdraw", (req, res) => {
  let db = loadDB();
  let user = db.users.find(u => u.email === req.body.email);

  let amount = Number(req.body.amount);

  if(user.balance < amount){
    return res.send("Insufficient balance");
  }

  db.withdrawals.push({
    email: req.body.email,
    amount,
    status: "pending",
    date: new Date().toLocaleString()
  });

  saveDB(db);
  res.send("Withdrawal requested");
});

// ================= HISTORY =================

app.post("/history", (req, res) => {
  let db = loadDB();
  let email = req.body.email;

  let deposits = db.deposits.filter(d => d.email === email);
  let withdrawals = db.withdrawals.filter(w => w.email === email);
  let investments = db.users.find(u => u.email === email).investments;

  res.json({
    deposits,
    withdrawals,
    investments
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Server running"));