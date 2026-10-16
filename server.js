const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const app = express();
// 讀取 Render 分配的 PORT，若無則預設使用 10000
const PORT = process.env.PORT || 10000;

// Middleware 設定
app.use(cors()); // 允許跨域請求（讓 GitHub Pages/Vercel 的前端可以連線）
app.use(express.json()); // 解析 JSON 格式的請求

// 初始化 SQLite 資料庫
const dbPath = path.resolve(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('無法開啟資料庫:', err.message);
    } else {
        console.log('成功連接 SQLite 資料庫。');
        // 建立訂單資料表 (如果不存在的話)
        db.run(`CREATE TABLE IF NOT EXISTS orders (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            student_id TEXT,
            cart_items TEXT,
            payment_method TEXT,
            order_type TEXT,
            status TEXT DEFAULT 'pending',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`);
    }
});

// 1. 取得最新訂單 (GET /api/orders)
app.get('/api/orders', (req, res) => {
    // 將 DESC 改為 ASC，讓先下單的排在最上面
    const sql = `SELECT * FROM orders WHERE status != 'completed' ORDER BY id ASC`;
    db.all(sql, [], (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json(rows);
    });
});

// 2. 新增訂單 (POST /api/orders)
app.post('/api/orders', (req, res) => {
    // 自動兼容前台線上點餐(camelCase)與 POS 端(snake_case)的資料格式
    const studentId = req.body.studentId || req.body.student_id;
    // 如果傳來的是 cart 陣列，轉成 JSON 字串；如果是已經轉好的字串，直接使用
    const cartItems = req.body.cart ? JSON.stringify(req.body.cart) : req.body.cart_items;
    const paymentMethod = req.body.paymentMethod || req.body.payment_method || 'cash';
    const orderType = req.body.orderType || req.body.order_type || 'online';

    // 基本資料驗證
    if (!studentId || !cartItems) {
        return res.status(400).json({ error: '缺少必要的訂單資料 (學號/取餐號碼 或 購物車內容)' });
    }

    const sql = `INSERT INTO orders (student_id, cart_items, payment_method, order_type) VALUES (?, ?, ?, ?)`;
    const params = [studentId, cartItems, paymentMethod, orderType];

    db.run(sql, params, function(err) {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.status(201).json({
            message: '訂單建立成功',
            orderId: this.lastID
        });
    });
});

// 3. 更新訂單狀態 (PATCH /api/orders/:id)
app.patch('/api/orders/:id', (req, res) => {
    const { status } = req.body;
    const { id } = req.params;

    if (!status) {
        return res.status(400).json({ error: '請提供要更新的狀態' });
    }

    const sql = `UPDATE orders SET status = ? WHERE id = ?`;
    db.run(sql, [status, id], function(err) {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json({ message: '訂單狀態已更新', changes: this.changes });
    });
});

// 啟動伺服器
app.listen(PORT, () => {
    console.log(`伺服器正在 port ${PORT} 運行中...`);
});