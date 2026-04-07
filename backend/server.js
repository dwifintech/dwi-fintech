const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bcrypt = require("bcryptjs");

const User = require("./models/User");

const app = express();

// ===============================
// Middleware
// ===============================
app.use(express.json());
app.use(cors());

// ===============================
// MongoDB connection
// ===============================
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connected"))
  .catch(err => console.log(err));

// ===============================
// REGISTER USER
// ===============================
app.post("/api/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = new User({
      name,
      email,
      password: hashedPassword
    });

    await user.save();

    // Remove password before sending response
    const { password: _, ...userWithoutPassword } = user._doc;

    res.json({
      message: "User registered successfully",
      user: userWithoutPassword
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ===============================
// TEST ROUTE
// ===============================
app.get("/", (req, res) => {
  res.json({ status: "OK", message: "DWI Fintech Backend Running 🚀" });
});

// ===============================
const PORT = process.env.PORT || 10000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});