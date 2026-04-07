const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const User = require("./models/User");

const app = express();

// =============================
// Middleware
// =============================
app.use(express.json());
app.use(cors());

// =============================
// MongoDB Connection
// =============================
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connected ✅"))
  .catch(err => console.log(err));

// =============================
// JWT Secret
// =============================
const JWT_SECRET = "mysecretkey";

// =============================
// Auth Middleware
// =============================
const auth = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({ message: "No token provided" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ message: "Invalid token" });
  }
};

// =============================
// Routes
// =============================

// ✅ Register
app.post("/api/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;

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

    const userResponse = user.toObject();
    delete userResponse.password;

    res.json({
      message: "User registered successfully",
      user: userResponse
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ✅ Login
app.post("/api/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "User not found" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid password" });
    }

    const token = jwt.sign(
      { id: user._id },
      JWT_SECRET,
      { expiresIn: "1d" }
    );

    const userResponse = user.toObject();
    delete userResponse.password;

    res.json({
      message: "Login successful",
      token,
      user: userResponse
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// =============================
// 💰 Deposit
// =============================
app.post("/api/deposit", auth, async (req, res) => {
  try {
    const { amount } = req.body;

    const user = await User.findById(req.user.id);

    user.balance += amount;
    await user.save();

    res.json({
      message: "Deposit successful",
      balance: user.balance
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// =============================
// 💸 Withdraw
// =============================
app.post("/api/withdraw", auth, async (req, res) => {
  try {
    const { amount } = req.body;

    const user = await User.findById(req.user.id);

    if (user.balance < amount) {
      return res.status(400).json({ message: "Insufficient funds" });
    }

    user.balance -= amount;
    await user.save();

    res.json({
      message: "Withdrawal successful",
      balance: user.balance
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// =============================
// 👤 Profile
// =============================
app.get("/api/profile", auth, async (req, res) => {
  const user = await User.findById(req.user.id).select("-password");

  res.json({
    user
  });
});

// =============================
// Start Server
// =============================
const PORT = process.env.PORT || 10000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});