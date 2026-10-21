
const API_BASE = 'https://bento-shop.onrender.com';

let allOrders = [];
let currentRange = 'day';

// 台灣日期 YYYY-MM-DD
function taiwanDate(date = new Date()) {
    return new Intl.DateTimeFormat('en-CA', {
        timeZone: 'Asia/Taipei',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
    }).format(date);
}

// 取得指定日期的台灣年月日
function dateParts(date) {
    const parts = new Intl.DateTimeFormat('en-US', {
        timeZone: 'Asia/Taipei',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
    }).formatToParts(date);

    const values = {};
    parts.forEach(p => {
        if (p.type !== 'literal') values[p.type] = p.value;
    });

    return `${values.year}-${values.month}-${values.day}`;
}

function orderBusinessDate(order) {
    // 新訂單優先使用資料庫營業日期
    if (order.business_date) {
        return String(order.business_date).slice(0, 10);
    }

    // 舊訂單：假設 created_at 儲存的是 UTC
    if (!order.created_at) return '';

    const raw = String(order.created_at);
    const timestamp = /Z$|[+-]\d\d:\d\d$/.test(raw)
        ? raw
        : raw.replace(' ', 'T') + 'Z';

    const date = new Date(timestamp);

    return Number.isNaN(date.getTime())
        ? ''
        : dateParts(date);
}

async function fetchDashboardData() {
    try {
        const response = await fetch(
            `${API_BASE}/api/all-orders`,
            { cache: 'no-store' }
        );

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        const data = await response.json();

        if (!Array.isArray(data)) {
            throw new Error('訂單資料格式錯誤');
        }

        allOrders = data;
        updateDashboard(currentRange);

    } catch (error) {
        console.error('Dashboard 載入失敗:', error);
        document.getElementById('ranking-list').innerHTML =
            '<li>⚠️ 無法取得營業資料</li>';
    }
}

function updateDashboard(timeRange, btnElement) {
    currentRange = timeRange;

    if (btnElement) {
        document.querySelectorAll('.filter-btn')
            .forEach(btn => btn.classList.remove('active'));

        btnElement.classList.add('active');
    }

    const today = dateParts(new Date());

    const todayStart = new Date(`${today}T00:00:00+08:00`);
    const weekStart = new Date(
        todayStart.getTime() - 6 * 86400000
    );
    const weekStartString = dateParts(weekStart);

    const currentMonth = today.slice(0, 7);

    const filteredOrders = allOrders.filter(order => {
        const date = orderBusinessDate(order);

        if (!date) return false;

        if (timeRange === 'day') {
            return date === today;
        }

        if (timeRange === 'week') {
            return date >= weekStartString && date <= today;
        }

        if (timeRange === 'month') {
            return date.startsWith(currentMonth);
        }

        return true;
    });

    let totalRevenue = 0;
    let totalItems = 0;
    const itemSales = {};

    // 取消訂單不列入營收
    const validOrders = filteredOrders.filter(
        order => order.status !== 'cancelled'
    );

    validOrders.forEach(order => {
        let cart = order.cart_items || [];

        if (typeof cart === 'string') {
            try {
                cart = JSON.parse(cart);
            } catch (error) {
                cart = [];
            }
        }

        if (!Array.isArray(cart)) return;

        cart.forEach(item => {
            const price = Number(item.price) || 0;
            const quantity = Number(item.quantity) > 0
                ? Number(item.quantity)
                : 1;

            totalRevenue += price * quantity;
            totalItems += quantity;

            itemSales[item.name] =
                (itemSales[item.name] || 0) + quantity;
        });
    });

    document.getElementById('total-revenue').textContent =
        totalRevenue.toLocaleString('zh-TW');

    document.getElementById('total-orders').textContent =
        validOrders.length;

    document.getElementById('total-items').textContent =
        totalItems;

    const rankingList = document.getElementById('ranking-list');
    rankingList.innerHTML = '';

    const sortedItems = Object.entries(itemSales)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5);

    if (sortedItems.length === 0) {
        rankingList.innerHTML =
            '<li>這個時段目前還沒有銷售紀錄喔！</li>';
        return;
    }

    const medals = ['🥇', '🥈', '🥉', '４', '５'];

    sortedItems.forEach(([name, quantity], index) => {
        const li = document.createElement('li');

        const nameSpan = document.createElement('span');
        nameSpan.textContent = `${medals[index]} ${name}`;

        const quantitySpan = document.createElement('span');
        quantitySpan.style.color = '#FF8C42';
        quantitySpan.textContent = `賣出 ${quantity} 份`;

        li.append(nameSpan, quantitySpan);
        rankingList.appendChild(li);
    });
}

// 網頁載入時顯示今天
window.addEventListener('DOMContentLoaded', () => {
    fetchDashboardData();

    // 每 15 秒重新取得資料，也會重新判斷今天日期
    setInterval(fetchDashboardData, 15000);
});
