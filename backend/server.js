const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const User = require("./models/User");

const app = express();

/* =======================
   🔥 MIDDLEWARE
======================= */
app.use(express.json()); // ✅ FIX (VERY IMPORTANT)
app.use(cors());

/* =======================
   DATABASE CONNECTION
======================= */
mongoose.connect(process.env.MONGO_URI || "mongodb://127.0.0.1:27017/dwi-fintech")
.then(() => console.log("MongoDB connected"))
.catch(err => console.log(err));

/* =======================
   AUTH MIDDLEWARE
======================= */
const auth = (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
      return res.status(401).json({ message: "No token provided" });
    }

    const decoded = jwt.verify(token, "secretkey"); // ⚠️ later move to env
    req.user = decoded;
    next();

  } catch (error) {
    res.status(401).json({ message: "Invalid token" });
  }
};

/* =======================
   REGISTER
======================= */
app.post("/api/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;

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

/* =======================
   LOGIN
======================= */
app.post("/api/login", async (req, res) => {
  try {
    const { email, password } = req.body;

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

/* =======================
   PROFILE
======================= */
app.get("/api/profile", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");

    res.json(user);

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/* =======================
   DEPOSIT
======================= */
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
    res.status(500).json({ message: error.message });
  }
});

/* =======================
   SERVER
======================= */
const PORT = process.env.PORT || 10000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});