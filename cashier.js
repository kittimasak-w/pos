(function (window) {
    'use strict';

    const ProductStore = window.ProductStore;
    const OrderStore = window.OrderStore;
    const TableStore = window.TableStore;
    const { formatCurrency } = window.AppUtils;

    let cart = [];
    let activeTableId = null;
    let isTableMode = false;

    // ==========================================
    // ตรวจว่าเปิดมาจากโต๊ะหรือไม่
    // ==========================================
    function detectTableMode() {
        const params = new URLSearchParams(window.location.search);
        if (params.has("table")) {
            activeTableId = Number(params.get("table"));
            isTableMode = true;
        }
    }

    // ==========================================
    // UI โหมดโต๊ะ
    // ==========================================
    function renderTableIndicator() {
        if (!isTableMode) return;

        const header = document.querySelector("header .title");
        if (header) {
            header.innerHTML += `
                <span class="badge" style="margin-left:8px; background:#2563eb; color:white;">
                    โต๊ะ ${activeTableId}
                </span>
            `;
        }

        const info = document.getElementById("cashierTableInfo");
        if (info) {
            info.textContent = "กำลังสั่งให้โต๊ะ " + activeTableId;
            info.style.display = "block";
        }

        const backBtn = document.getElementById("btnBackToTable");
        if (backBtn) backBtn.style.display = "inline-block";
    }

    // ==========================================
    // Load & Render Products
    // ==========================================
    function renderProducts() {
        const container = document.getElementById("productList");
        const label = document.getElementById("productCountLabel");
        const products = ProductStore.getAll();

        container.innerHTML = "";
        label.textContent = products.length + " รายการสินค้า";

        products.forEach(p => {
            const div = document.createElement("div");
            div.className = "product-card";
            div.innerHTML = `
                <div>
                    <div class="product-name">${p.name}</div>
                    <div class="product-price">${formatCurrency(p.price)}</div>
                </div>
                <div class="product-footer">
                    <button class="btn btn-primary btn-sm">เพิ่ม</button>
                </div>
            `;

            div.addEventListener("click", () => addToCart(p.id));
            div.querySelector("button").addEventListener("click", (e) => {
                e.stopPropagation();
                addToCart(p.id);
            });

            container.appendChild(div);
        });
    }

    // ==========================================
    // Cart
    // ==========================================
    function addToCart(id) {
        const p = ProductStore.getById(id);
        if (!p) return;

        const idx = cart.findIndex(c => c.id === id);
        if (idx === -1) cart.push({ ...p, qty: 1 });
        else cart[idx].qty++;

        renderCart();
    }

    function changeQty(id, delta) {
        const idx = cart.findIndex(c => c.id === id);
        if (idx === -1) return;

        cart[idx].qty += delta;
        if (cart[idx].qty <= 0) cart.splice(idx, 1);

        renderCart();
    }

    function clearCart() {
        cart = [];
        renderCart();
    }

    function renderCart() {
        const tbody = document.getElementById("cartBody");
        const totalEl = document.getElementById("cartTotal");

        tbody.innerHTML = "";
        let total = 0;

        cart.forEach(item => {
            const sum = item.qty * item.price;
            total += sum;

            const tr = document.createElement("tr");
            tr.innerHTML = `
                <td>${item.name}</td>
                <td>
                    <button class="btn btn-outline btn-sm qty-btn" data-id="${item.id}" data-d="-1">-</button>
                    <span class="qty">${item.qty}</span>
                    <button class="btn btn-outline btn-sm qty-btn" data-id="${item.id}" data-d="1">+</button>
                </td>
                <td>${formatCurrency(item.price)}</td>
                <td>${formatCurrency(sum)}</td>
                <td>
                    <button class="btn btn-danger btn-sm btn-del" data-id="${item.id}">ลบ</button>
                </td>
            `;
            tbody.appendChild(tr);
        });

        totalEl.textContent = formatCurrency(total);

        document.querySelectorAll(".qty-btn").forEach(btn => {
            btn.addEventListener("click", () => {
                const id = Number(btn.dataset.id);
                const delta = Number(btn.dataset.d);
                changeQty(id, delta);
            });
        });

        document.querySelectorAll(".btn-del").forEach(btn => {
            btn.addEventListener("click", () => {
                const id = Number(btn.dataset.id);
                cart = cart.filter(c => c.id !== id);
                renderCart();
            });
        });
    }


    // ==========================================
    // บันทึกออเดอร์ (สำคัญสุด)
    // ==========================================
    function saveOrder() {
        if (cart.length === 0) {
            alert("กรุณาเลือกสินค้า");
            return;
        }

        const items = cart.map(c => ({
            name: c.name,
            price: c.price,
            qty: c.qty
        }));

        // สร้างออเดอร์ใหม่
        const saved = OrderStore.add({
            items,
            isPaid: false,
            status: "pending",
            tableId: activeTableId || null
        });

        // เคลียร์ตะกร้า
        cart = [];
        renderCart();

        // =============== DINE-IN ===============
        if (isTableMode) {
            // โต๊ะต้องกลายเป็น "มีออเดอร์ค้าง"
            TableStore.updateTableStatus(activeTableId, "inprogress");

            alert("ส่งออเดอร์เข้าครัวแล้ว");
            window.location.href = "table.html";
            return;
        }

        // =============== WALK-IN ===============
        alert("บันทึกออเดอร์แล้ว → ไปชำระเงิน");
        window.location.href = "checkout.html?order=" + saved.id;
    }



    // ==========================================
    // INIT
    // ==========================================
    function init() {
        detectTableMode();
        renderTableIndicator();

        renderProducts();
        renderCart();

        document.getElementById("btnSaveOrder").addEventListener("click", saveOrder);
        document.getElementById("btnClearCart").addEventListener("click", clearCart);
    }

    document.addEventListener("DOMContentLoaded", init);

})(window);
