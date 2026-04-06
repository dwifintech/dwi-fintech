const express = require("express");
const app = express();

// use Render port (VERY IMPORTANT)
const PORT = process.env.PORT || 10000;

// middleware
app.use(express.json());

// test route
app.get("/", (req, res) => {
  res.send("Backend is running 🚀");
});

// start server
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
});