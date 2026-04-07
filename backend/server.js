const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();

// ===============================
// MIDDLEWARE
// ===============================
app.use(cors());
app.use(express.json());

// ===============================
// USER MODEL
// ===============================
const User = require("./models/User");

// ===============================
// MONGODB CONNECTION
// ===============================
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connected ✅"))
  .catch(err => console.log(err));

// ===============================
// TEST ROUTE
// ===============================
app.get("/", (req, res) => {
  res.json({ status: "OK", message: "DWI Fintech Backend Running 🚀" });
});

// ===============================
// REGISTER
// ===============================
app.post("/api/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    const user = new User({
      name,
      email,
      password
    });

    await user.save();

    res.json({
      message: "User registered successfully",
      user
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

// ===============================
// LOGIN
// ===============================
app.post("/api/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "User not found" });
    }

    if (user.password !== password) {
      return res.status(400).json({ message: "Invalid password" });
    }

    res.json({
      message: "Login successful",
      user
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

// ===============================
// START SERVER
// ===============================
const PORT = process.env.PORT || 10000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT} 🚀`);
});