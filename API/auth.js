const pool = require("../data/data.js"); // Import kết nối MySQL (phiên bản Promise)
const express = require("express");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const authenticateToken = require("../middleware/auth.js")



const router = express.Router();
const SECRET_KEY = process.env.JWT_SECRET;

router.use(cookieParser());
router.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:3000", // Allow requests from the frontend
    credentials: true, // Allow cookies to be sent
  })
);

// API Login (Promise-based)
router.post("/login", async (req, res) => {
  console.log("Login request body:", req.body);
  const { username, password } = req.body;
  console.log(username);
  console.log(password);

  try {
    const [results] = await pool.query(
      "SELECT * FROM users WHERE username = ?",
      [username]
    );

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

      res.cookie("access_token", token, {
        httpOnly: false, // ⚠️ hoặc bỏ luôn để frontend JS có thể truy cập
        secure: true, // chỉ gửi cookie qua HTTPS
        sameSite: "none", // hoặc "None" nếu frontend/backend khác domain
        maxAge: 3600000,
      });
      return res.status(200).json({ message: "Login successful", token });
    } else {
      return res.status(401).json({ message: "Invalid username or password" });
    }
  } catch (err) {
    console.error("Error fetching user:", err);
    console.log("Received body:", req.body);
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/auth", authenticateToken, (req, res) => {
  res.status(200).json({ authenticated: true });
});

// API Profile (Get user data via token)
router.get("/profile", async (req, res) => {
  const token = req.cookies?.access_token;
  if (!token) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    const decoded = jwt.verify(token, SECRET_KEY);
    const [userResults] = await pool.query(
      "SELECT * FROM users WHERE username = ?",
      [decoded.username]
    );

    if (userResults.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    const user = userResults[0];
    const [playerResults] = await pool.query(
      "SELECT * FROM players WHERE user_id = ?",
      [user.id]
    );

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

router.post("/register", async (req, res) => {
  const { username, email, password } = req.body;

  if (!username || !email || !password) {
    return res.status(400).json({ message: "All fields are required" });
  }

  try {
    // Check if the username already exists
    const [existingUser] = await pool.query(
      "SELECT * FROM users WHERE username = ?",
      [username]
    );

    if (existingUser.length > 0) {
      return res.status(409).json({ message: "Username already exists" });
    }

    // Insert the new user into the database
    const [result] = await pool.query(
      "INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, ?)",
      [username, email, password, "user"] // Default role is "user"
    );

    if (result.affectedRows > 0) {
      return res.status(201).json({ message: "User registered successfully" });
    } else {
      return res.status(500).json({ message: "Failed to register user" });
    }
  } catch (err) {
    console.error("Error during registration:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
});

// POST /api/forgot-password
router.post("/forgot-password", async (req, res) => {
  const { email } = req.body;

  try {
    // 1. Tìm user theo email
    const [rows] = await pool.query("SELECT * FROM users WHERE email = ?", [
      email,
    ]);
    const user = rows[0];

    if (!user) {
      return res
        .status(404)
        .json({ message: "Email không tồn tại trong hệ thống." });
    }

    // 2. Tạo token reset dạng JWT
    const resetToken = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    // 3. Trả token về cho frontend
    res.json({
      message: "Xác thực email thành công.",
      token: resetToken, // Frontend sẽ dùng để redirect sang /reset-password?token=...
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Lỗi hệ thống." });
  }
});

// POST /api/reset-password
router.post("/reset-password", async (req, res) => {
  const { token, newPassword } = req.body;

  if (!token || !newPassword) {
    return res.status(400).json({ message: "Thiếu token hoặc mật khẩu mới." });
  }

  try {
    // 1. Giải mã token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.id;

    // 2. Cập nhật mật khẩu trực tiếp (không hash)
    await pool.query("UPDATE users SET password = ? WHERE id = ?", [
      newPassword, // Sử dụng mật khẩu không hash
      userId,
    ]);

    return res.status(200).json({ message: "Cập nhật mật khẩu thành công." });
  } catch (err) {
    console.error("Lỗi xác minh token:", err);
    return res
      .status(400)
      .json({ message: "Token không hợp lệ hoặc đã hết hạn." });
  }
});

module.exports = router;
