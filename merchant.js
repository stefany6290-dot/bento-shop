// 每 3 秒自動向伺服器抓取一次最新訂單
setInterval(fetchOrders, 3000);
fetchOrders(); // 網頁剛載入時先抓一次

async function fetchOrders() {
    try {
        const response = await fetch('https://bento-shop.onrender.com/api/orders');
        
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

// 渲染看板
function renderKanban(orders) {
    document.getElementById('list-pending').innerHTML = '';
    document.getElementById('list-preparing').innerHTML = '';
    document.getElementById('list-ready').innerHTML = '';

    orders.forEach(order => {
        // 安全解析 cart_items
        let cartItems = [];
        try {
            cartItems = typeof order.cart_items === 'string' 
                ? JSON.parse(order.cart_items) 
                : (order.cart_items || []);
        } catch (e) {
            console.error("解析購物車資料失敗:", e);
        }

        // 處理購物車內容 (簡化為品項名稱，配合新菜單)
        let itemsHtml = cartItems.map(item => {
            return `<div>🍱 ${item.name}</div>`;
        }).join('');

        // 建立卡片 (將原本的學號改為取餐編號/訂單編號顯示)
        const displayId = order.student_id || `NO.${order.id}`;

        const cardHtml = `
            <div class="order-card">
                <h3>取餐編號 <span class="order-number">#${displayId}</span></h3>
                <div class="order-items">${itemsHtml}</div>
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

// 根據訂單狀態顯示對應按鈕與顏色
function getActionButton(id, status) {
    if (status === 'pending') {
        return `<button class="btn-action" onclick="updateStatus(${id}, 'preparing')">確認接單 (開始製作)</button>`;
    }
    if (status === 'preparing') {
        return `<button class="btn-action ready-btn" onclick="updateStatus(${id}, 'ready')">製作完成 (可取餐)</button>`;
    }
    if (status === 'ready') {
        return `<button class="btn-action completed-btn" onclick="updateStatus(${id}, 'completed')">客人已取餐 (結案)</button>`;
    }
    return '';
}

// 更新訂單狀態
window.updateStatus = async function(id, newStatus) {
    try {
        const response = await fetch(`https://bento-shop.onrender.com/api/orders/${id}`, {
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