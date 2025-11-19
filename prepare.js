(function (window) {
    'use strict';

    const { formatCurrency, formatDateTime } = window.AppUtils;
    const OrderStore = window.OrderStore;

    let activeOrders = [];

    function loadQueue() {
        const all = OrderStore.getAll();

        // เอาเฉพาะออเดอร์ที่จ่ายแล้ว และยังไม่เสร็จ
        activeOrders = all
            .filter(o => o.isPaid && o.status !== 'done')
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)); // ใหม่ก่อนเก่า
    }

    function renderQueue() {
        const grid = document.getElementById('prepareGrid');
        const label = document.getElementById('prepareCountLabel');

        grid.innerHTML = '';

        if (activeOrders.length === 0) {
            label.textContent = 'ไม่มีออเดอร์ในคิว';
            grid.innerHTML = `<div class="empty" style="padding: 20px; text-align:center;">ยังไม่มีออเดอร์ที่ต้องเตรียม</div>`;
            return;
        }

        label.textContent = activeOrders.length + ' ออเดอร์ในคิว';

        activeOrders.forEach(order => {
            const card = document.createElement('div');
            card.className = 'prepare-card';

            const statusText = getStatusText(order.status);
            const statusClass = getStatusClass(order.status);

            const itemsHtml = order.items
                .map(i => `<li>${i.name} <span class="muted">x${i.qty}</span></li>`)
                .join('');

            card.innerHTML = `
        <div class="prepare-card-header">
          <div>
            <div class="prepare-order-no">Order #${order.orderNo}</div>
            <div class="prepare-time">${formatDateTime(order.createdAt)}</div>
          </div>
          <span class="prepare-status ${statusClass}">${statusText}</span>
        </div>

        <div class="prepare-items">
          <ul>${itemsHtml}</ul>
        </div>

        <div class="prepare-footer">
          <div class="prepare-total">
            ยอดรวม: <strong>${formatCurrency(order.total)}</strong>
          </div>
          <div class="prepare-actions" data-id="${order.id}">
          </div>
        </div>
      `;

            const actions = card.querySelector('.prepare-actions');

            if (order.status === 'pending') {
                actions.innerHTML = `
          <button class="btn btn-outline btn-sm btn-start">เริ่มทำ</button>
          <button class="btn btn-danger btn-sm btn-cancel">ยกเลิก</button>
        `;
            } else if (order.status === 'preparing') {
                actions.innerHTML = `
          <button class="btn btn-primary btn-sm btn-done">ทำเสร็จแล้ว</button>
        `;
            } else {
                actions.innerHTML = '';
            }

            // bind events
            const id = order.id;

            actions.querySelector('.btn-start')?.addEventListener('click', () => {
                OrderStore.updateStatus(id, 'preparing');
                refreshQueue();
            });

            actions.querySelector('.btn-done')?.addEventListener('click', () => {
                OrderStore.updateStatus(id, 'done');
                refreshQueue();
            });

            actions.querySelector('.btn-cancel')?.addEventListener('click', () => {
                if (confirm('ต้องการยกเลิกออเดอร์นี้หรือไม่?')) {
                    OrderStore.updateStatus(id, 'done'); // หรือคุณจะทำ field isCanceled เพิ่มก็ได้
                    refreshQueue();
                }
            });

            grid.appendChild(card);
        });
    }

    function getStatusText(status) {
        if (status === 'preparing') return 'กำลังเตรียม';
        if (status === 'done') return 'เสร็จแล้ว';
        return 'รอเตรียม';
    }

    function getStatusClass(status) {
        if (status === 'preparing') return 'status-preparing';
        if (status === 'done') return 'status-done';
        return 'status-pending';
    }

    function refreshQueue() {
        loadQueue();
        renderQueue();
    }

    function init() {
        refreshQueue();

        const btnRefresh = document.getElementById('btnRefreshQueue');
        if (btnRefresh) {
            btnRefresh.addEventListener('click', refreshQueue);
        }

        // ถ้าอยาก auto refresh ทุก 10 วิ Uncomment ได้:
        // setInterval(refreshQueue, 10000);
    }

    document.addEventListener('DOMContentLoaded', init);

})(window);
