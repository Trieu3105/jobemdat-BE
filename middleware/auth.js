const jwt = require("jsonwebtoken");

const authenticateToken = (req, res, next) => {
  const token =
    req.cookies.access_token || // lấy từ cookie
    req.headers["authorization"]?.split(" ")[1]; // hoặc từ header

  if (!token) {
    return res.status(401).json({ message: "Bạn chưa đăng nhập!" });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      console.error("Token verification error:", err.message);
      return res.status(403).json({ message: "Token không hợp lệ!" });
    }

    req.user = user; // lưu thông tin user đã giải mã vào req
    next(); // cho phép đi tiếp
  });
};

module.exports = authenticateToken;
