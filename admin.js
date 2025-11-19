(function (window) {
    'use strict';

    const ProductStore = window.ProductStore;

    function renderProductsAdmin() {
        const tbody = document.getElementById('adminProductBody');
        const products = ProductStore.getAll();
        tbody.innerHTML = '';

        if (products.length === 0) {
            tbody.innerHTML = `<tr><td colspan="3" class="empty">ยังไม่มีสินค้า</td></tr>`;
            return;
        }

        products.forEach(p => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
        <td>
          <input type="text" value="${p.name}" class="small-input-name" style="width: 100%;">
        </td>
        <td>
          <input type="number" value="${p.price}" class="small-input-price" style="width: 80px;">
        </td>
        <td>
          <button class="btn btn-outline btn-sm">บันทึก</button>
          <button class="btn btn-danger btn-sm">ลบ</button>
        </td>
      `;

            const inputName = tr.querySelector('.small-input-name');
            const inputPrice = tr.querySelector('.small-input-price');
            const btnSave = tr.querySelector('.btn-outline');
            const btnDelete = tr.querySelector('.btn-danger');

            btnSave.addEventListener('click', () => {
                const newName = inputName.value.trim();
                const newPrice = Number(inputPrice.value);
                if (!newName || isNaN(newPrice) || newPrice < 0) {
                    alert('กรุณากรอกชื่อและราคาสินค้าให้ถูกต้อง');
                    return;
                }
                ProductStore.update(p.id, { name: newName, price: newPrice });
                alert('บันทึกสินค้าเรียบร้อย');
            });

            btnDelete.addEventListener('click', () => {
                if (!confirm('ยืนยันการลบสินค้า "' + p.name + '" ?')) return;
                ProductStore.remove(p.id);
                renderProductsAdmin();
            });

            tbody.appendChild(tr);
        });
    }

    function handleAddProduct() {
        const nameInput = document.getElementById('newProductName');
        const priceInput = document.getElementById('newProductPrice');

        const name = nameInput.value.trim();
        const price = Number(priceInput.value);

        if (!name || isNaN(price) || price < 0) {
            alert('กรุณากรอกชื่อสินค้าและราคาที่ถูกต้อง');
            return;
        }

        ProductStore.add({ name, price });
        renderProductsAdmin();

        nameInput.value = '';
        priceInput.value = '';
    }

    function init() {
        renderProductsAdmin();
        document
            .getElementById('btnAddProduct')
            .addEventListener('click', handleAddProduct);
    }

    document.addEventListener('DOMContentLoaded', init);
})(window);
