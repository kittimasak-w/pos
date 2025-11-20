(function (window) {
    'use strict';

    const OrderStore = window.OrderStore;
    const TableStore = window.TableStore;
    const { formatDateTime, formatCurrency } = window.AppUtils;

    let activeOrders = [];

    // ===========================================================
    // อัปเดตสถานะโต๊ะอัตโนมัติจากสถานะออเดอร์
    // ===========================================================
    function updateTableStatusForOrder(tableId) {
        if (!tableId) return;

        const allOrders = OrderStore.getAll();

        // มีออเดอร์ค้างหรือไม่ (pending หรือ preparing)
        const hasPending = allOrders.some(o =>
            o.tableId === tableId &&
            o.status !== "done"
        );

        if (hasPending) {
            TableStore.updateTableStatus(tableId, "inprogress");
        } else {
            // ไม่มีงานค้าง แต่ยังไม่ checkout → occupied
            TableStore.updateTableStatus(tableId, "occupied");
        }
    }

    // ===========================================================
    // โหลดออเดอร์ทั้งหมดที่ยังไม่เสร็จของครัว
    // ===========================================================
    function loadQueue() {
        const all = OrderStore.getAll();

        activeOrders = all.filter(o => o.status !== "done");

        // เรียงจากใหม่ → เก่า
        activeOrders.sort((a, b) =>
            new Date(b.createdAt) - new Date(a.createdAt)
        );
    }

    // ===========================================================
    // แสดงข้อมูลออเดอร์ในหน้าครัว
    // ===========================================================
    function renderQueue() {
        const grid = document.getElementById('prepareGrid');
        const label = document.getElementById('prepareCountLabel');

        grid.innerHTML = "";

        if (activeOrders.length === 0) {
            label.textContent = "ไม่มีออเดอร์ที่ต้องเตรียม";
            grid.innerHTML = `
                <div class="empty" style="text-align:center; padding: 20px;">
                    ยังไม่มีออเดอร์ค้าง
                </div>`;
            return;
        }

        label.textContent = activeOrders.length + " ออเดอร์ในคิว";

        activeOrders.forEach(order => {
            const card = document.createElement('div');
            card.className = 'prepare-card';

            const itemsHtml = order.items
                .map(i => `<li>${i.name} <span class="muted">x${i.qty}</span></li>`)
                .join('');

            const statusClass = getStatusClass(order.status);
            const statusText = getStatusText(order.status);

            card.innerHTML = `
                <div class="prepare-card-header">
                    <div>
                        <div class="prepare-order-no">Order #${order.orderNo}</div>
                        <div class="prepare-time">${formatDateTime(order.createdAt)}</div>

                        ${order.tableId ? `<div class="prepare-table">โต๊ะ ${order.tableId}</div>` : ""}
                    </div>

                    <span class="prepare-status ${statusClass}">
                        ${statusText}
                    </span>
                </div>

                <div class="prepare-items">
                    <ul>${itemsHtml}</ul>
                </div>

                <div class="prepare-footer">
                    <div class="prepare-total">
                        ยอดรวม: <strong>${formatCurrency(order.total)}</strong>
                    </div>
                    <div class="prepare-actions" id="prepare-actions-${order.id}"></div>
                </div>
            `;

            grid.appendChild(card);

            buildActionButtons(order);
        });
    }

    // ===========================================================
    // ปุ่มแต่ละออเดอร์ (เริ่มทำ / เสร็จ / ยกเลิก)
    // ===========================================================
    function buildActionButtons(order) {
        const el = document.getElementById("prepare-actions-" + order.id);
        el.innerHTML = "";

        const id = order.id;

        // ========== pending → preparing ==========
        if (order.status === "pending") {
            el.innerHTML = `
                <button class="btn btn-outline btn-sm btn-start">เริ่มทำ</button>
                <button class="btn btn-danger btn-sm btn-cancel">ยกเลิก</button>
            `;

            // เริ่มทำ
            el.querySelector(".btn-start").onclick = () => {
                OrderStore.updateStatus(id, "preparing");

                // ⭐ โต๊ะมีงานค้าง → inprogress
                updateTableStatusForOrder(order.tableId);

                refreshQueue();
            };

            // ยกเลิก
            el.querySelector(".btn-cancel").onclick = () => {
                if (confirm("ยกเลิกออเดอร์นี้หรือไม่?")) {
                    OrderStore.updateStatus(id, "done");

                    // ⭐ อัปเดตสถานะโต๊ะใหม่
                    updateTableStatusForOrder(order.tableId);

                    refreshQueue();
                }
            };

            return;
        }

        // ========== preparing → done ==========
        if (order.status === "preparing") {
            el.innerHTML = `
                <button class="btn btn-primary btn-sm btn-done">ทำเสร็จแล้ว</button>
            `;

            el.querySelector(".btn-done").onclick = () => {
                OrderStore.updateStatus(id, "done");

                // ⭐ ตรวจสถานะโต๊ะใหม่
                updateTableStatusForOrder(order.tableId);

                refreshQueue();
            };

            return;
        }
    }

    // ===========================================================
    // Helper classes
    // ===========================================================
    function getStatusClass(s) {
        switch (s) {
            case "pending": return "status-pending";
            case "preparing": return "status-preparing";
            case "done": return "status-done";
        }
        return "";
    }

    function getStatusText(s) {
        switch (s) {
            case "pending": return "รอทำ";
            case "preparing": return "กำลังทำ";
            case "done": return "เสร็จแล้ว";
        }
        return "-";
    }

    // ===========================================================
    // โหลดใหม่ทั้งหมด
    // ===========================================================
    function refreshQueue() {
        loadQueue();
        renderQueue();
    }

    // ===========================================================
    // เริ่มต้นเมื่อหน้าโหลด
    // ===========================================================
    function init() {
        refreshQueue();
    }

    document.addEventListener("DOMContentLoaded", init);

})(window);
