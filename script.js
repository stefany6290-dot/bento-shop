// 1. 丼物園最新菜單資料
const menuItems = [
    // 丼飯類
    { id: 'don1', name: '燒肉丼', price: 71, category: 'donburi' },
    { id: 'don2', name: '唐揚雞丼', price: 71, category: 'donburi' },
    { id: 'don3', name: '日式豬排丼', price: 71, category: 'donburi' },
    { id: 'don4', name: '蒲燒鯛魚丼', price: 71, category: 'donburi' },
    { id: 'don5', name: '親子丼', price: 71, category: 'donburi' },
    { id: 'don6', name: '脆雞丼', price: 71, category: 'donburi' },
    { id: 'don7', name: '黃金雞排丼', price: 71, category: 'donburi' },
    // 定食類
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
    // 咖哩類
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
    // 燴飯類
    { id: 'ris1', name: '黑胡椒牛柳燴飯', price: 101, category: 'risotto' },
    { id: 'ris2', name: '紅燒牛腩燴飯', price: 101, category: 'risotto' }
];

let currentCategory = 'all';
let currentItem = null;
let cart = [];
let orderCounter = 1; // 取餐編號計數器

// 2. 渲染菜單列表
function renderMenu() {
    const menuList = document.getElementById('menu-list');
    menuList.innerHTML = '';

    const filteredItems = currentCategory === 'all' 
        ? menuItems 
        : menuItems.filter(item => item.category === currentCategory);

    filteredItems.forEach(item => {
        menuList.innerHTML += `
            <div class="card" onclick="openModal('${item.id}')">
                <h3 class="card-title">${item.name}</h3>
                <div class="card-footer">
                    <span class="price">$${item.price}</span>
                    <button class="btn-primary">加入</button>
                </div>
            </div>
        `;
    });
}

// 3. 切換分類 Tab
function filterCategory(category, element) {
    currentCategory = category;
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    element.classList.add('active');
    renderMenu();
}

// 4. 開啟 Modal (簡化版本，若有客製化需求可於此擴充)
function openModal(itemId) {
    currentItem = menuItems.find(item => item.id === itemId);
    document.getElementById('modal-item-name').innerText = `${currentItem.name} ($${currentItem.price})`;
    document.getElementById('modal-custom-options').innerHTML = '<p style="color:#666;">確認將此餐點加入購物車？</p>';
    document.getElementById('custom-modal').style.display = 'block';
}

function closeModal() {
    document.getElementById('custom-modal').style.display = 'none';
}

function toggleCart() {
    const sidebar = document.getElementById('cart-sidebar');
    sidebar.classList.toggle('open');
}

// 5. 加入購物車
function addToCart() {
    cart.push({
        name: currentItem.name,
        price: currentItem.price
    });
    updateCartUI();
    closeModal();
}

// 6. 更新購物車 UI
function updateCartUI() {
    const cartList = document.getElementById('cart-items');
    cartList.innerHTML = '';
    let total = 0;

    cart.forEach(item => {
        total += item.price;
        cartList.innerHTML += `<li><span>${item.name}</span> <strong>$${item.price}</strong></li>`;
    });

    document.getElementById('cart-count').innerText = cart.length;
    document.getElementById('cart-total').innerText = total;
}

// 7. 結帳與生成取餐編號 (移除學號輸入與付款選項)
function checkout() {
    if (cart.length === 0) {
        alert('購物車是空的喔！');
        return;
    }
    
    toggleCart(); // 關閉側欄

    // 設定並顯示順序編號
    document.getElementById('display-order-no').innerText = `NO. ${orderCounter}`;
    document.getElementById('checkout-modal').style.display = 'block';
    
    // 可在此處加入向後端發送訂單的 fetch 邏輯 (原 processPayment 邏輯)
    // fetch('https://bento-shop.onrender.com/api/orders', { ... })
    
    orderCounter++; // 編號遞增
    cart = []; // 清空購物車
    updateCartUI();
}

function closeCheckoutModal() {
    document.getElementById('checkout-modal').style.display = 'none';
}

window.onload = renderMenu;