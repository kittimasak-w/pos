(function (window) {
    'use strict';

    const { formatCurrency } = window.AppUtils;
    const ProductStore = window.ProductStore;
    const OrderStore = window.OrderStore;

    let cart = [];

    function renderProducts() {
        const container = document.getElementById('productList');
        const label = document.getElementById('productCountLabel');
        const products = ProductStore.getAll();

        label.textContent = products.length + ' รายการสินค้า';
        container.innerHTML = '';

        if (products.length === 0) {
            container.innerHTML = '<div class="empty">ยังไม่มีสินค้า กรุณาเพิ่มใน Admin</div>';
            return;
        }

        products.forEach(p => {
            const div = document.createElement('div');
            div.className = 'product-card';
            div.innerHTML = `
        <div>
          <div class="product-name">${p.name}</div>
          <div class="product-price">${formatCurrency(p.price)}</div>
        </div>
        <div class="product-footer">
          <span class="tag">ID: ${p.id}</span>
          <button class="btn btn-primary btn-sm">เพิ่ม</button>
        </div>
      `;

            function add(e) {
                e.stopPropagation();
                addToCart(p.id);
            }

            div.addEventListener('click', add);
            div.querySelector('button').addEventListener('click', add);

            container.appendChild(div);
        });
    }

    function renderCart() {
        const tbody = document.getElementById('cartBody');
        const totalEl = document.getElementById('cartTotal');

        tbody.innerHTML = '';

        if (cart.length === 0) {
            tbody.innerHTML = `<tr><td colspan="5" class="empty">ยังไม่มีสินค้าในตะกร้า</td></tr>`;
            totalEl.textContent = formatCurrency(0);
            return;
        }

        let total = 0;

        cart.forEach(item => {
            const sub = item.price * item.qty;
            total += sub;

            const tr = document.createElement('tr');
            tr.innerHTML = `
        <td>${item.name}</td>
        <td>
          <div class="qty-control">
            <button class="dec">-</button>
            <span>${item.qty}</span>
            <button class="inc">+</button>
          </div>
        </td>
        <td>${formatCurrency(item.price)}</td>
        <td>${formatCurrency(sub)}</td>
        <td>
          <button class="btn btn-icon btn-danger btn-sm">×</button>
        </td>
      `;

            // -----------------------------------------------
            // FIX ปุ่ม Safari – ดึงปุ่มแบบปลอดภัย (ไม่ destructuring)
            // -----------------------------------------------
            const qtyButtons = tr.querySelectorAll('.qty-control button');
            const btnDec = qtyButtons[0];
            const btnInc = qtyButtons[1];

            const removeBtn = tr.querySelector('.btn-danger');

            btnDec.addEventListener('click', () => {
                updateCartQty(item.productId, item.qty - 1);
            });

            btnInc.addEventListener('click', () => {
                updateCartQty(item.productId, item.qty + 1);
            });

            removeBtn.addEventListener('click', () => {
                removeCartItem(item.productId);
            });

            tbody.appendChild(tr);
        });

        totalEl.textContent = formatCurrency(total);
    }

    function addToCart(productId) {
        const p = ProductStore.getById(productId);
        if (!p) return;

        const existing = cart.find(c => c.productId === productId);
        if (existing) existing.qty++;
        else {
            cart.push({
                productId: p.id,
                name: p.name,
                price: p.price,
                qty: 1
            });
        }

        renderCart();
    }

    function updateCartQty(productId, qty) {
        const item = cart.find(c => c.productId === productId);
        if (!item) return;

        if (qty <= 0) {
            cart = cart.filter(c => c.productId !== productId);
        } else {
            item.qty = qty;
        }

        renderCart();
    }

    function removeCartItem(productId) {
        cart = cart.filter(c => c.productId !== productId);
        renderCart();
    }

    function clearCart() {
        cart = [];
        renderCart();
    }

    function handleSaveOrder() {
        if (cart.length === 0) {
            alert('ยังไม่มีสินค้าในตะกร้า');
            return;
        }

        const pendingOrder = {
            items: cart
        };

        localStorage.setItem("pendingOrder", JSON.stringify(pendingOrder));

        window.location.href = "checkout.html";
    }


    function init() {
        renderProducts();
        renderCart();

        document.getElementById('btnClearCart').addEventListener('click', () => {
            if (cart.length === 0) return;
            if (confirm('ล้างตะกร้าทั้งหมด ?')) clearCart();
        });

        document.getElementById('btnSaveOrder').addEventListener('click', handleSaveOrder);
    }

    document.addEventListener('DOMContentLoaded', init);

})(window);
