// 完整丼物園菜單 (共 29 項)
const menuItems = [
    // 🍚 丼飯類 ($71)
    { id: 'don1', name: '燒肉丼', price: 71, category: 'donburi' },
    { id: 'don2', name: '唐揚雞丼', price: 71, category: 'donburi' },
    { id: 'don3', name: '日式豬排丼', price: 71, category: 'donburi' },
    { id: 'don4', name: '蒲燒鯛魚丼', price: 71, category: 'donburi' },
    { id: 'don5', name: '親子丼', price: 71, category: 'donburi' },
    { id: 'don6', name: '脆雞丼', price: 71, category: 'donburi' },
    { id: 'don7', name: '黃金雞排丼', price: 71, category: 'donburi' },

    // 🍱 定食類
    { id: 'tei1', name: '日式炸豬排定食', price: 86, category: 'teishoku' },
    { id: 'tei2', name: '燒肉定食', price: 86, category: 'teishoku' },
    { id: 'tei3', name: '唐揚雞定食', price: 86, category: 'teishoku' },
    { id: 'tei4', name: '蒲燒鯛魚定食', price: 86, category: 'teishoku' },
    { id: 'tei5', name: '嫩雞定食', price: 86, category: 'teishoku' },
    { id: 'tei6', name: '脆雞定食', price: 86, category: 'teishoku' },
    { id: 'tei7', name: '黃金雞排定食', price: 86, category: 'teishoku' },
    { id: 'tei8', name: '梅花肉片定食', price: 86, category: 'teishoku' },
    { id: 'tei9', name: '日式照燒里肌肉排定食', price: 91, category: 'teishoku' },
    { id: 'tei10', name: '菜飯', price: 56, category: 'teishoku' },

    // 🍛 咖哩類
    { id: 'cur1', name: '燒肉咖哩', price: 96, category: 'curry' },
    { id: 'cur2', name: '唐揚雞咖哩', price: 96, category: 'curry' },
    { id: 'cur3', name: '日式豬排咖哩', price: 96, category: 'curry' },
    { id: 'cur4', name: '蒲燒鯛魚咖哩', price: 96, category: 'curry' },
    { id: 'cur5', name: '嫩雞咖哩', price: 96, category: 'curry' },
    { id: 'cur6', name: '脆雞咖哩', price: 96, category: 'curry' },
    { id: 'cur7', name: '黃金雞排咖哩', price: 96, category: 'curry' },
    { id: 'cur8', name: '梅花肉片咖哩', price: 96, category: 'curry' },
    { id: 'cur9', name: '日式照燒里肌肉排咖哩', price: 96, category: 'curry' },
    { id: 'cur10', name: '原味咖哩飯', price: 66, category: 'curry' },

    // 🍲 燴飯類
    { id: 'ris1', name: '黑胡椒牛柳燴飯', price: 101, category: 'risotto' },
    { id: 'ris2', name: '紅燒牛腩燴飯', price: 101, category: 'risotto' }
];

let currentCategory = 'all';
let currentItem = null;
let cart = [];

// 渲染菜單
function renderMenu() {
    const menuList = document.getElementById('menu-list');
    menuList.innerHTML = '';
    const filteredItems = currentCategory === 'all' ? menuItems : menuItems.filter(item => item.category === currentCategory);

    filteredItems.forEach(item => {
        menuList.innerHTML += `
            <div class="card" onclick="openModal('${item.id}')">
                <h3 class="card-title">${item.name}</h3>
                <div class="card-footer">
                    <span class="price">$${item.price}</span>
                    <button class="btn-primary" style="padding: 8px 15px; font-size: 14px;">點餐</button>
                </div>
            </div>
        `;
    });
}

// 分類切換
function filterCategory(category, element) {
    currentCategory = category;
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    element.classList.add('active');
    renderMenu();
}

// 開關視窗與購物車
function openModal(itemId) {
    currentItem = menuItems.find(item => item.id === itemId);
    document.getElementById('modal-item-name').innerText = `${currentItem.name} ($${currentItem.price})`;
    document.getElementById('custom-modal').style.display = 'block';
}
function closeModal() { document.getElementById('custom-modal').style.display = 'none'; }
function toggleCart() { document.getElementById('cart-sidebar').classList.toggle('open'); }
function closeCheckoutModal() { document.getElementById('checkout-modal').style.display = 'none'; }
function closeSuccessModal() { document.getElementById('success-modal').style.display = 'none'; }

// 加入購物車
function addToCart() {
    cart.push({ name: currentItem.name, price: currentItem.price });
    updateCartUI();
    closeModal();
}

// 加入購物車
function addToCart() {
    cart.push({ name: currentItem.name, price: currentItem.price });
    updateCartUI();
    closeModal();
}

// 💡 解決問題2：新增線上點餐的刪除品項功能
function removeFromCart(index) {
    cart.splice(index, 1);
    updateCartUI();
}

// 覆寫原本的更新購物車 UI，加入可愛的刪除按鈕
function updateCartUI() {
    const cartList = document.getElementById('cart-items');
    cartList.innerHTML = '';
    let total = 0;
    cart.forEach((item, index) => {
        total += item.price;
        cartList.innerHTML += `
            <li style="display:flex; justify-content:space-between; align-items:center; border-bottom: 2px dashed #F0DDBB; padding-bottom: 15px; margin-bottom: 15px;">
                <span style="font-weight: bold; color: #5A4A42;">${item.name}</span> 
                <div>
                    <span style="font-weight: bold; color: #FF8C42; margin-right: 10px;">$${item.price}</span>
                    <button onclick="removeFromCart(${index})" style="background: #ff4d4f; color: white; border: none; border-radius: 8px; padding: 5px 10px; cursor: pointer; font-weight: bold;">✕ 刪除</button>
                </div>
            </li>`;
    });
    document.getElementById('cart-count').innerText = cart.length;
    document.getElementById('cart-total').innerText = total;
}

// 打開結帳方式選擇視窗
function checkout() {
    if (cart.length === 0) {
        alert('購物車空空的喔！快去挑選美味的便當吧 🍱');
        return;
    }
    toggleCart(); 
    document.getElementById('checkout-modal').style.display = 'block'; 
}

// 處理付款並將訂單發送給 Render 廚房後端

const API_BASE = 'https://bento-shop.onrender.com';

let trackingInterval = null;
let trackingInProgress = false;

// 顯示學生訂單追蹤畫面
function showTrackingScreen(orderId) {
    if (trackingInterval) {
        clearInterval(trackingInterval);
        trackingInterval = null;
    }

    const existing = document.getElementById('tracking-screen');
    if (existing) existing.remove();

    const trackingUI = document.createElement('div');
    trackingUI.id = 'tracking-screen';

    trackingUI.innerHTML = `
        <div style="position:fixed; inset:0; background:#FFF5E1;
            z-index:9999; display:flex; flex-direction:column;
            align-items:center; justify-content:center;
            text-align:center; padding:20px;">

            <h2 style="color:#5A4A42;">
                您的取餐編號
            </h2>

            <h1 id="pickup-number"
    style="font-size:48px; color:#FF8C42;">
    取餐編號載入中...
</h1>

            <h2 id="live-status" style="color:#FF8C42;">
                ⏳ 訂單已送入廚房
            </h2>

            <p style="color:#9E897E;">
                系統每 3 秒自動更新訂單狀態
            </p>

            <button id="close-tracking-btn"
                style="margin-top:25px; padding:12px 24px;
                border:none; border-radius:12px;
                background:#5A4A42; color:white;
                cursor:pointer;">
                返回點餐頁面
            </button>
        </div>
    `;

    document.body.appendChild(trackingUI);

    document.getElementById('close-tracking-btn')
        .addEventListener('click', () => {
            trackingUI.remove();
            if (trackingInterval) {
                clearInterval(trackingInterval);
                trackingInterval = null;
            }
        });

    // 立即查詢一次
    checkOrderStatus(orderId);

    // 每三秒自動查詢
    trackingInterval = setInterval(() => {
        checkOrderStatus(orderId);
    }, 3000);
}

// 向 Render 查詢最新訂單狀態
async function checkOrderStatus(orderId) {
    if (trackingInProgress) return;
    trackingInProgress = true;

    try {
        const response = await fetch(
            `${API_BASE}/api/orders/${orderId}`,
            { cache: 'no-store' }
        );

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        const data = await response.json();
        const pickupElement = document.querySelector(
    '#tracking-screen #pickup-number'
);

if (pickupElement && data.pickupNumber) {
    pickupElement.textContent = data.pickupNumber;
}
       const statusElement = document.getElementById('live-status');
        if (!statusElement) return;

        switch (data.status) {
            case 'pending':
                statusElement.textContent = '⏳ 等待店家接單';
                statusElement.style.color = '#FF8C42';
                break;

            case 'preparing':
                statusElement.textContent = '👨‍🍳 商家已接單，餐點製作中';
                statusElement.style.color = '#06A77D';
                break;

            case 'ready':
                statusElement.textContent = '🍱 餐點已完成，請至櫃檯取餐！';
                statusElement.style.color = '#e63946';
                break;

            case 'completed':
                statusElement.textContent = '✅ 訂單已完成，感謝您的購買！';
                statusElement.style.color = '#06A77D';

                clearInterval(trackingInterval);
                trackingInterval = null;
                localStorage.removeItem('currentOrderId');
                break;

            default:
                statusElement.textContent = `目前狀態：${data.status}`;
        }

    } catch (error) {
        console.error('訂單追蹤失敗：', error);
        const statusElement = document.getElementById('live-status');
        if (statusElement) {
            statusElement.textContent = '⚠️ 連線暫時失敗，系統將自動重試';
        }
    } finally {
        trackingInProgress = false;
    }
}



// 處理付款並建立訂單
async function processPayment() {
    const selectedPayment = document.querySelector(
        'input[name="payment"]:checked'
    );

    if (!selectedPayment) {
        alert('請選擇付款方式');
        return;
    }

    if (cart.length === 0) {
        alert('購物車目前沒有商品');
        return;
    }

    const paymentMethod = selectedPayment.value;

    try {
        // 1. 先確認店家是否開放線上接單
        const statusResponse = await fetch(
            `${API_BASE}/api/ordering-status`,
            { cache: 'no-store' }
        );

        if (!statusResponse.ok) {
            throw new Error('無法確認目前是否開放接單，請稍後再試');
        }

        const orderingStatus = await statusResponse.json();

        if (orderingStatus.isPaused) {
            alert('🍱 目前訂單較多，暫停線上點餐，請至現場排隊！');
            return;
        }

        // 2. 店家開放接單，送出訂單
        const response = await fetch(`${API_BASE}/api/orders`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                studentId: '線上預訂',
                cart: cart,
                paymentMethod: paymentMethod,
                orderType: 'online'
            })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || '訂單建立失敗');
        }

        if (!data.orderId) {
            throw new Error('伺服器沒有回傳訂單編號');
        }

        // 3. 儲存訂單編號
        localStorage.setItem('currentOrderId', data.orderId);

        // 4. 關閉結帳視窗
        document.getElementById('checkout-modal').style.display = 'none';

        // 5. 清空購物車
        cart = [];
        updateCartUI();

        // 6. 開始自動追蹤訂單
        showTrackingScreen(data.orderId);

    } catch (error) {
        console.error('點餐失敗：', error);
        alert(`點餐失敗：${error.message}`);
    }
}
window.addEventListener('DOMContentLoaded', () => {
    renderMenu();

    const savedOrderId = localStorage.getItem('currentOrderId');

    if (savedOrderId) {
        showTrackingScreen(savedOrderId);
    }
});
