const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const User = require("./models/User");

const app = express();

// ==============================
// MIDDLEWARE
// ==============================
app.use(cors());
app.use(express.json());

// ==============================
// DATABASE CONNECTION
// ==============================
mongoose.connect(process.env.MONGO_URI)
.then(() => console.log("MongoDB connected"))
.catch(err => console.log(err));

// ==============================
// AUTH MIDDLEWARE
// ==============================
const authMiddleware = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];

  if (!token) {
    return res.status(401).json({ message: "No token provided" });
  }

  try {
    const decoded = jwt.verify(token, "secretkey");
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ message: "Invalid token" });
  }
};

// ==============================
// ROOT
// ==============================
app.get("/", (req, res) => {
  res.json({ status: "OK", message: "Backend running 🚀" });
});

// ==============================
// REGISTER
// ==============================
app.post("/api/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // ✅ FIX: Validate inputs BEFORE hashing
    if (!name || !email || !password) {
      return res.status(400).json({ message: "All fields required" });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = new User({
      name,
      email,
      password: hashedPassword
    });

    await user.save();

    res.json({
      message: "User registered successfully",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        balance: user.balance
      }
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ==============================
// LOGIN
// ==============================
app.post("/api/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "All fields required" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "User not found" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign(
      { id: user._id },
      "secretkey",
      { expiresIn: "1d" }
    );

    res.json({
      message: "Login successful",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        balance: user.balance
      }
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ==============================
// DEPOSIT
// ==============================
app.post("/api/deposit", authMiddleware, async (req, res) => {
  try {
    const { amount } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ message: "Invalid amount" });
    }

    const user = await User.findById(req.user.id);

    user.balance += amount;
    await user.save();

    res.json({
      message: "Deposit successful",
      balance: user.balance
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ==============================
// WITHDRAW
// ==============================
app.post("/api/withdraw", authMiddleware, async (req, res) => {
  try {
    const { amount } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ message: "Invalid amount" });
    }

    const user = await User.findById(req.user.id);

    if (user.balance < amount) {
      return res.status(400).json({ message: "Insufficient balance" });
    }

    user.balance -= amount;
    await user.save();

    res.json({
      message: "Withdrawal successful",
      balance: user.balance
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ==============================
// SERVER
// ==============================
const PORT = process.env.PORT || 10000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});