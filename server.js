// server.js
const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();

const app = express();
app.use(cors()); // 允許跨域請求 (讓前端網頁可以打 API)
app.use(express.json()); // 解析 JSON 格式的請求資料

// 1. 初始化 SQLite 資料庫 (會自動產生 orders.db 檔案)
const db = new sqlite3.Database('./orders.db', (err) => {
    if (err) console.error('資料庫連線失敗:', err.message);
    else console.log('✅ 成功連接 SQLite 資料庫');
});

// 2. 建立訂單資料表 (新增 order_type 欄位)
db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS orders (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        student_id TEXT,
        cart_items TEXT,
        payment_method TEXT,
        status TEXT,
        order_type TEXT,      -- 標示為 'online' (線上) 或 'onsite' (現場)
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);
});

// 3. API: 接收新訂單 (POST /api/orders)
app.post('/api/orders', (req, res) => {
    const { studentId, cart, paymentMethod, orderType } = req.body; 
    const cartString = JSON.stringify(cart);
    
    const sql = `INSERT INTO orders (student_id, cart_items, payment_method, status, order_type) VALUES (?, ?, ?, 'pending', ?)`;
    db.run(sql, [studentId, cartString, paymentMethod, orderType], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: '訂單建立成功', orderId: this.lastID });
    });
});

// 4. API: 商家端取得所有未結案訂單 (GET /api/orders)
app.get('/api/orders', (req, res) => {
    const sql = `SELECT * FROM orders WHERE status != 'completed' ORDER BY created_at ASC`;
    db.all(sql, [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        
        const formattedRows = rows.map(row => {
            let parsedCart = row.cart_items;
            try {
                parsedCart = typeof row.cart_items === 'string' ? JSON.parse(row.cart_items) : row.cart_items;
            } catch (e) {
                console.error("Cart items parse error:", e);
            }
            return {
                ...row,
                cart_items: parsedCart
            };
        });
        res.json(formattedRows);
    });
});

// 5. API: 商家端更新訂單狀態 (PATCH /api/orders/:id)
app.patch('/api/orders/:id', (req, res) => {
    const { status } = req.body;
    const { id } = req.params;
    
    const sql = `UPDATE orders SET status = ? WHERE id = ?`;
    db.run(sql, [status, id], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: '狀態更新成功' });
    });
});

// 關鍵修改：支援 Render 動態 Port 號
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 伺服器已啟動於 Port ${PORT}`);
});