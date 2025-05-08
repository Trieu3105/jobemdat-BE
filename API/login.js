const pool = require("../data/data.js"); // Import kết nối MySQL (phiên bản Promise)
const express = require("express");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
const cors = require("cors");

const router = express.Router();
const SECRET_KEY = process.env.JWT_SECRET ;

router.use(cookieParser());
router.use(cors({
  origin: process.env.CLIENT_URL || "http://localhost:3000", // Allow requests from the frontend
  credentials: true, // Allow cookies to be sent
}));

// API Login (Promise-based)
router.post("/login", async (req, res) => {
  const { username, password } = req.body;
  console.log(username);
  console.log(password);

  try {
    const [results] = await pool.query("SELECT * FROM users WHERE username = ?", [
      username,
    ]);

    if (results.length === 0) {
      return res.status(401).json({ message: "Invalid username or password" });
    }

    const user = results[0];
    if (user.password === password) {
      const token = jwt.sign(
        { username: user.username, role: user.role }, // Include role in token
        SECRET_KEY,
        { expiresIn: "24h" }
      );

      res.cookie("access_token", token, { httpOnly: true, maxAge: 3600000 });
      return res.status(200).json({ message: "Login successful", token });
    } else {
      return res.status(401).json({ message: "Invalid username or password" });
    }
  } catch (err) {
    console.error("Error fetching user:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// API Profile (Get user data via token)
router.get("/profile", async (req, res) => {
  const token = req.cookies?.access_token;
  if (!token) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    const decoded = jwt.verify(token, SECRET_KEY);
    const [userResults] = await pool.query("SELECT * FROM users WHERE username = ?", [
      decoded.username,
    ]);

    if (userResults.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    const user = userResults[0];
    const [playerResults] = await pool.query("SELECT * FROM players WHERE user_id = ?", [
      user.id,
    ]);

    const profileData = {
      ...user,
      players: playerResults, // Combine user data with players data
    };

    res.status(200).json(profileData);
  } catch (err) {
    console.error("Error fetching profile:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

module.exports = router;
