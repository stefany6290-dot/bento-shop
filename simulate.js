// simulate.js
const API_URL = 'https://bento-shop.onrender.com/api/orders';

// 準備一些模擬的餐點資料
const mockItems = [
    { id: 'b1', name: '舒肥雞胸肉便當', price: 120, addons: [], notes: [] },
    { id: 'b2', name: '香煎牛排便當', price: 180, addons: ['加溏心蛋'], notes: ['飯少'] },
    { id: 'b3', name: '烤鮭魚排便當', price: 160, addons: [], notes: ['不要蔥'] },
    { id: 'd1', name: '無糖高山青茶', price: 35, addons: [], notes: ['無糖', '去冰'] }
];

async function createMockOrder(index) {
    // 隨機決定這筆訂單是線上還是現場 (60%機率為線上)
    const isOnline = Math.random() > 0.4; 
    
    // 隨機挑選 1 到 2 樣餐點
    const cart = [];
    cart.push(mockItems[Math.floor(Math.random() * mockItems.length)]);
    if (Math.random() > 0.5) cart.push(mockItems[Math.floor(Math.random() * mockItems.length)]);

    const payload = {
        studentId: isOnline ? `091${Math.floor(10000 + Math.random() * 90000)}` : `現場排隊客-${index}`,
        cart: cart,
        paymentMethod: isOnline ? 'linepay' : 'cash',
        orderType: isOnline ? 'online' : 'onsite'
    };

    try {
        await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        console.log(`✅ 第 ${index} 筆訂單已湧入 (${isOnline ? '📱 線上' : '🚶‍♂️ 現場'})`);
    } catch (err) {
        console.error('送出失敗，請確認 server.js 是否開啟');
    }
}

async function startRushHour() {
    console.log('🚀 模擬東吳 12:00 大下課人潮湧入中...');
    
    // 模擬 20 筆訂單連續湧入
    for (let i = 1; i <= 20; i++) {
        await createMockOrder(i);
        // 每筆訂單間隔 0.5 秒發送，製造看板不斷跳出新訂單的視覺衝擊
        await new Promise(resolve => setTimeout(resolve, 500)); 
    }
    
    console.log('🎉 尖峰時段模擬完成！請查看廚房看板。');
}

// 導出函數供 HTML 按鈕呼叫
window.startRushHour = startRushHour;;