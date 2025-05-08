const express = require("express");
const router = express.Router();
const pool = require("../data/data.js");
const authenticateToken = require("../middleware/auth.js"); // đúng tên file là "authen.js"

router.use(require("cookie-parser")()); // nếu bạn chưa khai báo cookie-parser ở app chính

// ✅ GET /api/banking — kiểm tra token và trả về dữ liệu ngân hàng
router.get("/banking", authenticateToken, async (req, res) => {
  try {
    const query = "SELECT * FROM atm_bank";
    const [bank] = await pool.query(query);

    if (!bank || bank.length === 0) {
      return res
        .status(404)
        .json({ error: "Không tìm thấy dữ liệu ngân hàng." });
    }

    return res.status(200).json({
      success: true,
      message: "Lấy dữ liệu ngân hàng thành công.",
      user: req.user, // thông tin user từ token
      bankData: bank,
    });
  } catch (error) {
    console.error("Lỗi khi truy vấn dữ liệu ngân hàng:", error);
    return res.status(500).json({ error: "Lỗi máy chủ nội bộ." });
  }
});

// ✅ POST /api/banking — mock xử lý nạp tiền, tạo URL QR
router.post("/banking", authenticateToken, (req, res) => {
  const { amount, paymentOption, ratio } = req.body;

  if (!amount || !paymentOption || !ratio) {
    console.error("Thiếu dữ liệu trong yêu cầu:", req.body);
    return res.status(400).json({
      success: false,
      message: "Thiếu dữ liệu: amount, paymentOption hoặc ratio.",
    });
  }

  // Tính toán số tiền cần nạp nếu cần xử lý ratio
  const parsedAmount = parseInt(amount);

  // Thông tin tài khoản ngân hàng mock
  const bankInfo = {
    bankCode: "970405",
    accountNumber: "2004206236286",
    accountName: "nt Trieu",
  };

  const qrCodeUrl = `https://api.vietqr.io/${bankInfo.bankCode}/${
    bankInfo.accountNumber
  }/${parsedAmount}/${encodeURIComponent(bankInfo.accountName)}/qr_only.jpg`;
  const transactionId = `TXN${Date.now()}`;

  return res.status(200).json({
    success: true,
    message: "Tạo QR thanh toán thành công (mock).",
    user: req.user,
    data: {
      transactionId,
      amount: parsedAmount,
      paymentOption,
      ratio,
      qrCodeUrl,
      bankInfo,
    },
  });
});

module.exports = router;
