(function (window) {
    'use strict';

    const LS_PRODUCTS_KEY = 'pos_demo_products';
    let productsCache = null;

    function load() {
        if (productsCache) return productsCache;
        try {
            const raw = JSON.parse(localStorage.getItem(LS_PRODUCTS_KEY));
            productsCache = Array.isArray(raw) ? raw : [];
        } catch (e) {
            productsCache = [];
        }

        // default products
        if (productsCache.length === 0) {
            productsCache = [
                { id: 1, name: 'Americano (ร้อน)', price: 60 },
                { id: 2, name: 'Latte (เย็น)', price: 80 },
                { id: 3, name: 'Cappuccino (เย็น)', price: 85 },
                { id: 4, name: 'ชาเขียวเย็น', price: 75 },
                { id: 5, name: 'เค้กช็อคโกแลต', price: 95 }
            ];
            save();
        }

        return productsCache;
    }

    function save() {
        localStorage.setItem(LS_PRODUCTS_KEY, JSON.stringify(productsCache || []));
    }

    function getAll() {
        return load().slice();
    }

    function getById(id) {
        return load().find(p => p.id === id) || null;
    }

    function getNextId() {
        const prods = load();
        if (prods.length === 0) return 1;
        return prods.reduce((max, p) => Math.max(max, p.id), 0) + 1;
    }

    function add(product) {
        const prods = load();
        const newProd = {
            id: getNextId(),
            name: product.name,
            price: Number(product.price) || 0
        };
        prods.push(newProd);
        productsCache = prods;
        save();
        return newProd;
    }

    function update(id, data) {
        const prods = load();
        const p = prods.find(p => p.id === id);
        if (!p) return null;

        if (typeof data.name === 'string') p.name = data.name;
        if (data.price != null) p.price = Number(data.price);

        productsCache = prods;
        save();
        return p;
    }

    function remove(id) {
        let prods = load();
        prods = prods.filter(p => p.id !== id);
        productsCache = prods;
        save();
    }

    window.ProductStore = {
        getAll,
        getById,
        add,
        update,
        remove
    };
})(window);
