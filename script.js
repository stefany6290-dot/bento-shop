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
async function processPayment() {
    const paymentMethod = document.querySelector('input[name="payment"]:checked').value;
    
    // 移除 prompt 輸入學號的機制
    document.getElementById('checkout-modal').style.display = 'none'; 

    try {
        const response = await fetch('https://bento-shop.onrender.com/api/orders', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                studentId: '線上預訂', // 傳送預設字串讓後端驗證通過
                cart: cart, 
                paymentMethod: paymentMethod,
                orderType: 'online'
            })
        });

        if (!response.ok) throw new Error('伺服器錯誤');

        const data = await response.json();

        // 💡 確保線上單號顯示為「線上-XXX」
        const onlineNumber = '線上-' + String(data.orderId).padStart(3, '0');
        document.getElementById('display-order-no').innerText = onlineNumber;
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