const menuItems = [
    { id: 'don1', name: '燒肉丼', price: 71, category: 'donburi' },
    { id: 'don2', name: '唐揚雞丼', price: 71, category: 'donburi' },
    { id: 'don3', name: '日式豬排丼', price: 71, category: 'donburi' },
    { id: 'tei1', name: '日式炸豬排定食', price: 86, category: 'teishoku' },
    { id: 'tei2', name: '燒肉定食', price: 86, category: 'teishoku' },
    { id: 'cur1', name: '燒肉咖哩', price: 96, category: 'curry' },
    { id: 'cur2', name: '唐揚雞咖哩', price: 96, category: 'curry' },
    { id: 'ris1', name: '黑胡椒牛柳燴飯', price: 101, category: 'risotto' }
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

// 更新購物車 UI
function updateCartUI() {
    const cartList = document.getElementById('cart-items');
    cartList.innerHTML = '';
    let total = 0;
    cart.forEach(item => {
        total += item.price;
        cartList.innerHTML += `<li><span>${item.name}</span> <span>$${item.price}</span></li>`;
    });
    document.getElementById('cart-count').innerText = cart.length;
    document.getElementById('cart-total').innerText = total;
}

// ⚠️ 解決問題2：打開結帳方式選擇視窗
function checkout() {
    if (cart.length === 0) {
        alert('購物車空空的喔！快去挑選美味的便當吧 🍱');
        return;
    }
    toggleCart(); // 關閉側邊欄
    document.getElementById('checkout-modal').style.display = 'block'; // 顯示付款選擇視窗
}

// ⚠️ 解決問題1：處理付款並將訂單發送給 Render 廚房後端
async function processPayment() {
    const paymentMethod = document.querySelector('input[name="payment"]:checked').value;
    
    // 讓學生輸入學號作為取餐識別
    const studentId = prompt("請輸入您的學號或稱呼 (例：09123456 / 王同學)：", "可愛的客人");
    if (!studentId) return;

    document.getElementById('checkout-modal').style.display = 'none'; // 關閉付款視窗

    try {
        // 發送 POST 請求到後廚 API
        const response = await fetch('https://bento-shop.onrender.com/api/orders', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                studentId: studentId,
                cart: cart, 
                paymentMethod: paymentMethod,
                orderType: 'online'
            })
        });

        if (!response.ok) throw new Error('伺服器錯誤');

        const data = await response.json();

        // 顯示成功畫面與後端回傳的訂單編號
        document.getElementById('display-order-no').innerText = `NO. ${data.orderId || Math.floor(Math.random() * 100)}`;
        document.getElementById('success-modal').style.display = 'block';

        // 清空購物車
        cart = [];
        updateCartUI();

    } catch (error) {
        console.error("錯誤:", error);
        alert("點餐失敗！請確認 Render 伺服器是否已經啟動 🥺");
    }
}

window.onload = renderMenu;