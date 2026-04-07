const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();

// =======================
// Middleware
// =======================
app.use(express.json());
app.use(cors());

// =======================
// MongoDB Connection
// =======================
mongoose.connect(process.env.MONGO_URI)
.then(() => {
console.log("MongoDB connected ✅");

const PORT = process.env.PORT || 10000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT} 🚀`);
});

})
.catch(err => {
console.error("MongoDB connection error ❌:", err);
});

// =======================
// User Model
// =======================
const userSchema = new mongoose.Schema({
name: String,
balance: {
type: Number,
default: 0
}
});

const User = mongoose.model("User", userSchema);

// =======================
// Routes
// =======================

// Home route (fixes "Cannot GET /")
app.get("/", (req, res) => {
res.json({
status: "OK",
message: "DWI Fintech Backend Running 🚀"
});
});

// Register
app.post("/register", async (req, res) => {
try {
const { name } = req.body;

    let user = await User.findOne({ name });

    if (user) {
        return res.json({ message: "User already exists" });
    }

    user = new User({ name, balance: 0 });
    await user.save();

    res.json({ message: "User registered", user });
} catch (err) {
    res.status(500).json({ error: err.message });
}

});

// Send money
app.post("/send", async (req, res) => {
try {
const { from, to, amount } = req.body;

    const sender = await User.findOne({ name: from });
    const receiver = await User.findOne({ name: to });

    if (!sender || !receiver) {
        return res.status(404).json({ error: "User not found" });
    }

    if (sender.balance < amount) {
        return res.status(400).json({ error: "Insufficient funds" });
    }

    sender.balance -= amount;
    receiver.balance += amount;

    await sender.save();
    await receiver.save();

    res.json({ message: "Transfer successful" });
} catch (err) {
    res.status(500).json({ error: err.message });
}

});

// Check balance
app.get("/balance", async (req, res) => {
try {
const { name } = req.query;

    const user = await User.findOne({ name });

    if (!user) {
        return res.status(404).json({ error: "User not found" });
    }

    res.json({ balance: user.balance });
} catch (err) {
    res.status(500).json({ error: err.message });
}

});

// Deposit
app.post("/deposit", async (req, res) => {
try {
const { name, amount } = req.body;

    const user = await User.findOne({ name });

    if (!user) {
        return res.status(404).json({ error: "User not found" });
    }

    user.balance += amount;
    await user.save();

    res.json({
        message: "Deposit successful",
        balance: user.balance
    });
} catch (err) {
    res.status(500).json({ error: err.message });
}

});

// Withdraw
app.post("/withdraw", async (req, res) => {
try {
const { name, amount } = req.body;

    const user = await User.findOne({ name });

    if (!user) {
        return res.status(404).json({ error: "User not found" });
    }

    if (user.balance < amount) {
        return res.status(400).json({ error: "Insufficient funds" });
    }

    user.balance -= amount;
    await user.save();

    res.json({
        message: "Withdraw successful",
        balance: user.balance
    });
} catch (err) {
    res.status(500).json({ error: err.message });
}

});