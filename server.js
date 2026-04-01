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

// MY INVESTMENTS
app.post("/my-investments", (req, res) => {
  let db = loadDB();
  let user = db.users.find(u => u.email === req.body.email);

  res.json(user.investments);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Server running"));