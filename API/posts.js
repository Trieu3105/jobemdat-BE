const express = require("express");
const router = express.Router();
const pool = require("../data/data.js");

router.use(require("cookie-parser")());

// Hàm định dạng ngày tháng
function formatDate(date) {
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const seconds = String(date.getSeconds()).padStart(2, "0");

  return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
}

// Hàm chuyển đổi timestamp sang giờ Hà Nội
function convertTimestampToHanoiTime(timestamp) {
  if (!timestamp) return null;
  const date = new Date(timestamp); // Chuyển đổi timestamp thành đối tượng Date
  const offset = 7 * 60 * 60 * 1000; // Lấy độ lệch múi giờ (GMT+7)
  const hanoiDate = new Date(date.getTime() + offset); // Thêm độ lệch múi giờ vào
  return formatDate(hanoiDate); // Định dạng lại ngày theo kiểu bạn mong muốn
}

// Hàm tính số ngày giữa 2 ngày
function calculateDaysBetweenDates(startDate, endDate) {
  const timeDiff = endDate - startDate; // Lấy chênh lệch thời gian (tính bằng milliseconds)
  const daysDiff = timeDiff / (1000 * 3600 * 24); // Chuyển đổi thành số ngày
  return Math.floor(daysDiff); // Làm tròn xuống số nguyên
}

router.get("/posts", async (req, res) => {
  try {
    const query =
      "SELECT id, title, sub_title, img_url, views, content FROM posts"; // Include content column
    const [content] = await pool.query(query);
    if (!content || content.length === 0) {
      return res.status(404).json({ error: "Không tìm thấy nội dung." });
    }

    return res.status(200).json({
      success: true,
      message: "Lấy nội dung thành công.",
      contentData: content, // Ensure content column is included
    });
  } catch (error) {
    console.error("Lỗi khi truy vấn nội dung:", error);
    return res.status(500).json({ error: "Lỗi máy chủ nội bộ." });
  }
});

// Route /players
router.get("/players", async (req, res) => {
  try {
    // Truy vấn tất cả dữ liệu từ bảng players
    const query = "SELECT * FROM players";
    const [players] = await pool.query(query); // Properly destructure the result

    if (!players || players.length === 0) {
      return res.status(404).json({ error: "No players data found" });
    }

    // Truy vấn dữ liệu từ bảng "others"
    const othersQuery = "SELECT value FROM others WHERE id = 1";
    const [othersRows] = await pool.query(othersQuery);

    if (!othersRows || othersRows.length === 0 || !othersRows[0].value) {
      return res
        .status(404)
        .json({ error: "No valid data found in others table" });
    }

    let mappedValues = [];
    try {
      const values = JSON.parse(othersRows[0].value);
      if (!Array.isArray(values)) {
        throw new Error("Parsed value is not an array");
      }
      for (let i = 0; i < 131; i++) {
        const level = i + 1;
        const value = values[i] || null;
        mappedValues.push({ level, value });
      }
    } catch (error) {
      console.error("Error parsing JSON value in others:", error);
      return res.status(500).json({ error: "Invalid JSON format in value" });
    }

    // Xử lý từng hàng dữ liệu từ bảng players
    const result = await Promise.all(
      players.map(async (row) => {
        let data = {};
        try {
          if (row.data) data = JSON.parse(row.data);
        } catch (error) {
          console.error("Error parsing JSON data:", error);
        }

        const exp = data.exp || 0;
        let playerLevel = null;

        for (let i = 0; i < mappedValues.length; i++) {
          if (exp >= mappedValues[i].value) {
            playerLevel = mappedValues[i].level;
          }
        }

        const levelUpTime = data.levelUpTime;
        let hanoiTime = null;
        let daysBetween = null;

        if (levelUpTime === -1) {
          hanoiTime = 0;
          daysBetween = 0;
        } else if (levelUpTime) {
          hanoiTime = convertTimestampToHanoiTime(levelUpTime);
          const hanoiDate = new Date(hanoiTime);
          if (!isNaN(hanoiDate.getTime())) {
            const currentDate = new Date();
            daysBetween = calculateDaysBetweenDates(hanoiDate, currentDate);
          }
        }

        const userQuery = "SELECT tongnap FROM users WHERE id = ?";
        const [userResult] = await pool.query(userQuery, [row.user_id]);
        const tongnap = userResult ? userResult.tongnap : 0;

        return {
          ...row,
          tongnap,
          data,
          playerLevel,
          levelUpTime,
          hanoiTime,
          daysBetween,
        };
      })
    );

    // ✅ Sắp xếp kết quả
    result.sort((a, b) => {
        if (b.playerLevel !== a.playerLevel) {
          return b.playerLevel - a.playerLevel;
        }
  
        const aTotal = a.playerLevel + (a.levelUpTime || 0);
        const bTotal = b.playerLevel + (b.levelUpTime || 0);
  
        return bTotal - aTotal;
      });

    return res.json(result);
  } catch (error) {
    console.error("Error processing players data:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
});

// Route /rankgiatoc
// Route /rankgiatoc
router.get("/rankgiatoc", async (req, res) => {
    try {
      const query = `
        SELECT id, server_id, name, main_name, assist_name, alert, coin, level, exp 
        FROM clan 
        ORDER BY level DESC, (level + coin) DESC
      `;
  
      const [clans] = await pool.query(query); // Pool trả về [rows, fields]
  
      if (!clans || clans.length === 0) {
        return res.status(404).json({ error: "No clan data found" });
      }
  
      return res.json(clans);
    } catch (error) {
      console.error("Error processing clan data:", error);
      return res.status(500).json({ error: "Internal Server Error" });
    }
  });
  

module.exports = router;
