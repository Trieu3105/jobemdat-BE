const express = require("express");
const pool = require("../data/data.js"); // Import MySQL connection (Promise-based)

const router = express.Router();

// API to fetch and remap gift codes
router.get("/giftcodes", async (req, res) => {
  try {
    const [results] = await pool.query("SELECT * FROM gift_codes");

    // Remap the data to parse JSON fields and structure it
    const remappedResults = results.map((giftCode) => ({
      id: giftCode.id,
      server_id: giftCode.server_id,
      type: giftCode.type,
      code: giftCode.code,
      coin: giftCode.coin,
      gold: giftCode.gold,
      yen: giftCode.yen,
      items: JSON.parse(giftCode.items || "[]"), // Parse JSON items field
      status: giftCode.status,
      expires_at: giftCode.expires_at,
      created_at: giftCode.created_at,
      updated_at: giftCode.updated_at,
    }));

    res.status(200).json(remappedResults);
  } catch (err) {
    console.error("Error fetching gift codes:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Route API để lấy dữ liệu từ bảng gift_codes và liên kết với icon từ bảng item
router.get("/giftcode", async (req, res) => {
  try {
    const [giftCodes] = await pool.query("SELECT * FROM gift_codes");

    if (!giftCodes || giftCodes.length === 0) {
      return res.status(404).json({ error: "No gift codes found" });
    }

    const result = await Promise.all(
      giftCodes.map(async (row) => {
        let items = [];
        try {
          items = JSON.parse(row.items); // Giải mã trường items (JSON)
        } catch (error) {
          console.error("Error parsing items JSON:", error);
        }

        // Lấy các ID từ items
        const itemIds = items.map((item) => item.id);

        // Nếu không có item IDs, trả về các thông tin cơ bản của gift code
        if (itemIds.length === 0) {
          return {
            id: row.id,
            server_id: row.server_id || null,
            code: row.code,
            items: [],
            coin: row.coin,
            yen: row.yen,
            gold: row.gold,
            created_at: row.created_at,
            expired_at: row.expired_at,
            updated_at: row.updated_at,
            status: row.status,
          };
        }

        // Truy vấn lấy icon và name từ bảng item dựa trên các id trong items
        const [icons] = await pool.query("SELECT id, icon, name FROM item WHERE id IN (?)", [itemIds]);

        // Tạo map liên kết id với icon và name
        const iconMap = icons.reduce((acc, item) => {
          acc[item.id] = { icon: item.icon, name: item.name };
          return acc;
        }, {});

        // Gán icon và name vào từng item
        const mergedItems = items.map((item) => ({
          ...item,
          icon: iconMap[item.id]?.icon || null, // Nếu không có icon, trả về null
          name: iconMap[item.id]?.name || null, // Nếu không có name, trả về null
        }));

        return {
          id: row.id,
          server_id: row.server_id || null,
          code: row.code,
          items: mergedItems, // Truyền items với cả icon và name
          coin: row.coin,
          yen: row.yen,
          gold: row.gold,
          created_at: row.created_at,
          expired_at: row.expired_at,
          updated_at: row.updated_at,
          status: row.status,
        };
      })
    );

    // Trả về kết quả cuối cùng
    return res.json(result);
  } catch (error) {
    console.error("Error processing gift codes:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

//tích lũy đăng nhập;
router.get("/giftlogin", async (req, res) => {
  try {
    // Truy vấn tất cả dữ liệu từ bảng gifts_login
    const [giftsLogin] = await pool.query("SELECT * FROM gifts_login");

    if (!giftsLogin || giftsLogin.length === 0) {
      return res.status(404).json({ error: "No gifts login data found" });
    }

    // Xử lý từng hàng dữ liệu từ bảng gifts_login
    const result = await Promise.all(
      giftsLogin.map(async (row) => {
        let giftName = [];
        try {
          // Giải mã trường gift_name (JSON)
          giftName = JSON.parse(row.gift_name);
        } catch (error) {
          console.error("Error parsing gift_name JSON:", error);
        }

        // Lấy danh sách ID từ gift_name
        const giftIds = giftName.map((gift) => gift.id);

        // Nếu không có ID trong gift_name, trả về dữ liệu cơ bản
        if (giftIds.length === 0) {
          return {
            id: row.id,
            day: row.day || null,
            luong: row.luong,
            xu: row.xu,
            yen: row.yen,
            gift_name: [],
          };
        }

        // Truy vấn lấy icon từ bảng item dựa trên giftIds
        const [icons] = await pool.query("SELECT id, icon FROM item WHERE id IN (?)", [giftIds]);

        // Tạo map liên kết id với icon
        const iconMap = icons.reduce((acc, item) => {
          acc[item.id] = item.icon;
          return acc;
        }, {});

        // Gán icon vào từng phần tử gift_name
        const mergedGiftName = giftName.map((gift) => ({
          ...gift,
          icon: iconMap[gift.id] || null, // Nếu không tìm thấy icon, trả về null
        }));

        // Trả về dữ liệu đã xử lý
        return {
          id: row.id,
          day: row.day || null,
          luong: row.luong,
          xu: row.xu,
          yen: row.yen,
          gift_name: mergedGiftName,
        };
      })
    );

    // Trả về kết quả cuối cùng
    return res.json(result);
  } catch (error) {
    console.error("Error processing gifts login data:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});
//tích lũy giờ chơi;
router.get("/giftplay", async (req, res) => {
  try {
    // Truy vấn tất cả dữ liệu từ bảng gifts_login
    const [giftsplay] = await pool.query("SELECT * FROM gifts_play");

    if (!giftsplay || giftsplay.length === 0) {
      return res.status(404).json({ error: "No gifts login data found" });
    }

    // Xử lý từng hàng dữ liệu từ bảng gifts_login
    const result = await Promise.all(
      giftsplay.map(async (row) => {
        let giftName = [];
        try {
          // Giải mã trường gift_name (JSON)
          giftName = JSON.parse(row.gift_name);
        } catch (error) {
          console.error("Error parsing gift_name JSON:", error);
        }

        // Lấy danh sách ID từ gift_name
        const giftIds = giftName.map((gift) => gift.id);

        // Nếu không có ID trong gift_name, trả về dữ liệu cơ bản
        if (giftIds.length === 0) {
          return {
            id: row.id,
            house: row.house || null,
            luong: row.luong,
            xu: row.xu,
            yen: row.yen,
            gift_name: [],
          };
        }

        // Truy vấn lấy icon từ bảng item dựa trên giftIds
        const [icons] = await pool.query("SELECT id, icon FROM item WHERE id IN (?)", [giftIds]);

        // Tạo map liên kết id với icon
        const iconMap = icons.reduce((acc, item) => {
          acc[item.id] = item.icon;
          return acc;
        }, {});

        // Gán icon vào từng phần tử gift_name
        const mergedGiftName = giftName.map((gift) => ({
          ...gift,
          icon: iconMap[gift.id] || null, // Nếu không tìm thấy icon, trả về null
        }));

        // Trả về dữ liệu đã xử lý
        return {
          id: row.id,
          house: row.house || null,
          luong: row.luong,
          xu: row.xu,
          yen: row.yen,
          gift_name: mergedGiftName,
        };
      })
    );

    // Trả về kết quả cuối cùng
    return res.json(result);
  } catch (error) {
    console.error("Error processing gifts login data:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

module.exports = router;
