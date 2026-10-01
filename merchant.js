// merchant.js

// merchant.js

// 1. 每 3 秒自動向 SQLite 伺服器抓取一次最新訂單
setInterval(fetchOrders, 3000);
fetchOrders(); // 網頁剛載入時先抓一次

async function fetchOrders() {
    try {
        const response = await fetch('https://bento-shop-backend.onrender.com/api');
        
        if (!response.ok) {
            throw new Error(`HTTP 錯誤！狀態碼: ${response.status}`);
        }

        const orders = await response.json();
        
        // 更新上方數字
        const pendingCount = orders.filter(o => o.status === 'pending').length;
        const preparingCount = orders.filter(o => o.status === 'preparing').length;
        const readyCount = orders.filter(o => o.status === 'ready').length;
        
        document.querySelector('#col-pending .count').innerText = pendingCount;
        document.querySelector('#col-preparing .count').innerText = preparingCount;
        document.querySelector('#col-ready .count').innerText = readyCount;

        renderKanban(orders);
    } catch (error) {
        console.error("無法取得訂單，請確認 Render 後端伺服器是否正常運行:", error);
    }
}

// 2. 渲染看板
function renderKanban(orders) {
    document.getElementById('list-pending').innerHTML = '';
    document.getElementById('list-preparing').innerHTML = '';
    document.getElementById('list-ready').innerHTML = '';

    orders.forEach(order => {
        // 安全解析 cart_items (若為字串則自動轉為 Array)
        let cartItems = [];
        try {
            cartItems = typeof order.cart_items === 'string' 
                ? JSON.parse(order.cart_items) 
                : (order.cart_items || []);
        } catch (e) {
            console.error("解析購物車資料失敗:", e);
        }

        // 處理購物車內容
        let itemsHtml = cartItems.map(item => {
            let details = [];
            if (item.addons) details.push(...item.addons);
            if (item.notes) details.push(...item.notes);
            return `<div>• ${item.name} <br><small>(${details.join(', ') || '無備註'})</small></div>`;
        }).join('');

        // 判斷線上或現場訂單標籤
        const typeBadge = order.order_type === 'online' 
            ? '<span style="background: #28a745; color: white; padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight:bold;">📱 線上預訂</span>'
            : '<span style="background: #fd7e14; color: white; padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight:bold;">🚶‍♂️ 現場點餐</span>';

        // 建立卡片
        const cardHtml = `
            <div class="order-card">
                <h3>學號: ${order.student_id} <span style="color:#d32f2f;">#${order.id}</span></h3>
                <div style="margin-bottom: 10px;">${typeBadge}</div>
                <div class="order-items">${itemsHtml}</div>
                <p><strong>付款:</strong> ${order.payment_method === 'linepay' ? '💚 Line Pay' : '💵 現場付款'}</p>
                <small style="color:gray;">下單時間: ${new Date(order.created_at).toLocaleTimeString()}</small>
                <br><br>
                ${getActionButton(order.id, order.status)}
            </div>
        `;

        // 依照狀態放入對應欄位
        if (order.status === 'pending') {
            document.getElementById('list-pending').innerHTML += cardHtml;
        } else if (order.status === 'preparing') {
            document.getElementById('list-preparing').innerHTML += cardHtml;
        } else if (order.status === 'ready') {
            document.getElementById('list-ready').innerHTML += cardHtml;
        }
    });
}

function getActionButton(id, status) {
    if (status === 'pending') return `<button class="btn-action" onclick="updateStatus(${id}, 'preparing')">確認接單 (開始製作)</button>`;
    if (status === 'preparing') return `<button class="btn-action" onclick="updateStatus(${id}, 'ready')">製作完成 (通知取餐)</button>`;
    if (status === 'ready') return `<button class="btn-action" style="background:#6c757d;" onclick="updateStatus(${id}, 'completed')">學生已取餐 (結案)</button>`;
    return '';
}

// 3. 更新訂單狀態 (修正斜線 Bug)
window.updateStatus = async function(id, newStatus) {
    try {
        const response = await fetch(`https://bento-shop-backend.onrender.com/api/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: newStatus })
        });
        
        if (!response.ok) {
            throw new Error(`更新失敗，狀態碼: ${response.status}`);
        }

        fetchOrders(); // 更新狀態後立刻重抓畫面
    } catch (error) {
        console.error("更新狀態失敗:", error);
    }
};