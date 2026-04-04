const express = require("express");
const fs = require("fs");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

const DB_FILE = "db.json";

function loadDB(){
  return JSON.parse(fs.readFileSync(DB_FILE));
}

function saveDB(data){
  fs.writeFileSync(DB_FILE, JSON.stringify(data,null,2));
}

// REGISTER
app.post("/register",(req,res)=>{
  let db = loadDB();

  if(db.users.find(u=>u.email===req.body.email)){
    return res.send("User exists");
  }

  db.users.push({
    email:req.body.email,
    password:req.body.password,
    balance:0,
    internet:[],
    services:[]
  });

  saveDB(db);
  res.send("Registered");
});

// LOGIN
app.post("/login",(req,res)=>{
  let db = loadDB();

  let user = db.users.find(u =>
    u.email===req.body.email &&
    u.password===req.body.password
  );

  if(!user) return res.send("Invalid login");

  res.json({email:user.email});
});

// DASHBOARD
app.post("/dashboard",(req,res)=>{
  let db = loadDB();
  let user = db.users.find(u=>u.email===req.body.email);

  let spent = user.internet.reduce((a,b)=>a+b.price,0);

  res.json({
    balance:user.balance,
    totalSpent:spent,
    plans:user.internet.length
  });
});

// GET PLANS
app.get("/plans",(req,res)=>{
  let db = loadDB();
  res.json(db.plans);
});

// BUY HOTSPOT
app.post("/buy-hotspot",(req,res)=>{
  let db = loadDB();
  let user = db.users.find(u=>u.email===req.body.email);

  let plan = db.plans.hotspot.find(p=>p.name===req.body.plan);

  if(!plan) return res.send("Plan not found");

  if(user.balance < plan.price){
    return res.send("Insufficient balance");
  }

  user.balance -= plan.price;

  user.internet.push({
    type:"hotspot",
    name:plan.name,
    price:plan.price,
    date:new Date().toLocaleString()
  });

  saveDB(db);
  res.send("Hotspot activated");
});

// BUY PPPoE
app.post("/buy-pppoe",(req,res)=>{
  let db = loadDB();
  let user = db.users.find(u=>u.email===req.body.email);

  let plan = db.plans.pppoe.find(p=>p.name===req.body.plan);

  if(!plan) return res.send("Plan not found");

  if(user.balance < plan.price){
    return res.send("Insufficient balance");
  }

  user.balance -= plan.price;

  user.internet.push({
    type:"pppoe",
    name:plan.name,
    price:plan.price,
    date:new Date().toLocaleString()
  });

  saveDB(db);
  res.send("PPPoE activated");
});

// GET SERVICES
app.get("/services",(req,res)=>{
  let db = loadDB();
  res.json(db.services);
});

// USE SERVICE (optional tracking)
app.post("/use-service",(req,res)=>{
  let db = loadDB();
  let user = db.users.find(u=>u.email===req.body.email);

  user.services.push({
    name:req.body.name,
    date:new Date().toLocaleString()
  });

  saveDB(db);
  res.send("Service accessed");
});

// WALLET
app.post("/deposit",(req,res)=>{
  let db = loadDB();

  db.deposits.push({
    email:req.body.email,
    amount:Number(req.body.amount),
    status:"pending",
    date:new Date().toLocaleString()
  });

  saveDB(db);
  res.send("Deposit requested");
});

app.post("/withdraw",(req,res)=>{
  let db = loadDB();
  let user = db.users.find(u=>u.email===req.body.email);

  let amount = Number(req.body.amount);

  if(user.balance < amount){
    return res.send("Insufficient balance");
  }

  db.withdrawals.push({
    email:req.body.email,
    amount,
    status:"pending",
    date:new Date().toLocaleString()
  });

  saveDB(db);
  res.send("Withdrawal requested");
});

// HISTORY
app.post("/history",(req,res)=>{
  let db = loadDB();
  let email = req.body.email;
  let user = db.users.find(u=>u.email===email);

  res.json({
    deposits:db.deposits.filter(d=>d.email===email),
    withdrawals:db.withdrawals.filter(w=>w.email===email),
    internet:user.internet,
    services:user.services
  });
});

app.listen(3000,()=>console.log("Server running"));