const express = require("express");
const cors = require("cors");

const app = express();

// enable CORS (VERY IMPORTANT FIX)
app.use(cors());

// port
const PORT = process.env.PORT || 10000;

// middleware
app.use(express.json());

// route
app.get("/", (req, res) => {
  res.send("Backend is running 🚀");
});

// start server
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
});