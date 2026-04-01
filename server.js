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

  let totalInvested = user.investments.reduce((a,b)=>a+b.amount,0);
  let totalProfit = user.investments.reduce((a,b)=>a+b.profit,0);

  res.json({
    totalInvested,
    totalProfit,
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
    profit
  });

  saveDB(db);
  res.send("Investment successful");
});

// ================= WALLET =================

// DEPOSIT REQUEST
app.post("/deposit", (req, res) => {
  let db = loadDB();

  db.deposits.push({
    id: Date.now(),
    email: req.body.email,
    amount: Number(req.body.amount),
    status: "pending"
  });

  saveDB(db);
  res.send("Deposit request submitted");
});

// GET ALL DEPOSITS
app.get("/admin/deposits", (req, res) => {
  let db = loadDB();
  res.json(db.deposits);
});

// APPROVE DEPOSIT
app.post("/admin/approve-deposit", (req, res) => {
  let db = loadDB();

  let dep = db.deposits.find(d => d.id == req.body.id);
  if (!dep || dep.status !== "pending") return res.send("Invalid");

  let user = db.users.find(u => u.email === dep.email);

  user.balance += dep.amount;
  dep.status = "approved";

  saveDB(db);
  res.send("Deposit approved");
});

// WITHDRAW REQUEST
app.post("/withdraw", (req, res) => {
  let db = loadDB();
  let user = db.users.find(u => u.email === req.body.email);

  let amount = Number(req.body.amount);

  if(user.balance < amount){
    return res.send("Insufficient balance");
  }

  db.withdrawals.push({
    id: Date.now(),
    email: req.body.email,
    amount,
    status: "pending"
  });

  saveDB(db);
  res.send("Withdrawal requested");
});

// GET WITHDRAWALS
app.get("/admin/withdrawals", (req, res) => {
  let db = loadDB();
  res.json(db.withdrawals);
});

// APPROVE WITHDRAWAL
app.post("/admin/approve-withdraw", (req, res) => {
  let db = loadDB();

  let w = db.withdrawals.find(d => d.id == req.body.id);
  if (!w || w.status !== "pending") return res.send("Invalid");

  let user = db.users.find(u => u.email === w.email);

  user.balance -= w.amount;
  w.status = "approved";

  saveDB(db);
  res.send("Withdrawal approved");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Server running"));