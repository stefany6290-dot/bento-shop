let allOrders = []; // 把資料存在全域變數，避免一直狂打 API

// 抓取所有訂單
async function fetchDashboardData() {
    try {
        const response = await fetch('https://bento-shop.onrender.com/api/all-orders');
        if (!response.ok) throw new Error('無法取得資料');
        
        allOrders = await response.json();
        
        // 預設顯示「今天」的數據
        const activeBtn = document.querySelector('.filter-btn.active');
        updateDashboard('day', activeBtn);
    } catch (error) {
        console.error('獲取數據失敗:', error);
        document.getElementById('ranking-list').innerHTML = '<li style="color:red;">無法連線到伺服器。</li>';
    }
}

// 根據時間過濾並更新畫面
function updateDashboard(timeRange, btnElement) {
    // 處理按鈕視覺變化
    if (btnElement) {
        document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
        btnElement.classList.add('active');
    }

    const now = new Date();
    
    // 過濾出符合時間區間的訂單
    const filteredOrders = allOrders.filter(order => {
        const orderDate = new Date(order.created_at);
        
        if (timeRange === 'day') {
            return orderDate.toDateString() === now.toDateString();
        } else if (timeRange === 'week') {
            const pastWeek = new Date();
            pastWeek.setDate(now.getDate() - 7);
            return orderDate >= pastWeek && orderDate <= now;
        } else if (timeRange === 'month') {
            return orderDate.getMonth() === now.getMonth() && orderDate.getFullYear() === now.getFullYear();
        }
        return true; // all
    });

    let totalRevenue = 0;
    let totalItemsCount = 0;
    const itemSales = {};

    filteredOrders.forEach(order => {
        let cartItems = [];
        try {
            cartItems = typeof order.cart_items === 'string' ? JSON.parse(order.cart_items) : (order.cart_items || []);
        } catch (e) { console.error(e); }

        cartItems.forEach(item => {
            totalRevenue += item.price;
            totalItemsCount += 1;
            
            if (itemSales[item.name]) {
                itemSales[item.name]++;
            } else {
                itemSales[item.name] = 1;
            }
        });
    });

    // 更新數字
    document.getElementById('total-revenue').innerText = totalRevenue.toLocaleString();
    document.getElementById('total-orders').innerText = filteredOrders.length;
    document.getElementById('total-items').innerText = totalItemsCount;

    // 更新排行榜
    const sortedItems = Object.entries(itemSales).sort((a, b) => b[1] - a[1]);
    const rankingList = document.getElementById('ranking-list');
    rankingList.innerHTML = '';
    
    if (sortedItems.length === 0) {
        rankingList.innerHTML = '<li>這個時段目前還沒有銷售紀錄喔！</li>';
        return;
    }

    const medals = ['🥇', '🥈', '🥉', '４', '５'];
    sortedItems.slice(0, 5).forEach((item, index) => {
        rankingList.innerHTML += `
            <li>
                <span>${medals[index]} ${item[0]}</span>
                <span style="color: #FF8C42;">賣出 ${item[1]} 份</span>
            </li>
        `;
    });
}

// 網頁載入時自動執行一次，之後每 15 秒背後更新一次資料
window.onload = () => {
    fetchDashboardData();
    setInterval(fetchDashboardData, 15000);
};