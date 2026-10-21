
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

        // 每張訂單的營業日期及每日取餐號碼
        await pool.query(`
            ALTER TABLE orders
            ADD COLUMN IF NOT EXISTS business_date DATE
        `);

        await pool.query(`
            ALTER TABLE orders
            ADD COLUMN IF NOT EXISTS daily_number INTEGER
        `);

        // 每日流水號計數器
        await pool.query(`
            CREATE TABLE IF NOT EXISTS daily_order_counters (
                business_date DATE PRIMARY KEY,
                last_number INTEGER NOT NULL
            )
        `);

        // 舊訂單回填營業日期
        // 假設既有 created_at 是以 UTC 儲存
        await pool.query(`
            UPDATE orders
            SET business_date =
                (created_at AT TIME ZONE 'UTC'
                 AT TIME ZONE 'Asia/Taipei')::date
            WHERE business_date IS NULL
        `);

        // 為舊訂單建立每日流水號
        await pool.query(`
            WITH numbered AS (
                SELECT
                    id,
                    ROW_NUMBER() OVER (
                        PARTITION BY business_date
                        ORDER BY created_at, id
                    ) AS number
                FROM orders
            )
            UPDATE orders AS o
            SET daily_number = numbered.number
            FROM numbered
            WHERE o.id = numbered.id
              AND o.daily_number IS NULL
        `);

        // 防止同一天出現重複取餐號碼
        await pool.query(`
            CREATE UNIQUE INDEX IF NOT EXISTS
                orders_daily_number_unique
            ON orders (business_date, daily_number)
            WHERE business_date IS NOT NULL
              AND daily_number IS NOT NULL
        `);

        // 計數器從歷史最大號碼開始
        await pool.query(`
            INSERT INTO daily_order_counters (
                business_date,
                last_number
            )
            SELECT
                business_date,
                MAX(daily_number)
            FROM orders
            WHERE business_date IS NOT NULL
              AND daily_number IS NOT NULL
            GROUP BY business_date
            ON CONFLICT (business_date)
            DO UPDATE SET
                last_number = GREATEST(
                    daily_order_counters.last_number,
                    EXCLUDED.last_number
                )
        `);

        console.log('✅ Neon 資料庫初始化成功');
        console.log('✅ 每日訂單流水號已啟用');

    } catch (err) {
        console.error('❌ 資料庫初始化失敗:', err);
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
    `SELECT
        status,
        daily_number,
        business_date,
        order_type
     FROM orders
     WHERE id = $1`,
    [id]
);
        if (result.rows.length === 0) {
            return res.status(404).json({
                error: '找不到訂單'
            });
        }
const order = result.rows[0];

const prefix = order.order_type === 'onsite'
    ? '現場'
    : '線上';

res.json({
    status: order.status,
    dailyNumber: order.daily_number,
    businessDate: order.business_date,
    pickupNumber: order.daily_number == null
        ? null
        : `${prefix}-${String(order.daily_number).padStart(3, '0')}`
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
    let client;

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

        if (isOnlineOrderingPaused && orderType === 'online') {
            return res.status(403).json({
                error: '目前已暫停線上接單，請至現場排隊！'
            });
        }

        if (
            typeof studentId !== 'string' ||
            !studentId.trim() ||
            rawCart == null
        ) {
            return res.status(400).json({
                error: '缺少必要的訂單資料'
            });
        }

        let cart;

        try {
            cart = typeof rawCart === 'string'
                ? JSON.parse(rawCart)
                : rawCart;
        } catch (error) {
            return res.status(400).json({
                error: '購物車不是有效 JSON'
            });
        }

        if (
            !Array.isArray(cart) ||
            cart.length === 0 ||
            cart.some(item =>
                !item ||
                typeof item.name !== 'string' ||
                !Number.isFinite(Number(item.price)) ||
                Number(item.price) < 0
            )
        ) {
            return res.status(400).json({
                error: '購物車內容不正確'
            });
        }

        client = await pool.connect();
        await client.query('BEGIN');

        // 以資料庫時間判斷台灣營業日期
        const dateResult = await client.query(`
            SELECT (NOW() AT TIME ZONE 'Asia/Taipei')::date
                AS business_date
        `);

        const businessDate = dateResult.rows[0].business_date;

        // 原子操作：取得當天下一個取餐號碼
        const counterResult = await client.query(`
            INSERT INTO daily_order_counters (
                business_date,
                last_number
            )
            VALUES ($1, 1)
            ON CONFLICT (business_date)
            DO UPDATE SET
                last_number =
                    daily_order_counters.last_number + 1
            RETURNING last_number
        `, [businessDate]);

        const dailyNumber = counterResult.rows[0].last_number;

        const result = await client.query(`
            INSERT INTO orders (
                student_id,
                cart_items,
                payment_method,
                order_type,
                status,
                business_date,
                daily_number
            )
            VALUES (
                $1, $2, $3, $4, 'pending', $5, $6
            )
            RETURNING id
        `, [
            studentId.trim(),
            JSON.stringify(cart),
            paymentMethod,
            orderType,
            businessDate,
            dailyNumber
        ]);

        await client.query('COMMIT');

        const orderId = result.rows[0].id;
        const prefix = orderType === 'onsite'
            ? '現場'
            : '線上';

        const pickupNumber =
            `${prefix}-${String(dailyNumber).padStart(3, '0')}`;

        console.log(`🛒 訂單 #${orderId}：${pickupNumber}`);

        res.status(201).json({
            message: '訂單建立成功',
            orderId,
            dailyNumber,
            pickupNumber,
            businessDate
        });

    } catch (err) {
        if (client) {
            try {
                await client.query('ROLLBACK');
            } catch (rollbackError) {
                console.error('交易回滾失敗:', rollbackError);
            }
        }

        console.error('建立訂單失敗:', err);

        res.status(500).json({
            error: '訂單建立失敗'
        });

    } finally {
        if (client) client.release();
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

// 首頁路由
app.get('/', (req, res) => {
    res.send('🍱 便當店點餐系統 API 正常運行中！');
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
