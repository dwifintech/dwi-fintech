const express = require("express");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const cors = require("cors");

const app = express();

/*
========================
MIDDLEWARE
========================
*/
app.use(express.json());
app.use(cors());

/*
========================
ROOT ROUTE (RESTORED)
========================
*/
app.get("/", (req, res) => {
  res.send("API is running 🚀");
});

/*
========================
DATABASE
========================
*/
mongoose.connect(process.env.MONGO_URI)
.then(() => console.log("MongoDB connected"))
.catch(err => console.log(err));

/*
========================
USER MODEL
========================
*/
const User = mongoose.model("User", new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  password: String,
  balance: { type: Number, default: 0 }
}));

/*
========================
AUTH MIDDLEWARE
========================
*/
const auth = (req, res, next) => {
  try {
    const header = req.headers.authorization;

    if (!header) {
      return res.status(401).json({ message: "No token provided" });
    }

    const token = header.split(" ")[1];

    const decoded = jwt.verify(token, process.env.JWT_SECRET || "secretkey");

    req.user = decoded.id; // ✅ FIXED

    next();

  } catch (err) {
    return res.status(401).json({ message: "Invalid token" });
  }
};

/*
========================
REGISTER
========================
*/
app.post("/api/register", async (req, res) => {
  try {
    const { name, email, password } = req.body || {};

    if (!name || !email || !password) {
      return res.status(400).json({ message: "All fields required" });
    }

    const exists = await User.findOne({ email });

    if (exists) {
      return res.status(400).json({ message: "User already exists" });
    }

    const hashed = await bcrypt.hash(password, 10);

    const user = new User({
      name,
      email,
      password: hashed
    });

    await user.save();

    res.json({ message: "Registered successfully" });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/*
========================
LOGIN
========================
*/
app.post("/api/login", async (req, res) => {
  try {
    const { email, password } = req.body || {};

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({ message: "User not found" });
    }

    const match = await bcrypt.compare(password, user.password);

    if (!match) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET || "secretkey",
      { expiresIn: "1d" }
    );

    res.json({
      message: "Login successful",
      token,
      user
    });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/*
========================
DEPOSIT
========================
*/
app.post("/api/deposit", auth, async (req, res) => {
  try {
    const { amount } = req.body || {};

    if (!amount || amount <= 0) {
      return res.status(400).json({ message: "Invalid amount" });
    }

    const user = await User.findById(req.user);

    user.balance += amount;
    await user.save();

    res.json({
      message: "Deposit successful",
      balance: user.balance
    });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/*
========================
WITHDRAW
========================
*/
app.post("/api/withdraw", auth, async (req, res) => {
  try {
    const { amount } = req.body || {};

    if (!amount || amount <= 0) {
      return res.status(400).json({ message: "Invalid amount" });
    }

    const user = await User.findById(req.user);

    if (user.balance < amount) {
      return res.status(400).json({ message: "Insufficient balance" });
    }

    user.balance -= amount;
    await user.save();

    res.json({
      message: "Withdrawal successful",
      balance: user.balance
    });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/*
========================
TRANSFER
========================
*/
app.post("/api/transfer", auth, async (req, res) => {
  try {
    const { email, amount } = req.body || {};

    if (!email || !amount || amount <= 0) {
      return res.status(400).json({ message: "Email and valid amount required" });
    }

    const sender = await User.findById(req.user);

    if (!sender) {
      return res.status(404).json({ message: "Sender not found" });
    }

    if (sender.balance < amount) {
      return res.status(400).json({ message: "Insufficient balance" });
    }

    const receiver = await User.findOne({ email });

    if (!receiver) {
      return res.status(404).json({ message: "Receiver not found" });
    }

    if (receiver._id.toString() === sender._id.toString()) {
      return res.status(400).json({ message: "Cannot transfer to yourself" });
    }

    sender.balance -= amount;
    receiver.balance += amount;

    await sender.save();
    await receiver.save();

    res.json({
      message: "Transfer successful",
      senderBalance: sender.balance
    });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/*
========================
SERVER
========================
*/
const PORT = process.env.PORT || 10000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});