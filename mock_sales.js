(function () {
    const LS_ORDERS_KEY = 'pos_demo_orders';
    const LS_COUNTER_KEY = 'pos_demo_order_counter';

    // ล้างข้อมูลเก่า (ถ้าไม่อยากล้าง ให้ comment 2 บรรทัดนี้ออก)
    localStorage.removeItem(LS_ORDERS_KEY);
    localStorage.removeItem(LS_COUNTER_KEY);

    const today = new Date();
    today.setHours(10, 0, 0, 0); // ให้ทุกออเดอร์อยู่ช่วงเช้า ๆ

    // mock product list ง่าย ๆ
    const products = [
        { id: 1, name: 'Americano (ร้อน)', price: 60 },
        { id: 2, name: 'Latte (เย็น)', price: 80 },
        { id: 3, name: 'เค้กช็อคโกแลต', price: 95 }
    ];

    const paymentMethods = ['cash', 'qr', 'card', 'transfer'];

    const orders = [];
    let counter = 0;

    function randomInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    // ย้อนหลัง 10 วัน (รวมวันนี้)
    for (let i = 9; i >= 0; i--) {
        const day = new Date(today);
        day.setDate(today.getDate() - i);

        // สร้างวันละ 2–4 ออเดอร์
        const orderCount = randomInt(2, 4);

        for (let j = 0; j < orderCount; j++) {
            counter += 1;
            const createdAt = new Date(day);
            createdAt.setHours(9 + j * 2, randomInt(0, 50), 0, 0); // กระจายตามเวลาในวันเดียวกัน

            // เลือกสินค้าสุ่ม 1–3 รายการ
            const itemCount = randomInt(1, 3);
            const items = [];
            for (let k = 0; k < itemCount; k++) {
                const p = products[randomInt(0, products.length - 1)];
                const qty = randomInt(1, 3);
                items.push({
                    productId: p.id,
                    name: p.name,
                    price: p.price,
                    qty
                });
            }

            const total = items.reduce((sum, it) => sum + it.price * it.qty, 0);
            const paymentMethod = paymentMethods[randomInt(0, paymentMethods.length - 1)];
            const isPaid = true; // mock ให้เป็นจ่ายแล้วทั้งหมด

            orders.push({
                id: Date.now() + counter,
                orderNo: counter,
                createdAt: createdAt.toISOString(),
                items,
                total,
                paymentMethod,
                isPaid
            });
        }
    }

    localStorage.setItem(LS_ORDERS_KEY, JSON.stringify(orders));
    localStorage.setItem(LS_COUNTER_KEY, String(counter));

    console.log('Mock orders generated:', orders.length, 'orders over last 10 days');
})();
