
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');

const app = express();
const PORT = process.env.PORT || 10000;

// ==========================================
// 1. 基本設定
// ==========================================

app.use(cors());
app.use(express.json());

// 接單開關：false = 開放線上接單
// true = 暫停線上接單
let isOnlineOrderingPaused = false;

// ==========================================
// 2. Neon PostgreSQL 資料庫連線
// ==========================================

// 請在部署平台設定 DATABASE_URL 環境變數
if (!process.env.DATABASE_URL) {
    console.error('❌ 缺少 DATABASE_URL 環境變數');
    process.exit(1);
}

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    connectionTimeoutMillis: 10000
});

// 初始化訂單資料表
async function initializeDatabase() {
    try {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS orders (
                id SERIAL PRIMARY KEY,
                student_id VARCHAR(255),
                cart_items TEXT,
                payment_method VARCHAR(50),
                order_type VARCHAR(50),
                status VARCHAR(50) DEFAULT 'pending',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        console.log('✅ Neon PostgreSQL 資料庫連線成功');
        console.log('✅ orders 資料表已準備完成');
    } catch (err) {
        console.error('❌ 資料庫初始化失敗:', err.message);
        throw err;
    }
}

// ==========================================
// 3. 查詢線上接單狀態
// GET /api/ordering-status
// ==========================================

app.get('/api/ordering-status', (req, res) => {
    res.json({
        isPaused: isOnlineOrderingPaused
    });
});

// ==========================================
// 4. 店家切換線上接單開關
// POST /api/toggle-ordering
// ==========================================

app.post('/api/toggle-ordering', (req, res) => {
    isOnlineOrderingPaused = !isOnlineOrderingPaused;

    console.log(
        isOnlineOrderingPaused
            ? '⛔ 已暫停線上接單'
            : '✅ 已恢復線上接單'
    );

    res.json({
        isPaused: isOnlineOrderingPaused
    });
});

// ==========================================
// 5. 取得尚未完成的訂單
// GET /api/orders
// ==========================================

app.get('/api/orders', async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT *
            FROM orders
            WHERE status != 'completed'
            ORDER BY id ASC
        `);

        res.json(result.rows);
    } catch (err) {
        console.error('取得訂單失敗:', err);
        res.status(500).json({
            error: '無法取得訂單'
        });
    }
});

// ==========================================
// 6. 查詢單筆訂單狀態
// GET /api/orders/:id
// ==========================================

app.get('/api/orders/:id', async (req, res) => {
    const { id } = req.params;

    if (!/^[1-9]\d*$/.test(id)) {
        return res.status(400).json({
            error: '無效的訂單編號'
        });
    }

    try {
        const result = await pool.query(
            'SELECT status FROM orders WHERE id = $1',
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                error: '找不到訂單'
            });
        }

        res.json({
            status: result.rows[0].status
        });
    } catch (err) {
        console.error('查詢訂單狀態失敗:', err);
        res.status(500).json({
            error: '無法查詢訂單狀態'
        });
    }
});

// ==========================================
// 7. 新增訂單
// POST /api/orders
// ==========================================

app.post('/api/orders', async (req, res) => {
    try {
        const studentId =
            req.body.studentId || req.body.student_id;

        const rawCart =
            req.body.cart !== undefined
                ? req.body.cart
                : req.body.cart_items;

        const paymentMethod =
            req.body.paymentMethod ||
            req.body.payment_method ||
            'cash';

        const orderType =
            req.body.orderType ||
            req.body.order_type ||
            'online';

        // 防爆單：暫停時拒絕線上訂單
        if (
            isOnlineOrderingPaused &&
            orderType === 'online'
        ) {
            return res.status(403).json({
                error:
                    '目前廚房滿載，已暫停線上點餐，請至現場排隊！'
            });
        }

        // 檢查必要欄位
        if (
            typeof studentId !== 'string' ||
            !studentId.trim() ||
            rawCart === undefined ||
            rawCart === null ||
            rawCart === ''
        ) {
            return res.status(400).json({
                error: '缺少必要的訂單資料'
            });
        }

        // 統一將購物車轉成 JSON 字串
        let cartItems;

        if (typeof rawCart === 'string') {
            try {
                cartItems = JSON.stringify(
                    JSON.parse(rawCart)
                );
            } catch (err) {
                return res.status(400).json({
                    error: '購物車資料不是有效的 JSON'
                });
            }
        } else {
            cartItems = JSON.stringify(rawCart);
        }

        const sql = `
            INSERT INTO orders (
                student_id,
                cart_items,
                payment_method,
                order_type,
                status
            )
            VALUES ($1, $2, $3, $4, 'pending')
            RETURNING id
        `;

        const result = await pool.query(sql, [
            studentId.trim(),
            cartItems,
            paymentMethod,
            orderType
        ]);

        const orderId = result.rows[0].id;

        console.log(`🛒 新訂單建立成功：#${orderId}`);

        res.status(201).json({
            message: '訂單建立成功',
            orderId
        });
    } catch (err) {
        console.error('建立訂單失敗:', err);
        res.status(500).json({
            error: '訂單建立失敗'
        });
    }
});

// ==========================================
// 8. 更新訂單狀態
// PATCH /api/orders/:id
// ==========================================

app.patch('/api/orders/:id', async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;

    if (!/^[1-9]\d*$/.test(id)) {
        return res.status(400).json({
            error: '無效的訂單編號'
        });
    }

    if (
        typeof status !== 'string' ||
        !status.trim() ||
        status.length > 50
    ) {
        return res.status(400).json({
            error: '請提供有效的訂單狀態'
        });
    }

    try {
        const result = await pool.query(
            `
            UPDATE orders
            SET status = $1
            WHERE id = $2
            RETURNING id
            `,
            [status, id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                error: '找不到訂單'
            });
        }

        console.log(
            `📝 訂單 #${id} 更新狀態為：${status}`
        );

        res.json({
            message: '訂單狀態已更新'
        });
    } catch (err) {
        console.error('更新訂單失敗:', err);
        res.status(500).json({
            error: '無法更新訂單狀態'
        });
    }
});

// ==========================================
// 9. Dashboard：取得所有訂單
// GET /api/all-orders
// ==========================================

app.get('/api/all-orders', async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT *
            FROM orders
            ORDER BY created_at DESC, id DESC
        `);

        const formattedRows = result.rows.map(row => {
            let parsedCart = row.cart_items;

            try {
                parsedCart =
                    typeof row.cart_items === 'string'
                        ? JSON.parse(row.cart_items)
                        : row.cart_items;
            } catch (err) {
                console.error(
                    `訂單 #${row.id} 購物車解析失敗:`,
                    err.message
                );
            }

            return {
                ...row,
                cart_items: parsedCart
            };
        });

        res.json(formattedRows);
    } catch (err) {
        console.error('Dashboard 取得資料失敗:', err);
        res.status(500).json({
            error: '無法取得 Dashboard 訂單資料'
        });
    }
});

// ==========================================
// 10. 健康檢查 API
// GET /api/health
// ==========================================

app.get('/api/health', async (req, res) => {
    try {
        await pool.query('SELECT 1');

        res.json({
            status: 'ok',
            database: 'connected'
        });
    } catch (err) {
        res.status(503).json({
            status: 'error',
            database: 'disconnected'
        });
    }
});

// ==========================================
// 11. 啟動伺服器
// ==========================================

async function startServer() {
    try {
        await initializeDatabase();

        app.listen(PORT, () => {
            console.log(
                `🚀 伺服器正在 port ${PORT} 運行中...`
            );
        });
    } catch (err) {
        console.error('❌ 伺服器啟動失敗');
        process.exit(1);
    }
}

startServer();
