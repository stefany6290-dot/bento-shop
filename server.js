// server.js
const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();

const app = express();
app.use(cors()); // 允許跨域請求 (讓您的前端網頁可以打 API)
app.use(express.json()); // 解析 JSON 格式的請求資料

// 1. 初始化 SQLite 資料庫 (會自動產生 orders.db 檔案)
const db = new sqlite3.Database('./orders.db', (err) => {
    if (err) console.error('資料庫連線失敗:', err.message);
    else console.log('✅ 成功連接 SQLite 資料庫');
});

// ...前面的 express 等設定保留...

// 2. 建立訂單資料表 (新增 order_type 欄位)
db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS orders (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        student_id TEXT,
        cart_items TEXT,
        payment_method TEXT,
        status TEXT,
        order_type TEXT,      -- 【新增】標示為 'online' (線上) 或 'onsite' (現場)
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);
});

// 3. API: 接收新訂單
app.post('/api/orders', (req, res) => {
    // 【新增】接收 orderType
    const { studentId, cart, paymentMethod, orderType } = req.body; 
    const cartString = JSON.stringify(cart);
    
    // 將 orderType 存入資料庫
    const sql = `INSERT INTO orders (student_id, cart_items, payment_method, status, order_type) VALUES (?, ?, ?, 'pending', ?)`;
    db.run(sql, [studentId, cartString, paymentMethod, orderType], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: '訂單建立成功', orderId: this.lastID });
    });
});

// 4. API: 商家端取得所有未結案訂單 (已包含依時間排序)
app.get('/api/orders', (req, res) => {
    // 這裡的 ORDER BY created_at ASC 就是「排單依照時間順序」的關鍵！
    // 越早下單的 (時間越小) 會排在越前面。
    const sql = `SELECT * FROM orders WHERE status != 'completed' ORDER BY created_at ASC`;
    db.all(sql, [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        
        const formattedRows = rows.map(row => ({
            ...row,
            cart_items: JSON.parse(row.cart_items)
        }));
        res.json(formattedRows);
    });
});

// ...後面的程式碼保留...

// 5. API: 商家端更新訂單狀態 (Update)
app.patch('/api/orders/:id', (req, res) => {
    const { status } = req.body;
    const { id } = req.params;
    
    const sql = `UPDATE orders SET status = ? WHERE id = ?`;
    db.run(sql, [status, id], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: '狀態更新成功' });
    });
});

// 啟動伺服器
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`🚀 伺服器已啟動：http://localhost:${PORT}`);
});