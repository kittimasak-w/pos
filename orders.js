(function (window) {
    'use strict';

    const LS_ORDERS_KEY = 'pos_demo_orders';
    const LS_COUNTER_KEY = 'pos_demo_order_counter';

    // ============================
    // Utility
    // ============================
    function load() {
        try {
            return JSON.parse(localStorage.getItem(LS_ORDERS_KEY)) || [];
        } catch (e) {
            return [];
        }
    }

    function save(list) {
        localStorage.setItem(LS_ORDERS_KEY, JSON.stringify(list));
    }

    function getNextOrderNo() {
        let current = Number(localStorage.getItem(LS_COUNTER_KEY) || "0");
        current++;
        localStorage.setItem(LS_COUNTER_KEY, String(current));
        return current;
    }

    function calcTotal(items = []) {
        return items.reduce((t, i) => t + (i.price * i.qty), 0);
    }

    // ============================
    // CRUD ฟังก์ชันหลัก
    // ============================
    function add(order) {
        const orders = load();
        const id = Date.now();
        const orderNo = getNextOrderNo();
        const createdAt = new Date().toISOString();

        const newOrder = {
            id,
            orderNo,
            createdAt,
            items: order.items || [],
            total: calcTotal(order.items || []),
            paymentMethod: order.paymentMethod || 'cash',
            isPaid: !!order.isPaid,

            // ⭐ รองรับโต๊ะ
            tableId: order.tableId || null,

            // ⭐ สถานะเตรียมสินค้า
            status: order.status || 'pending'
        };

        orders.push(newOrder);
        save(orders);
        return newOrder;
    }

    function getAll() {
        return load();
    }

    function getById(id) {
        return load().find(o => o.id === id) || null;
    }

    function update(id, updated) {
        const orders = load();
        const idx = orders.findIndex(o => o.id === id);
        if (idx === -1) return null;

        orders[idx] = { ...orders[idx], ...updated };
        save(orders);
        return orders[idx];
    }

    function remove(id) {
        const orders = load().filter(o => o.id !== id);
        save(orders);
    }

    // ============================
    // ⭐ ฟีเจอร์ใหม่สำหรับระบบโต๊ะ
    // ============================

    // ดึงออเดอร์เฉพาะโต๊ะ
    function getByTable(tableId) {
        return load().filter(o => o.tableId === tableId);
    }

    // ปิดออเดอร์ของโต๊ะ (หลังลูกค้าจ่ายเงิน)
    function closeOrdersByTable(tableId) {
        const orders = load().map(o => {
            if (o.tableId === tableId) {
                return { ...o, status: 'done', isPaid: true };
            }
            return o;
        });
        save(orders);
    }

    // อัปเดตสถานะสำหรับ prepare (pending → preparing → done)
    function updateStatus(id, newStatus) {
        const orders = load();
        const o = orders.find(or => or.id === id);
        if (!o) return null;

        o.status = newStatus;
        save(orders);
        return o;
    }

    // ============================
    // EXPORT
    // ============================
    window.OrderStore = {
        getAll,
        getById,
        add,
        update,
        remove,

        // ⭐ เพิ่มใน Package 3
        getByTable,
        closeOrdersByTable,
        updateStatus
    };

})(window);
