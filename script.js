// 1. 餐點資料：便當與飲料分開設定客製化選項
const menuItems = [
    {
        id: 'b1',
        name: '舒肥雞胸肉便當',
        price: 120,
        category: 'bento',
        description: '高蛋白低脂肪首選，軟嫩不柴',
        image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=500&q=80',
        addons: [
            { name: '加溏心蛋', price: 10 },
            { name: '加一份舒肥雞胸肉', price: 35 }
        ],
        notes: ['飯少', '不要蔥', '醬汁另外放']
    },
    {
        id: 'b2',
        name: '香煎牛排便當',
        price: 180,
        category: 'bento',
        description: '原塊牛肉煎香，補充滿滿鐵質',
        image: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=500&q=80',
        addons: [
            { name: '加溏心蛋', price: 10 },
            { name: '加一份嫩煎牛排', price: 60 }
        ],
        notes: ['飯少', '不要蔥', '醬汁另外放']
    },
    {
        id: 'b3',
        name: '烤鮭魚排便當',
        price: 160,
        category: 'bento',
        description: '富含 Omega-3 健康油脂',
        image: 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?auto=format&fit=crop&w=500&q=80',
        addons: [
            { name: '加溏心蛋', price: 10 },
            { name: '加一份烤鮭魚', price: 50 }
        ],
        notes: ['飯少', '不要蔥', '醬汁另外放']
    },
    {
        id: 'd1',
        name: '無糖高山青茶',
        price: 35,
        category: 'drink',
        description: '甘甜解膩，搭配健康便當的最佳選擇',
        image: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?auto=format&fit=crop&w=500&q=80',
        sweetness: ['無糖', '微糖', '半糖'],
        ice: ['去冰', '少冰', '正常冰']
    },
    {
        id: 'd2',
        name: '鮮奶黑豆水',
        price: 50,
        category: 'drink',
        description: '高纖濃郁，補充植物性蛋白質與營養',
        image: 'https://images.unsplash.com/photo-1517256064527-09c73fc73e38?auto=format&fit=crop&w=500&q=80',
        sweetness: ['無糖', '微糖', '半糖'],
        ice: ['去冰', '少冰', '正常冰']
    }
];

let currentCategory = 'all';
let currentItem = null;
let cart = [];

// 2. 渲染菜單列表
function renderMenu() {
    const menuList = document.getElementById('menu-list');
    if (!menuList) return;
    menuList.innerHTML = '';

    const filteredItems = currentCategory === 'all' 
        ? menuItems 
        : menuItems.filter(item => item.category === currentCategory);

    filteredItems.forEach(item => {
        menuList.innerHTML += `
            <div class="card" onclick="openModal('${item.id}')">
                <img src="${item.image}" alt="${item.name}" class="card-img">
                <div class="card-body">
                    <h3>${item.name}</h3>
                    <p class="desc">${item.description}</p>
                    <div class="card-footer">
                        <span class="price">$${item.price}</span>
                        <button class="btn-primary">選擇客製化</button>
                    </div>
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

// 4. 開啟 Modal（分別處理便當與飲料選項）
function openModal(itemId) {
    currentItem = menuItems.find(item => item.id === itemId);
    document.getElementById('modal-item-name').innerText = `${currentItem.name} ($${currentItem.price})`;

    const customContainer = document.getElementById('modal-custom-options');
    customContainer.innerHTML = ''; 

    if (currentItem.category === 'bento') {
        let addonsHTML = '<p><strong>加購項目：</strong></p>';
        currentItem.addons.forEach(addon => {
            addonsHTML += `
                <label>
                    <input type="checkbox" class="addon" value="${addon.price}" data-name="${addon.name}">
                    ${addon.name} (+${addon.price}元)
                </label><br>
            `;
        });

        let notesHTML = '<p><strong>特別需求：</strong></p>';
        currentItem.notes.forEach(note => {
            notesHTML += `
                <label>
                    <input type="checkbox" class="note" value="${note}">
                    ${note}
                </label><br>
            `;
        });

        customContainer.innerHTML = addonsHTML + notesHTML;
    } else if (currentItem.category === 'drink') {
        let sweetHTML = '<p><strong>甜度：</strong></p>';
        currentItem.sweetness.forEach((s, idx) => {
            sweetHTML += `
                <label>
                    <input type="radio" name="sweetness" value="${s}" ${idx === 0 ? 'checked' : ''}>
                    ${s}
                </label> &nbsp;
            `;
        });

        let iceHTML = '<p><strong>冰塊：</strong></p>';
        currentItem.ice.forEach((i, idx) => {
            iceHTML += `
                <label>
                    <input type="radio" name="ice" value="${i}" ${idx === 0 ? 'checked' : ''}>
                    ${i}
                </label> &nbsp;
            `;
        });

        customContainer.innerHTML = sweetHTML + '<br>' + iceHTML;
    }

    document.getElementById('custom-modal').style.display = 'block';
}

// 5. 關閉 Modal
function closeModal() {
    document.getElementById('custom-modal').style.display = 'none';
}

// 6. 開啟/關閉購物車
function toggleCart() {
    const cartSidebar = document.getElementById('cart-sidebar');
    cartSidebar.style.display = cartSidebar.style.display === 'block' ? 'none' : 'block';
}

// 7. 加入購物車
function addToCart() {
    let itemTotal = currentItem.price;
    let selectedAddons = [];
    let selectedNotes = [];

    if (currentItem.category === 'bento') {
        document.querySelectorAll('.addon:checked').forEach(cb => {
            itemTotal += parseInt(cb.value);
            selectedAddons.push(cb.getAttribute('data-name'));
        });

        document.querySelectorAll('.note:checked').forEach(cb => {
            selectedNotes.push(cb.value);
        });
    } else if (currentItem.category === 'drink') {
        const sweetVal = document.querySelector('input[name="sweetness"]:checked')?.value;
        const iceVal = document.querySelector('input[name="ice"]:checked')?.value;
        if (sweetVal) selectedNotes.push(sweetVal);
        if (iceVal) selectedNotes.push(iceVal);
    }

    cart.push({
        name: currentItem.name,
        price: itemTotal,
        addons: selectedAddons,
        notes: selectedNotes
    });

    updateCartUI();
    closeModal();
    alert('已成功加入購物車！');
}

// 8. 更新購物車 UI
function updateCartUI() {
    const cartList = document.getElementById('cart-items');
    const cartCount = document.getElementById('cart-count');
    const cartTotal = document.getElementById('cart-total');

    cartList.innerHTML = '';
    let total = 0;

    cart.forEach(item => {
        total += item.price;
        let details = '';
        if (item.addons.length > 0) details += `加購: ${item.addons.join(', ')} `;
        if (item.notes.length > 0) details += `規格/備註: ${item.notes.join(', ')}`;

        cartList.innerHTML += `
            <li>
                <strong>${item.name}</strong> - $${item.price}<br>
                <small style="color:#666;">${details}</small>
            </li><br>
        `;
    });

    cartCount.innerText = cart.length;
    cartTotal.innerText = total;
}

// 9. 結帳與付款
function checkout() {
    if (cart.length === 0) {
        alert('購物車是空的喔！');
        return;
    }
    toggleCart();
    document.getElementById('checkout-modal').style.display = 'block';
}

function closeCheckoutModal() {
    document.getElementById('checkout-modal').style.display = 'none';
}

function processPayment() {
    const paymentMethod = document.querySelector('input[name="payment"]:checked').value;
    if (paymentMethod === 'linepay') {
        alert('正在引導至 Line Pay 付款頁面...');
    } else {
        alert('訂單已成立！請於取餐時至櫃檯付款，謝謝！');
    }
    cart = [];
    updateCartUI();
    closeCheckoutModal();
}

window.onload = renderMenu;