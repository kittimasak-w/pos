(function (window) {
    'use strict';

    const LS_ORDERS_KEY = 'pos_demo_orders';
    const LS_COUNTER_KEY = 'pos_demo_order_counter';

    let ordersCache = null;

    function load() {
        if (ordersCache) return ordersCache;
        try {
            const raw = JSON.parse(localStorage.getItem(LS_ORDERS_KEY));
            ordersCache = Array.isArray(raw) ? raw : [];
        } catch (e) {
            ordersCache = [];
        }
        return ordersCache;
    }

    function save() {
        localStorage.setItem(LS_ORDERS_KEY, JSON.stringify(ordersCache || []));
    }

    function getAll() {
        return load().slice();
    }

    function getNextOrderNo() {
        let counter = Number(localStorage.getItem(LS_COUNTER_KEY) || '0');
        counter += 1;
        localStorage.setItem(LS_COUNTER_KEY, String(counter));
        return counter;
    }

    function calcTotal(items) {
        if (!items || !Array.isArray(items)) return 0;
        return items.reduce((sum, i) => sum + (i.price * i.qty), 0);
    }

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
            total: order.total || calcTotal(order.items || []),
            paymentMethod: order.paymentMethod || 'cash',
            isPaid: !!order.isPaid,
            status: order.status || 'pending'   // 👈 เพิ่มบรรทัดนี้
        };

        orders.push(newOrder);
        save(orders);
        return newOrder;
    }

    function updateStatus(id, newStatus) {
        const orders = load();
        const idx = orders.findIndex(o => o.id === id);
        if (idx === -1) return null;

        orders[idx].status = newStatus;
        save(orders);
        return orders[idx];
    }

    function togglePaid(orderId) {
        const list = load();
        const o = list.find(o => o.id === orderId);
        if (!o) return null;
        o.isPaid = !o.isPaid;
        ordersCache = list;
        save();
        return o;
    }

    window.OrderStore = {
        getAll,
        add,
        togglePaid,
        updateStatus
    };
})(window);
