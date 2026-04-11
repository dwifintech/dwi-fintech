require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const cors = require("cors");
const axios = require("axios");

const app = express();

// =====================
// MIDDLEWARE
// =====================
app.use(express.json());
app.use(cors());

// =====================
// DB CONNECT
// =====================
mongoose.connect(process.env.MONGO_URI,{
useNewUrlParser:true,
useUnifiedTopology:true
})
.then(()=>console.log("✅ MongoDB connected"))
.catch(err=>{
console.log("❌ Mongo error:",err);
process.exit(1);
});

// =====================
// MODELS
// =====================
const User = mongoose.model("User", new mongoose.Schema({
email:{type:String, unique:true},
password:String,
balance:{type:Number, default:0},
subBalance:{type:Number, default:0}
},{timestamps:true}));

const Investment = mongoose.model("Investment", new mongoose.Schema({
user:{ type: mongoose.Schema.Types.ObjectId, ref:"User"},
amount:Number,
type:String,
profit:{type:Number, default:0},
active:{type:Boolean, default:true}
},{timestamps:true}));

const Trade = mongoose.model("Trade", new mongoose.Schema({
type:String,
amount:Number,
buyPrice:Number,
sellPrice:Number,
profit:Number,
result:String
},{timestamps:true}));

// =====================
// AUTH MIDDLEWARE
// =====================
const auth = (req,res,next)=>{
try{
const token = req.headers.authorization?.split(" ")[1];
if(!token) return res.status(401).json({message:"No token"});

const decoded = jwt.verify(token, process.env.JWT_SECRET);
req.user = decoded.id;
next();

}catch(err){
res.status(401).json({message:"Unauthorized"});
}
};

// =====================
// AUTH ROUTES
// =====================
app.post("/api/register", async(req,res)=>{
try{
const {email,password} = req.body;

if(!email || !password){
  return res.status(400).json({message:"Missing fields"});
}

const exist = await User.findOne({email});
if(exist) return res.status(400).json({message:"User exists"});

const hash = await bcrypt.hash(password,10);

await User.create({
  email,
  password:hash,
  balance:1000 // 🎁 starter balance
});

res.json({message:"Registered successfully"});

}catch(err){
res.status(500).json({message:"Server error"});
}
});

app.post("/api/login", async(req,res)=>{
try{
const {email,password} = req.body;

const user = await User.findOne({email});
if(!user) return res.status(400).json({message:"User not found"});

const ok = await bcrypt.compare(password,user.password);
if(!ok) return res.status(400).json({message:"Wrong password"});

const token = jwt.sign(
  {id:user._id},
  process.env.JWT_SECRET,
  {expiresIn:"7d"}
);

res.json({token});

}catch{
res.status(500).json({message:"Login error"});
}
});

app.get("/api/me", auth, async(req,res)=>{
const user = await User.findById(req.user).select("-password");
res.json(user);
});

// =====================
// WALLET
// =====================
app.post("/api/move-to-sub", auth, async(req,res)=>{
const {amount} = req.body;
const user = await User.findById(req.user);

if(user.balance < amount){
return res.json({message:"Insufficient"});
}

user.balance -= amount;
user.subBalance += amount;

await user.save();

res.json({message:"Moved"});
});

app.post("/api/sub-to-wallet", auth, async(req,res)=>{
const {amount} = req.body;
const user = await User.findById(req.user);

if(user.subBalance < amount){
return res.json({message:"Insufficient"});
}

user.subBalance -= amount;
user.balance += amount;

await user.save();

res.json({message:"Moved"});
});

// =====================
// INVEST
// =====================
app.post("/api/invest", auth, async(req,res)=>{
const {amount,type} = req.body;
const user = await User.findById(req.user);

if(user.subBalance < amount){
return res.json({message:"Insufficient"});
}

user.subBalance -= amount;
await user.save();

const inv = await Investment.create({
user:user._id,
amount,
type
});

res.json({message:"Investment started", inv});
});

// =====================
// BINANCE MARKET
// =====================
async function fetchMarket(type){
try{
const res = await axios.post(
"https://p2p.binance.com/bapi/c2c/v2/friendly/c2c/adv/search",
{
asset:"USDT",
fiat:"UGX",
tradeType:type,
page:1,
rows:5
}
);
return res.data.data;
}catch{
return [];
}
}

function analyze(buy,sell){
if(!buy.length || !sell.length){
return {message:"No data"};
}

const bestBuy = parseFloat(buy[0].adv.price);
const bestSell = parseFloat(sell[0].adv.price);

const spread = bestSell - bestBuy;

return {
bestBuy,
bestSell,
spread,
signal: spread > 100 ? "STRONG" : spread > 50 ? "TRADE" : "WAIT"
};
}

app.get("/api/market", async(req,res)=>{
const buy = await fetchMarket("BUY");
const sell = await fetchMarket("SELL");
res.json(analyze(buy,sell));
});

// =====================
// TRADE
// =====================
app.post("/api/trade", async(req,res)=>{
const {type,amount,buyPrice,sellPrice} = req.body;

const profit = (sellPrice - buyPrice) * amount;
const result = profit >=0 ? "WIN":"LOSS";

await Trade.create({type,amount,buyPrice,sellPrice,profit,result});

const investments = await Investment.find({type, active:true});
const total = investments.reduce((s,i)=>s+i.amount,0);

if(total > 0){
for(let inv of investments){
const share = inv.amount / total;
const userProfit = profit * share * 0.7;

  inv.profit += userProfit;
  await inv.save();

  const user = await User.findById(inv.user);
  user.subBalance += userProfit;
  await user.save();
}

}

res.json({message:"Trade processed"});
});

// =====================
// PERFORMANCE
// =====================
app.get("/api/performance", async(req,res)=>{
const trades = await Trade.find();

const total = trades.reduce((s,t)=>s+t.profit,0);
const wins = trades.filter(t=>t.result==="WIN").length;

res.json({
totalProfit: total,
totalTrades: trades.length,
winRate: trades.length ? (wins/trades.length*100).toFixed(2):0
});
});

// =====================
// ROOT
// =====================
app.get("/",(req,res)=>{
res.send("🚀 DWI FINTECH API LIVE");
});

// =====================
// START SERVER
// =====================
const PORT = process.env.PORT || 10000;

app.listen(PORT, ()=>{
console.log("🔥 Server running on", PORT);
});