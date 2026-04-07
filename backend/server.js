// ===== IMPORTS =====
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();
app.use(express.json());
app.use(cors());

// ===== CONNECT TO MONGODB =====
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connected"))
  .catch(err => console.log(err));

// ===== USER MODEL =====
const userSchema = new mongoose.Schema({
  username: { type: String, unique: true },
  balance: { type: Number, default: 0 }
});

const User = mongoose.model("User", userSchema);

// ===== ROUTES =====

// 👉 REGISTER USER
app.post("/register", async (req, res) => {
  try {
    const { username } = req.body;

    let user = await User.findOne({ username });

    if (user) {
      return res.json({ message: "User already exists", user: username });
    }

    user = new User({ username, balance: 0 });
    await user.save();

    res.json({ message: "User created", user: username });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 👉 DEPOSIT
app.post("/deposit", async (req, res) => {
  try {
    const { username, amount } = req.body;

    const user = await User.findOne({ username });

    if (!user) {
      return res.json({ error: "User not found" });
    }

    user.balance += Number(amount);
    await user.save();

    res.json({ message: "Deposit successful", balance: user.balance });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 👉 WITHDRAW
app.post("/withdraw", async (req, res) => {
  try {
    const { username, amount } = req.body;

    const user = await User.findOne({ username });

    if (!user) {
      return res.json({ error: "User not found" });
    }

    if (user.balance < amount) {
      return res.json({ error: "Insufficient funds" });
    }

    user.balance -= Number(amount);
    await user.save();

    res.json({ message: "Withdraw successful", balance: user.balance });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 👉 SEND MONEY
app.post("/send", async (req, res) => {
  try {
    const { from, to, amount } = req.body;

    const sender = await User.findOne({ username: from });
    const receiver = await User.findOne({ username: to });

    if (!sender || !receiver) {
      return res.json({ error: "User not found" });
    }

    if (sender.balance < amount) {
      return res.json({ error: "Insufficient funds" });
    }

    sender.balance -= Number(amount);
    receiver.balance += Number(amount);

    await sender.save();
    await receiver.save();

    res.json({
      message: "Transfer successful",
      fromBalance: sender.balance,
      toBalance: receiver.balance
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 👉 CHECK BALANCE
app.get("/balance/:username", async (req, res) => {
  try {
    const user = await User.findOne({ username: req.params.username });

    if (!user) {
      return res.json({ error: "User not found" });
    }

    res.json({ balance: user.balance });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ===== START SERVER =====
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});