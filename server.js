const express = require("express");
const cors = require("cors");
const fs = require("fs");

const app = express();
app.use(cors());
app.use(express.json());

let db = {
  users: [],
  investments: [],
  withdrawals: [],
  plans: [
    { name: "Internet Basic", min: 50, lock: 30, type: "Internet", risk: "Low-Medium" },
    { name: "P2P Basic", min: 50, lock: 30, type: "P2P", risk: "Low" },
    { name: "Spot Basic", min: 50, lock: 30, type: "Spot", risk: "Medium" },
    { name: "Futures Basic", min: 50, lock: 30, type: "Futures", risk: "High" },
    { name: "Sports Basic", min: 50, lock: 30, type: "Sports", risk: "Medium" }
  ]
};

if (fs.existsSync("db.json")) {
  db = JSON.parse(fs.readFileSync("db.json"));
}

function saveDB() {
  fs.writeFileSync("db.json", JSON.stringify(db, null, 2));
}

// 🎲 DAILY RETURNS
function rand(min, max) {
  return Math.random() * (max - min) + min;
}

function getDailyReturn(type) {
  if (type === "Internet") return rand(0.001, 0.0027);
  if (type === "P2P") return rand(0.0007, 0.002);
  if (type === "Spot") return rand(-0.002, 0.004);
  if (type === "Futures") return rand(-0.005, 0.008);
  if (type === "Sports") return rand(-0.002, 0.005);
}

// REGISTER
app.post("/register", (req, res) => {
  const { email, password } = req.body;
  db.users.push({ email, password, balance: 0 });
  saveDB();
  res.send("Registered");
});

// LOGIN
app.post("/login", (req, res) => {
  const { email, password } = req.body;
  let user = db.users.find(u => u.email === email && u.password === password);
  if (!user) return res.status(400).send("Invalid login");
  res.json(user);
});

// DEPOSIT
app.post("/deposit", (req, res) => {
  const { email, amount } = req.body;
  let user = db.users.find(u => u.email === email);
  user.balance += Number(amount);
  saveDB();
  res.send("Deposit successful");
});

// PLANS
app.get("/plans", (req, res) => {
  res.json(db.plans);
});

// INVEST
app.post("/invest", (req, res) => {
  const { email, amount, planName } = req.body;

  let user = db.users.find(u => u.email === email);
  let plan = db.plans.find(p => p.name === planName);

  if (!user || !plan) return res.status(400).send("Invalid");
  if (user.balance < amount) return res.status(400).send("Insufficient");

  user.balance -= amount;

  db.investments.push({
    email,
    amount,
    type: plan.type,
    risk: plan.risk,
    lock: plan.lock,
    start: Date.now(),
    history: [],
    withdrawn: 0
  });

  saveDB();
  res.send("Investment started");
});

// CALCULATE PROFIT
function calculateProfit(inv) {
  let days = Math.floor((Date.now() - inv.start) / (1000*60*60*24));

  for (let i = inv.history.length; i < days; i++) {
    inv.history.push(getDailyReturn(inv.type));
  }

  let total = inv.history.reduce((s, r) => s + r, 0);
  return inv.amount * total;
}

// DASHBOARD
app.post("/dashboard", (req, res) => {
  const { email } = req.body;

  let inv = db.investments.filter(i => i.email === email);

  let totalInvested = 0;
  let totalProfit = 0;
  let withdrawn = 0;

  inv.forEach(i => {
    let profit = calculateProfit(i);
    totalInvested += i.amount;
    totalProfit += profit;
    withdrawn += i.withdrawn;
  });

  res.json({
    totalInvested: totalInvested.toFixed(2),
    totalProfit: totalProfit.toFixed(2),
    withdrawn: withdrawn.toFixed(2),
    available: (totalProfit - withdrawn).toFixed(2)
  });
});

// INVESTMENTS
app.post("/my-investments", (req, res) => {
  const { email } = req.body;

  let data = db.investments.filter(i => i.email === email);

  let result = data.map(i => {
    let profit = calculateProfit(i);
    return {
      type: i.type,
      amount: i.amount,
      profit: profit.toFixed(2),
      days: i.history.length
    };
  });

  saveDB();
  res.json(result);
});

// CHART
app.post("/chart", (req, res) => {
  const { email, index } = req.body;
  let inv = db.investments.filter(i => i.email === email)[index];
  calculateProfit(inv);
  res.json(inv.history);
});

// WITHDRAW
app.post("/withdraw-profit", (req, res) => {
  const { email, index } = req.body;

  let inv = db.investments[index];
  let user = db.users.find(u => u.email === email);

  let days = Math.floor((Date.now() - inv.start) / (1000*60*60*24));
  if (days < inv.lock) return res.status(400).send("Still locked");

  let profit = calculateProfit(inv);
  let available = profit - inv.withdrawn;

  if (available <= 0) return res.status(400).send("No profit");

  user.balance += available;
  inv.withdrawn += available;

  saveDB();
  res.send("Withdrawn");
});

app.listen(3000, () => console.log("Server running"));