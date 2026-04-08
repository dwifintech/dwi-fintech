const express = require("express");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const cors = require("cors");

const app = express();
app.use(express.json());
app.use(cors());

// ========================
// DB CONNECT
// ========================
mongoose.connect(process.env.MONGO_URI)
.then(() => console.log("MongoDB connected"))
.catch(err => console.log(err));

// ========================
// MODELS (IMPORTANT)
// ========================
const User = require("./models/User");
const Deposit = require("./models/Deposit");
const Withdraw = require("./models/Withdraw");

// ========================
// AUTH MIDDLEWARE
// ========================
const auth = (req, res, next) => {
  try {
    const header = req.headers.authorization;

    if (!header) {
      return res.status(401).json({ message: "No token" });
    }

    const token = header.split(" ")[1];

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "secretkey"
    );

    req.user = decoded.id;

    next();

  } catch (err) {
    return res.status(401).json({ message: "Invalid token" });
  }
};

// ========================
// ROOT
// ========================
app.get("/", (req, res) => {
  res.send("API is running 🚀");
});

// ========================
// REGISTER
// ========================
app.post("/api/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    const exist = await User.findOne({ email });
    if (exist) {
      return res.json({ message: "User already exists" });
    }

    const hashed = await bcrypt.hash(password, 10);

    await User.create({
      name,
      email,
      password: hashed,
      balance: 0
    });

    res.json({ message: "Registered successfully" });

  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// ========================
// LOGIN
// ========================
app.post("/api/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.json({ message: "User not found" });
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.json({ message: "Invalid credentials" });
    }

    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET || "secretkey",
      { expiresIn: "1d" }
    );

    res.json({ token });

  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// ========================
// GET USER (FIXED)
// ========================
app.get("/api/me", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({
      name: user.name,
      email: user.email,
      balance: user.balance
    });

  } catch (err) {
    console.log("ME ERROR:", err.message);
    res.status(500).json({ message: "Server error" });
  }
});

// ========================
// DEPOSIT (PENDING)
// ========================
app.post("/api/deposit", auth, async (req, res) => {
  try {
    const { amount } = req.body;

    if (!amount || amount <= 0) {
      return res.json({ message: "Invalid amount" });
    }

    const user = await User.findById(req.user);

    await Deposit.create({
      email: user.email,
      amount,
      status: "pending"
    });

    res.json({ message: "Deposit request submitted" });

  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// ========================
// WITHDRAW (PENDING)
// ========================
app.post("/api/withdraw", auth, async (req, res) => {
  try {
    const { amount } = req.body;

    const user = await User.findById(req.user);

    if (user.balance < amount) {
      return res.json({ message: "Insufficient balance" });
    }

    await Withdraw.create({
      email: user.email,
      amount,
      status: "pending"
    });

    res.json({ message: "Withdraw request submitted" });

  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// ========================
// TRANSFER
// ========================
app.post("/api/transfer", auth, async (req, res) => {
  try {
    const { email, amount } = req.body;

    const sender = await User.findById(req.user);
    const receiver = await User.findOne({ email });

    if (!receiver) {
      return res.json({ message: "Receiver not found" });
    }

    if (sender.balance < amount) {
      return res.json({ message: "Insufficient balance" });
    }

    sender.balance -= amount;
    receiver.balance += amount;

    await sender.save();
    await receiver.save();

    res.json({ message: "Transfer successful" });

  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// ========================
// ADMIN ROUTES
// ========================

// GET DEPOSITS
app.get("/admin/deposits", async (req, res) => {
  const data = await Deposit.find().sort({ createdAt: -1 });
  res.json(data);
});

// GET WITHDRAWALS
app.get("/admin/withdrawals", async (req, res) => {
  const data = await Withdraw.find().sort({ createdAt: -1 });
  res.json(data);
});

// APPROVE DEPOSIT
app.post("/admin/approve-deposit", async (req, res) => {
  try {
    const { id } = req.body;

    const deposit = await Deposit.findById(id);
    if (!deposit) return res.json({ message: "Not found" });

    if (deposit.status === "approved") {
      return res.json({ message: "Already approved" });
    }

    const user = await User.findOne({ email: deposit.email });

    user.balance += deposit.amount;
    await user.save();

    deposit.status = "approved";
    await deposit.save();

    res.json({ message: "Deposit approved" });

  } catch {
    res.status(500).json({ message: "Server error" });
  }
});

// APPROVE WITHDRAW
app.post("/admin/approve-withdraw", async (req, res) => {
  try {
    const { id } = req.body;

    const withdraw = await Withdraw.findById(id);
    if (!withdraw) return res.json({ message: "Not found" });

    if (withdraw.status === "approved") {
      return res.json({ message: "Already approved" });
    }

    const user = await User.findOne({ email: withdraw.email });

    user.balance -= withdraw.amount;
    await user.save();

    withdraw.status = "approved";
    await withdraw.save();

    res.json({ message: "Withdraw approved" });

  } catch {
    res.status(500).json({ message: "Server error" });
  }
});

// ========================
// SERVER
// ========================
const PORT = process.env.PORT || 10000;

app.listen(PORT, () => {
  console.log("Server running on port " + PORT);
});