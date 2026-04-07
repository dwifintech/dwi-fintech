const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const User = require("./models/User");

const app = express();

/* =======================
   MIDDLEWARE (FIX)
======================= */
app.use(cors());
app.use(express.json()); // MUST come before routes

/* =======================
   ROOT ROUTE
======================= */
app.get("/", (req, res) => {
  res.send("DWI Fintech API is running 🚀");
});

/* =======================
   DATABASE
======================= */
mongoose.connect(process.env.MONGO_URI)
.then(() => console.log("MongoDB connected"))
.catch(err => console.log(err));

/* =======================
   AUTH MIDDLEWARE
======================= */
const auth = (req, res, next) => {
  try {
    const header = req.headers.authorization;

    if (!header) {
      return res.status(401).json({ message: "No token provided" });
    }

    const token = header.split(" ")[1];

    const decoded = jwt.verify(token, process.env.JWT_SECRET || "secretkey");

    req.user = decoded;
    next();

  } catch (err) {
    return res.status(401).json({ message: "Invalid token" });
  }
};

/* =======================
   REGISTER
======================= */
app.post("/api/register", async (req, res) => {
  console.log("BODY RECEIVED:", req.body); // DEBUG

  try {
    const { name, email, password } = req.body || {};

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
        name: user.name,
        email: user.email,
        balance: user.balance
      }
    });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/* =======================
   LOGIN
======================= */
app.post("/api/login", async (req, res) => {
  try {
    const { email, password } = req.body || {};

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
      process.env.JWT_SECRET || "secretkey",
      { expiresIn: "1d" }
    );

    res.json({
      message: "Login successful",
      token,
      user: {
        name: user.name,
        email: user.email,
        balance: user.balance
      }
    });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/* =======================
   DEPOSIT
======================= */
app.post("/api/deposit", auth, async (req, res) => {
  try {
    const { amount } = req.body || {};

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

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/* =======================
   WITHDRAW
======================= */
app.post("/api/withdraw", auth, async (req, res) => {
  try {
    const { amount } = req.body || {};

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
    /*
========================
TRANSFER
========================
*/
app.post("/api/transfer", auth, async (req, res) => {
  try {
    const { email, amount } = req.body || {};

    // Validate input
    if (!email || !amount || amount <= 0) {
      return res.status(400).json({ message: "Email and valid amount required" });
    }

    // Sender (logged-in user)
    const sender = await User.findById(req.user);

    if (!sender) {
      return res.status(404).json({ message: "Sender not found" });
    }

    if (sender.balance < amount) {
      return res.status(400).json({ message: "Insufficient balance" });
    }

    // Receiver
    const receiver = await User.findOne({ email });

    if (!receiver) {
      return res.status(404).json({ message: "Receiver not found" });
    }

    if (receiver._id.toString() === sender._id.toString()) {
      return res.status(400).json({ message: "Cannot transfer to yourself" });
    }

    // Transfer
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

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/* =======================
   SERVER
======================= */
const PORT = process.env.PORT || 10000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
