(function (window) {
    'use strict';

    const { formatCurrency } = window.AppUtils;
    const OrderStore = window.OrderStore;
    const TableStore = window.TableStore;

    let pendingOrder = null;
    let activeTableId = null;
    let isTableMode = false;

    // =======================================================
    // อ่านค่า tableId จาก URL
    // =======================================================
    function detectTableMode() {
        const params = new URLSearchParams(window.location.search);
        if (params.has("table")) {
            activeTableId = Number(params.get("table"));
            isTableMode = true;
        }
    }

    // =======================================================
    // กรณีโต๊ะ → ดึงออเดอร์ทั้งหมดของโต๊ะ (ยังไม่จ่ายเงิน)
    // =======================================================
    function loadOrdersForTable() {
        const allOrders = OrderStore.getAll();

        // ดึงเฉพาะ order ที่ยังไม่จ่ายเงินของโต๊ะนี้
        const tableOrders = allOrders.filter(o =>
            o.tableId === activeTableId &&
            o.isPaid === false
        );

        if (tableOrders.length === 0) {
            alert("โต๊ะนี้ไม่มีออเดอร์ที่ต้องคิดเงิน");
            window.location.href = "table.html";
            return;
        }

        // รวมสินค้าในทุก order ของโต๊ะ
        const mergedItems = [];

        tableOrders.forEach(order => {
            order.items.forEach(i => {
                const existing = mergedItems.find(m => m.name === i.name);
                if (existing) existing.qty += i.qty;
                else mergedItems.push({ ...i });
            });
        });

        // สร้าง pendingOrder แบบใหม่
        pendingOrder = {
            tableId: activeTableId,
            items: mergedItems
        };
    }

    // =======================================================
    // Render ตารางสินค้าในหน้า checkout
    // =======================================================
    function renderSummary() {
        const tbody = document.getElementById("checkoutItems");
        const totalEl = document.getElementById("checkoutTotal");

        tbody.innerHTML = "";
        let total = 0;

        pendingOrder.items.forEach(i => {
            const sum = i.price * i.qty;
            total += sum;

            const tr = document.createElement("tr");
            tr.innerHTML = `
                <td>${i.name}</td>
                <td>${i.qty}</td>
                <td>${formatCurrency(sum)}</td>
            `;
            tbody.appendChild(tr);
        });

        totalEl.textContent = formatCurrency(total);

        // แสดงหัวข้อว่าเป็นของโต๊ะไหน
        if (isTableMode) {
            const info = document.getElementById("checkoutTableInfo");
            info.textContent = "คิดเงินโต๊ะ " + activeTableId;
            info.style.display = "block";
        }
    }

    // =======================================================
    // กดยืนยันชำระเงิน
    // =======================================================
    function handleConfirm() {
        if (!pendingOrder || pendingOrder.items.length === 0) {
            alert("ไม่มีสินค้าในรายการ");
            return;
        }

        const method = document.getElementById("paymentMethodFinal").value;
        const isPaid = document.getElementById("isPaidFinal").checked;

        // ⭐ Case 1: Walk-in
        if (!isTableMode) {

            // อ่าน orderId จาก URL
            const params = new URLSearchParams(window.location.search);
            const orderId = Number(params.get("order"));

            // โหลด order ที่ถูกสร้างตอน cashier.js
            const order = OrderStore.getById(orderId);

            if (!order) {
                alert("ไม่พบข้อมูลคำสั่งซื้อ");
                window.location.href = "cashier.html";
                return;
            }

            // อัปเดตสถานะ
            const updated = OrderStore.update(orderId, {
                ...order,
                paymentMethod: method,
                isPaid: isPaid,
                status: "done"
            });

            // ไปหน้าใบเสร็จ
            window.location.href = "receipt.html?order=" + orderId;
            return;
        }

        // ⭐ Case 2: Table Mode → ปิดบิลโต๊ะทั้งหมด
        const allOrders = OrderStore.getAll();

        const tableOrders = allOrders.filter(o =>
            o.tableId === activeTableId &&
            o.isPaid === false
        );

        tableOrders.forEach(o => {
            OrderStore.update(o.id, {
                isPaid: true,
                status: "done",
                paymentMethod: method
            });
        });

        // โต๊ะต้องรอทำความสะอาด
        TableStore.updateTableStatus(activeTableId, "toclean");

        alert("ชำระเงินสำเร็จ");

        window.location.href = "receipt.html?order=" + tableOrders[0].id;
    }

    // =======================================================
    // ยกเลิกออเดอร์
    // =======================================================
    function handleCancel() {
        if (!isTableMode) {
            localStorage.removeItem("pendingOrder");
            window.location.href = "cashier.html";
            return;
        }

        window.location.href = "table.html";
    }

    // =======================================================
    // Init
    // =======================================================
    function init() {
        detectTableMode();

        const params = new URLSearchParams(window.location.search);
        const orderId = params.get("order");

// --- Walk-in ใช้ orderId ---
        if (!isTableMode && orderId) {
            const orderData = OrderStore.getById(Number(orderId));
            if (!orderData) {
                alert("ไม่พบข้อมูลคำสั่งซื้อ");
                window.location.href = "cashier.html";
                return;
            }

            pendingOrder = {
                items: orderData.items,
                total: orderData.total,
                tableId: null
            };
        }

// --- Table Mode ---
        else if (isTableMode) {
            loadOrdersForTable();
        }

// --- ถ้าเป็น Walk-in แต่ไม่มี orderId (กรณีเก่า) ---
        else {
            loadPendingOrderWalkin();
        }


        renderSummary();

        document.getElementById("btnConfirmPayment")
            .addEventListener("click", handleConfirm);

        document.getElementById("btnCancelOrder")
            ?.addEventListener("click", handleCancel);
    }

    document.addEventListener("DOMContentLoaded", init);

})(window);
