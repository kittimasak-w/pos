(function (window) {
    'use strict';

    const { formatCurrency } = window.AppUtils;
    const OrderStore = window.OrderStore;

    let pendingOrder = null;

    function loadPendingOrder() {
        const raw = localStorage.getItem("pendingOrder");
        if (!raw) {
            alert("ไม่มีข้อมูลคำสั่งซื้อ");
            window.location.href = "cashier.html";
            return;
        }
        pendingOrder = JSON.parse(raw);
    }

    function renderSummary() {
        const tbody = document.getElementById("checkoutItems");
        const totalEl = document.getElementById("checkoutTotal");

        tbody.innerHTML = '';

        let total = 0;

        pendingOrder.items.forEach(i => {
            const sum = i.qty * i.price;
            total += sum;

            const tr = document.createElement('tr');
            tr.innerHTML = `
        <td>${i.name}</td>
        <td>${i.qty}</td>
        <td>${formatCurrency(sum)}</td>
      `;
            tbody.appendChild(tr);
        });

        totalEl.textContent = formatCurrency(total);
    }


    function handleConfirm() {
        const method = document.getElementById("paymentMethodFinal").value;
        const isPaid = document.getElementById("isPaidFinal").checked;

        // บันทึกจริงลง OrderStore
        const newOrder = OrderStore.add({
            items: pendingOrder.items,
            paymentMethod: method,
            isPaid: isPaid
        });


        // ลบ pending order
        localStorage.removeItem("pendingOrder");

        // เก็บ orderNo ล่าสุดไว้ใช้กับใบเสร็จ
        localStorage.setItem("pos_last_order_id", newOrder.id);

        window.location.href = "success.html";
    }


    function init() {
        loadPendingOrder();
        renderSummary();

        document
            .getElementById("btnConfirmPayment")
            .addEventListener("click", handleConfirm);

        document
            .getElementById("btnCancelOrder")
            .addEventListener("click", function () {
                if (confirm("ต้องการยกเลิกออเดอร์นี้หรือไม่?")) {
                    localStorage.removeItem("pendingOrder");
                    window.location.href = "cashier.html";
                }
            });
    }

    document.addEventListener("DOMContentLoaded", init);

})(window);
