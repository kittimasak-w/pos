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

    function add(orderInput) {
        const list = load();
        const now = new Date().toISOString();
        const orderNo = getNextOrderNo();

        const total = orderInput.items.reduce(
            (sum, i) => sum + (Number(i.price) || 0) * (Number(i.qty) || 0),
            0
        );

        const order = {
            id: Date.now(),
            orderNo,
            createdAt: now,
            items: orderInput.items.map(i => ({
                productId: i.productId,
                name: i.name,
                price: Number(i.price) || 0,
                qty: Number(i.qty) || 0
            })),
            total,
            paymentMethod: orderInput.paymentMethod,
            isPaid: !!orderInput.isPaid
        };

        list.push(order);
        ordersCache = list;
        save();
        return order;
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
        togglePaid
    };
})(window);
