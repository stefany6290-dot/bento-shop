setInterval(fetchOrders, 3000);
fetchOrders();

async function fetchOrders() {
    try {
        const response = await fetch('https://bento-shop.onrender.com/api/orders');
        if (!response.ok) throw new Error(`HTTP 錯誤！狀態碼: ${response.status}`);
        const orders = await response.json();
        
        document.querySelector('#col-pending .count').innerText = orders.filter(o => o.status === 'pending').length;
        document.querySelector('#col-preparing .count').innerText = orders.filter(o => o.status === 'preparing').length;
        document.querySelector('#col-ready .count').innerText = orders.filter(o => o.status === 'ready').length;

        renderKanban(orders);
    } catch (error) {
        console.error("無法取得訂單:", error);
    }
}

function renderKanban(orders) {
    // 強制依照 ID 排序 (舊的單在最上面，先下單先做)
    orders.sort((a, b) => a.id - b.id);

    document.getElementById('list-pending').innerHTML = '';
    document.getElementById('list-preparing').innerHTML = '';
    document.getElementById('list-ready').innerHTML = '';

    orders.forEach(order => {
        let cartItems = [];
        try {
            cartItems = typeof order.cart_items === 'string' ? JSON.parse(order.cart_items) : (order.cart_items || []);
        } catch (e) { console.error(e); }

        let itemsHtml = cartItems.map(item => `<div>🍱 ${item.name}</div>`).join('');

        // 💡 強制使用資料庫 ID 顯示單號，徹底解決重複問題
        let displayId;
        if (order.order_type === 'onsite') {
            displayId = `現場-${String(order.id).padStart(3, '0')}`;
        } else {
            displayId = `線上-${String(order.id).padStart(3, '0')}`;
        }

        const cardHtml = `
            <div class="order-card">
                <h3>取餐編號 <span class="order-number">${displayId}</span></h3>
                <div class="order-items">${itemsHtml}</div>
                <small style="color:gray;">下單時間: ${new Date(order.created_at).toLocaleTimeString()}</small>
                <br><br>
                ${getActionButton(order.id, order.status)}
            </div>
        `;

        if (order.status === 'pending') document.getElementById('list-pending').innerHTML += cardHtml;
        else if (order.status === 'preparing') document.getElementById('list-preparing').innerHTML += cardHtml;
        else if (order.status === 'ready') document.getElementById('list-ready').innerHTML += cardHtml;
    });
}

function getActionButton(id, status) {
    if (status === 'pending') return `<button class="btn-action" onclick="updateStatus(${id}, 'preparing')">確認接單</button>`;
    if (status === 'preparing') return `<button class="btn-action ready-btn" onclick="updateStatus(${id}, 'ready')">製作完成</button>`;
    if (status === 'ready') return `<button class="btn-action completed-btn" onclick="updateStatus(${id}, 'completed')">客人已取餐</button>`;
    return '';
}

window.updateStatus = async function(id, newStatus) {
    try {
        await fetch(`https://bento-shop.onrender.com/api/orders/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: newStatus })
        });
        fetchOrders(); 
    } catch (error) { console.error("更新狀態失敗:", error); }
    // 如果 merchant.js 已經有 API_BASE，請沿用原本的
const ORDERING_API = 'https://bento-shop.onrender.com';

async function loadOrderingStatus() {
    try {
        const response = await fetch(
            `${ORDERING_API}/api/ordering-status`,
            { cache: 'no-store' }
        );

        if (!response.ok) throw new Error('無法取得狀態');

        const data = await response.json();
        updateOrderingUI(data.isPaused);

    } catch (error) {
        console.error('接單狀態讀取失敗:', error);
        document.getElementById('ordering-status-text')
            .textContent = '⚠️ 無法取得接單狀態';
    }
}

function updateOrderingUI(isPaused) {
    const statusText =
        document.getElementById('ordering-status-text');

    const button =
        document.getElementById('toggle-ordering-btn');

    statusText.textContent = isPaused
        ? '🔴 目前已暫停線上接單'
        : '🟢 目前正常接收線上訂單';

    button.textContent = isPaused
        ? '✅ 恢復線上接單'
        : '⛔ 暫停線上接單';

    button.style.backgroundColor =
        isPaused ? '#06A77D' : '#E63946';

    button.style.color = 'white';
}

async function toggleOnlineOrdering() {
    const button =
        document.getElementById('toggle-ordering-btn');

    button.disabled = true;

    try {
        const response = await fetch(
            `${ORDERING_API}/api/toggle-ordering`,
            { method: 'POST' }
        );

        if (!response.ok) throw new Error('切換失敗');

        const data = await response.json();
        updateOrderingUI(data.isPaused);

    } catch (error) {
        alert('切換接單狀態失敗，請稍後再試');
        console.error(error);
    } finally {
        button.disabled = false;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    loadOrderingStatus();
});
};