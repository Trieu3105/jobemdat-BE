// index.js
const express = require("express");
const app = express();
const cors = require("cors");
require("dotenv").config({
  path:
    process.env.NODE_ENV === "production"
      ? ".env.production"
      : ".env.development",
});
const loginRouter = require("./API/auth");
const giftcodeRouter = require("./API/giftcode");
const paymentRouter = require("./API/payment");
const contentRouter = require("./API/posts");

const PORT = process.env.PORT || 8080;

router.use(
  cors({
    origin: `${process.env.CLIENT_URL}`, // Đảm bảo chỉ cho phép URL frontend của bạn
    credentials: true, // Cho phép cookie được gửi cùng yêu cầu
    methods: ["GET", "POST", "OPTIONS"], // Cho phép các phương thức cụ thể
    allowedHeaders: ["Content-Type", "Authorization"], // Cho phép các header cụ thể
  })
);

app.use(cors(corsOptions)); // Apply CORS options globally
app.use(express.json());

app.get("/api/ping", (req, res) => {
  res.json({ message: "pong" });
});

app.use("/api/", loginRouter);
app.use("/api/", giftcodeRouter);
app.use("/api/", paymentRouter);
app.use("/api/", contentRouter);

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
