const express = require('express');
const cors = require('cors');
const { Pool } = require('pg'); // 💡 替換為 PostgreSQL 套件

const app = express();
const PORT = process.env.PORT || 10000;

app.use(cors()); 
app.use(express.json()); 

// 💡 1. 初始化 Neon PostgreSQL 雲端資料庫連線
const pool = new Pool({
    // 請將這裡替換成你在 Neon 獲取的真實連線字串
    connectionString: 'postgresql://neondb_owner:npg_gvya8rfw4iVz@ep-misty-dream-b3kyd2ee-pooler.c-4.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require'
});

// 建立訂單資料表 (使用 PostgreSQL 語法 SERIAL)
pool.query(`CREATE TABLE IF NOT EXISTS orders (
    id SERIAL PRIMARY KEY,
    student_id VARCHAR(255),
    cart_items TEXT,
    payment_method VARCHAR(50),
    order_type VARCHAR(50),
    status VARCHAR(50) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)`, (err) => {
    if (err) console.error('無法建立資料表:', err.message);
    else console.log('✅ 成功連接 Neon PostgreSQL 雲端資料庫。');
});

// 2. 取得最新訂單 (GET /api/orders)
app.get('/api/orders', (req, res) => {
    const sql = `SELECT * FROM orders WHERE status != 'completed' ORDER BY id ASC`;
    pool.query(sql, (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(result.rows);
    });
});

// 💡 3. 新增：查詢單筆訂單狀態 (GET /api/orders/:id) - 供學生手機端即時追蹤使用
app.get('/api/orders/:id', (req, res) => {
    const { id } = req.params;
    pool.query(`SELECT status FROM orders WHERE id = $1`, [id], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        if (result.rows.length === 0) return res.status(404).json({ error: '找不到訂單' });
        res.json({ status: result.rows[0].status });
    });
});

// 4. 新增訂單 (POST /api/orders)
// 新增訂單 API (加入 20 單防爆單機制)
app.post('/api/orders', (req, res) => {
    const studentId = req.body.studentId || req.body.student_id;
    const cartItems = req.body.cart ? JSON.stringify(req.body.cart) : req.body.cart_items;
    const paymentMethod = req.body.paymentMethod || req.body.payment_method || 'cash';
    const orderType = req.body.orderType || req.body.order_type || 'online';

    if (!studentId || !cartItems) {
        return res.status(400).json({ error: '缺少必要的訂單資料' });
    }

    // 💡 防爆單機制：檢查線上未完成訂單是否超過 20 筆
    if (orderType === 'online') {
        const checkSql = `SELECT COUNT(*) as count FROM orders WHERE status IN ('pending', 'preparing') AND order_type = 'online'`;
        db.get(checkSql, [], (err, row) => {
            if (err) return res.status(500).json({ error: err.message });
            
            if (row.count >= 20) {
                // 超過 20 單，拒絕線上點餐
                return res.status(400).json({ error: '目前廚房滿載（超過20單未出），為確保出餐品質，暫停線上點餐，請至現場排隊！' });
            }
            insertOrder(); // 沒超過，繼續寫入訂單
        });
    } else {
        insertOrder(); // 現場點餐不受限，直接寫入
    }

    // 實際寫入資料庫的函數
    function insertOrder() {
        const sql = `INSERT INTO orders (student_id, cart_items, payment_method, order_type, status) VALUES (?, ?, ?, ?, 'pending')`;
        db.run(sql, [studentId, cartItems, paymentMethod, orderType], function(err) {
            if (err) return res.status(500).json({ error: err.message });
            res.status(201).json({ message: '訂單建立成功', orderId: this.lastID });
        });
    }
});

// 5. 更新訂單狀態 (PATCH /api/orders/:id)
app.patch('/api/orders/:id', (req, res) => {
    const { status } = req.body;
    const { id } = req.params;

    if (!status) return res.status(400).json({ error: '請提供要更新的狀態' });

    const sql = `UPDATE orders SET status = $1 WHERE id = $2`;
    pool.query(sql, [status, id], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: '訂單狀態已更新' });
    });
});
// 💡 解決問題 1：查詢單筆訂單狀態 (供學生端即時追蹤使用)
app.get('/api/orders/:id', (req, res) => {
    const { id } = req.params;
    // 使用 Neon 的 pool.query 語法
    pool.query(`SELECT status FROM orders WHERE id = $1`, [id], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        if (result.rows.length === 0) return res.status(404).json({ error: '找不到訂單' });
        
        res.json({ status: result.rows[0].status });
    });
});
// 💡 解決問題 2：供 Dashboard 抓取所有訂單 (包含已結案)
app.get('/api/all-orders', (req, res) => {
    const sql = `SELECT * FROM orders ORDER BY created_at DESC`;
    pool.query(sql, (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        
        // 解析 JSON 格式的 cart_items 讓 Dashboard 計算營收
        const formattedRows = result.rows.map(row => {
            let parsedCart = row.cart_items;
            try {
                parsedCart = typeof row.cart_items === 'string' ? JSON.parse(row.cart_items) : row.cart_items;
            } catch (e) {
                console.error("Cart items parse error:", e);
            }
            return { ...row, cart_items: parsedCart };
        });
        
        res.json(formattedRows);
    });
});
app.listen(PORT, () => {
    console.log(`🚀 伺服器正在 port ${PORT} 運行中...`);
});
