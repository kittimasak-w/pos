// =============================
// AUTO MOCK DATA IF EMPTY
// =============================
// (function autoMockSalesData() {
//     const LS_ORDERS_KEY = 'pos_demo_orders';
//     const LS_COUNTER_KEY = 'pos_demo_order_counter';
//
//     const existing = localStorage.getItem(LS_ORDERS_KEY);
//     try {
//         if (existing && JSON.parse(existing).length > 0) return;
//     } catch (e) {}
//
//     console.log("No sales data found → generating mock data for last 10 days...");
//
//     const today = new Date();
//     today.setHours(10, 0, 0, 0);
//
//     const products = [
//         { name: 'Americano (ร้อน)', price: 60 },
//         { name: 'Latte (เย็น)', price: 80 },
//         { name: 'ชาเขียวเย็น', price: 75 },
//         { name: 'เค้กช็อคโกแลต', price: 95 }
//     ];
//
//     const methods = ['cash', 'qr', 'card', 'transfer'];
//
//     const orders = [];
//     let counter = 0;
//
//     function randomInt(min, max) {
//         return Math.floor(Math.random() * (max - min + 1)) + min;
//     }
//
//     for (let i = 9; i >= 0; i--) {
//         const date = new Date(today);
//         date.setDate(today.getDate() - i);
//
//         const orderCount = randomInt(2, 4);
//
//         for (let j = 0; j < orderCount; j++) {
//             counter += 1;
//
//             const createdAt = new Date(date);
//             createdAt.setHours(9 + j * 2, randomInt(0, 40), 0, 0);
//
//             const itemCount = randomInt(1, 3);
//             const items = [];
//
//             for (let k = 0; k < itemCount; k++) {
//                 const p = products[randomInt(0, products.length - 1)];
//                 const qty = randomInt(1, 3);
//                 items.push({ name: p.name, price: p.price, qty });
//             }
//
//             const total = items.reduce((t, it) => t + it.price * it.qty, 0);
//
//             orders.push({
//                 id: Date.now() + counter,
//                 orderNo: counter,
//                 createdAt: createdAt.toISOString(),
//                 items,
//                 total,
//                 paymentMethod: methods[randomInt(0, methods.length - 1)],
//
//                 // ⭐ เพิ่มตามที่คุณต้องการ
//                 isPaid: true,
//                 status: 'done'
//             });
//         }
//     }
//
//     localStorage.setItem(LS_ORDERS_KEY, JSON.stringify(orders));
//     localStorage.setItem(LS_COUNTER_KEY, String(counter));
//
//     console.log("Mock sales data generated:", orders.length, "orders");
// })();


(function (window) {
    'use strict';

    const { formatCurrency, formatDateTime, PaymentLabels } = window.AppUtils;
    const OrderStore = window.OrderStore;

    let allOrders = [];
    let filteredOrders = [];

    // โหมดกราฟยอดขาย: daily / monthly
    let salesChartMode = 'daily';
    // โหมดกราฟ Top สินค้า: hbar / vbar / pie
    let topChartMode = 'hbar';

    // จำค่า filter ล่าสุดไว้ใช้เวลาเปลี่ยนโหมดกราฟ
    let lastRange = 'all';
    let lastStart = null;
    let lastEnd = null;

    function toDateOnly(d) {
        const dt = new Date(d);
        return new Date(dt.getFullYear(), dt.getMonth(), dt.getDate());
    }

    function isSameDay(a, b) {
        return (
            a.getFullYear() === b.getFullYear() &&
            a.getMonth() === b.getMonth() &&
            a.getDate() === b.getDate()
        );
    }

    function isWithinRange(date, start, end) {
        if (start && date < start) return false;
        if (end && date > end) return false;
        return true;
    }

    function applyFilter() {
        const range = document.getElementById('filterRange').value;
        const startInput = document.getElementById('startDate').value;
        const endInput = document.getElementById('endDate').value;

        const today = toDateOnly(new Date());
        let start = null;
        let end = null;

        if (range === 'today') {
            start = today;
            end = today;
        } else if (range === 'week') {
            const day = today.getDay(); // 0-6
            const diff = (day === 0 ? 6 : day - 1);
            start = new Date(today);
            start.setDate(today.getDate() - diff);
            end = today;
        } else if (range === 'month') {
            start = new Date(today.getFullYear(), today.getMonth(), 1);
            end = today;
        } else if (range === 'custom') {
            if (startInput) {
                const s = new Date(startInput);
                start = toDateOnly(s);
            }
            if (endInput) {
                const e = new Date(endInput);
                end = toDateOnly(e);
            }
        }

        filteredOrders = allOrders.filter(o => {
            if (!o.createdAt) return false;
            const d = toDateOnly(o.createdAt);
            if (range === 'all') return true;
            if (range === 'today') return isSameDay(d, today);
            if (range === 'week' || range === 'month' || range === 'custom') {
                return isWithinRange(d, start, end);
            }
            return true;
        });

        // จำค่า filter ล่าสุด
        lastRange = range;
        lastStart = start;
        lastEnd = end;

        renderStats();
        renderTable();
        renderChart(range, start, end);
        renderTopProductsChart();
    }

    function renderStats() {
        const totalRevenue = filteredOrders.reduce((sum, o) => sum + (o.total || 0), 0);
        const orderCount = filteredOrders.length;
        const itemsSold = filteredOrders.reduce(
            (sum, o) => sum + o.items.reduce((s, i) => s + (i.qty || 0), 0),
            0
        );
        const avgOrder = orderCount > 0 ? totalRevenue / orderCount : 0;

        document.getElementById('totalRevenueValue').textContent = formatCurrency(totalRevenue);
        document.getElementById('orderCountValue').textContent = orderCount;
        document.getElementById('itemsSoldValue').textContent = itemsSold;
        document.getElementById('avgOrderValue').textContent = formatCurrency(avgOrder);

        document.getElementById('orderCountLabelSales').textContent =
            orderCount + ' ออเดอร์';
    }

    function renderTable() {
        const tbody = document.getElementById('salesTableBody');
        tbody.innerHTML = '';

        if (filteredOrders.length === 0) {
            tbody.innerHTML = `<tr><td colspan="5" class="empty">ไม่มีออเดอร์ในช่วงเวลานี้</td></tr>`;
            return;
        }

        const sorted = [...filteredOrders].sort(
            (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
        );

        sorted.forEach(order => {
            const tr = document.createElement('tr');
            const itemSummary = order.items.map(i => `${i.name} x${i.qty}`).join(', ');
            const paymentLabel = PaymentLabels[order.paymentMethod] || order.paymentMethod;
            const statusClass = order.isPaid ? 'status-paid' : 'status-pending';
            const statusText = order.isPaid ? 'Paid' : 'Pending';

            tr.innerHTML = `
                <td class="small">${formatDateTime(order.createdAt)}</td>
                <td class="small">
                    <div><span class="pill">#${order.orderNo}</span></div>
                    <div class="small">${itemSummary}</div>
                </td>
                <td>${formatCurrency(order.total)}</td>
                <td class="small">${paymentLabel}</td>
                <td><span class="status-pill ${statusClass}">${statusText}</span></td>
            `;

            tbody.appendChild(tr);
        });
    }

    // ===== กราฟยอดขาย (รายวัน / รายเดือน) =====
    function renderChart(range, start, end) {
        const container = document.getElementById('salesChart');
        const label = document.getElementById('chartRangeLabel');
        container.innerHTML = '';

        if (filteredOrders.length === 0) {
            container.innerHTML =
                `<div class="empty" style="padding: 16px;">ไม่มีข้อมูลสำหรับกราฟในช่วงเวลานี้</div>`;
            label.textContent = '';
            return;
        }

        // group ข้อมูล
        const map = {};

        if (salesChartMode === 'daily') {
            filteredOrders.forEach(o => {
                const d = new Date(o.createdAt);
                const key = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') +
                    '-' + String(d.getDate()).padStart(2, '0');
                map[key] = (map[key] || 0) + (o.total || 0);
            });
        } else {
            // monthly
            filteredOrders.forEach(o => {
                const d = new Date(o.createdAt);
                const key = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0'); // yyyy-MM
                map[key] = (map[key] || 0) + (o.total || 0);
            });
        }

        const entries = Object.entries(map).sort((a, b) => new Date(a[0]) - new Date(b[0]));
        const max = Math.max(...entries.map(e => e[1]), 1);

        entries.forEach(([key, total]) => {
            const bar = document.createElement('div');
            bar.className = 'chart-bar';

            const inner = document.createElement('div');
            inner.className = 'chart-bar-inner';
            const height = Math.max((total / max) * 100, 12);
            inner.style.height = height + '%';

            const value = document.createElement('div');
            value.className = 'chart-bar-value';
            value.textContent = Math.round(total).toLocaleString('th-TH');

            const labelEl = document.createElement('div');
            labelEl.className = 'chart-bar-label';

            if (salesChartMode === 'daily') {
                labelEl.textContent = key; // yyyy-MM-dd
                bar.setAttribute('data-tooltip', `${key} : ${formatCurrency(total)}`);
            } else {
                // แปลง yyyy-MM เป็น เดือน/ปี แบบสั้น
                const [y, m] = key.split('-');
                const dt = new Date(Number(y), Number(m) - 1, 1);
                const txt = dt.toLocaleDateString('th-TH', { month: 'short', year: '2-digit' });
                labelEl.textContent = txt;
                bar.setAttribute('data-tooltip', `${txt} : ${formatCurrency(total)}`);
            }

            bar.appendChild(value);
            bar.appendChild(inner);
            bar.appendChild(labelEl);
            container.appendChild(bar);
        });

        // label ช่วงเวลา
        if (range === 'all') label.textContent = 'แสดงทุกออเดอร์ทั้งหมด';
        else if (range === 'today') label.textContent = 'เฉพาะออเดอร์ของวันนี้';
        else if (range === 'week') label.textContent = 'เฉพาะออเดอร์ในสัปดาห์นี้';
        else if (range === 'month') label.textContent = 'เฉพาะออเดอร์ในเดือนนี้';
        else if (range === 'custom') label.textContent = 'เฉพาะออเดอร์ในช่วงวันที่ที่กำหนด';
        else label.textContent = '';
    }

    function clearFilter() {
        document.getElementById('filterRange').value = 'all';
        document.getElementById('startDate').value = '';
        document.getElementById('endDate').value = '';
        applyFilter();
    }

    function handleRangeChange() {
        const range = document.getElementById('filterRange').value;
        const startInput = document.getElementById('startDate');
        const endInput = document.getElementById('endDate');

        const isCustom = range === 'custom';
        startInput.disabled = !isCustom;
        endInput.disabled = !isCustom;

        applyFilter();
    }

    // ===== Top 3 Products =====
    function getTopProducts(limit = 3) {
        const map = {};
        filteredOrders.forEach(o => {
            o.items.forEach(i => {
                if (!i.name) return;
                map[i.name] = (map[i.name] || 0) + (i.qty || 0);
            });
        });

        return Object.entries(map)
            .map(([name, qty]) => ({ name, qty }))
            .sort((a, b) => b.qty - a.qty)
            .slice(0, limit);
    }

    function renderTopProductsChart() {
        const container = document.getElementById('topProductsChart');
        if (!container) return;
        container.innerHTML = '';

        const top = getTopProducts(3);

        if (!top.length) {
            container.innerHTML = `<div class="empty">ไม่มีข้อมูลสินค้าในช่วงเวลานี้</div>`;
            return;
        }

        const maxQty = Math.max(...top.map(t => t.qty), 1);

        if (topChartMode === 'hbar') {
            top.forEach(item => {
                const row = document.createElement('div');
                row.className = 'top-product-bar';

                const label = document.createElement('div');
                label.className = 'top-product-label';
                label.textContent = item.name;

                const main = document.createElement('div');
                main.className = 'top-product-bar-main';

                const bar = document.createElement('div');
                bar.className = 'top-product-inner';
                bar.style.width = `${(item.qty / maxQty) * 100}%`;

                const value = document.createElement('div');
                value.className = 'top-product-value';
                value.textContent = item.qty + ' ชิ้น';

                main.appendChild(bar);
                main.appendChild(value);

                row.appendChild(label);
                row.appendChild(main);

                container.appendChild(row);
            });
        } else if (topChartMode === 'pie') {
            const totalQty = top.reduce((sum, t) => sum + t.qty, 0) || 1;
            const colors = ['#3b82f6', '#6366f1', '#0ea5e9'];

            const wrapper = document.createElement('div');
            wrapper.className = 'top-pie-wrapper';

            const pie = document.createElement('div');
            pie.className = 'top-pie';

            let current = 0;
            const parts = top.map((item, idx) => {
                const pct = (item.qty / totalQty) * 100;
                const start = current;
                const end = current + pct;
                current = end;
                return `${colors[idx]} ${start}% ${end}%`;
            });

            pie.style.background = `conic-gradient(${parts.join(',')})`;

            const legend = document.createElement('div');
            legend.className = 'top-pie-legend';

            top.forEach((item, idx) => {
                const percent = ((item.qty / totalQty) * 100).toFixed(1);
                const row = document.createElement('div');
                row.className = 'top-pie-legend-item';

                const dot = document.createElement('div');
                dot.className = 'top-pie-dot';
                dot.style.background = colors[idx];

                const text = document.createElement('div');
                text.textContent = `${item.name} — ${item.qty} ชิ้น (${percent}%)`;

                row.appendChild(dot);
                row.appendChild(text);
                legend.appendChild(row);
            });

            wrapper.appendChild(pie);
            wrapper.appendChild(legend);

            container.appendChild(wrapper);
        }
    }

    // ===== ตั้งค่า Tab Switch ต่าง ๆ =====
    function setupSalesChartSwitch() {
        const switchEl = document.getElementById('salesChartSwitch');
        if (!switchEl) return;

        const tabs = switchEl.querySelectorAll('.chart-tab');
        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                tabs.forEach(t => t.classList.remove('active'));
                tab.classList.add('active');

                const type = tab.getAttribute('data-type');
                salesChartMode = (type === 'monthly') ? 'monthly' : 'daily';

                // วาดกราฟใหม่ด้วย filter เดิม
                renderChart(lastRange, lastStart, lastEnd);
            });
        });
    }

    function setupTopProductsSwitch() {
        const switchEl = document.getElementById('topProductsSwitch');
        if (!switchEl) return;

        const tabs = switchEl.querySelectorAll('.chart-tab');
        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                tabs.forEach(t => t.classList.remove('active'));
                tab.classList.add('active');

                const type = tab.getAttribute('data-top-type');
                if (type === 'pie') topChartMode = 'pie';
                else topChartMode = 'hbar';

                renderTopProductsChart();
            });
        });
    }

    function init() {
        allOrders = OrderStore.getAll();
        filteredOrders = allOrders.slice();

        document
            .getElementById('filterRange')
            .addEventListener('change', handleRangeChange);

        document
            .getElementById('startDate')
            .addEventListener('change', applyFilter);

        document
            .getElementById('endDate')
            .addEventListener('change', applyFilter);

        document
            .getElementById('btnClearFilter')
            .addEventListener('click', clearFilter);

        setupSalesChartSwitch();
        setupTopProductsSwitch();

        // init state
        handleRangeChange();
    }

    document.addEventListener('DOMContentLoaded', init);
})(window);
