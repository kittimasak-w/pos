// table.js
(function (window) {
    'use strict';

    const LS_KEY = 'pos_demo_tables';

    // โต๊ะเริ่มต้น 12 โต๊ะ
    const DEFAULT_TABLES = Array.from({ length: 12 }, (_, i) => ({
        id: i + 1,
        name: 'โต๊ะ ' + (i + 1),
        status: 'available',
    }));

    function loadTables() {
        const raw = localStorage.getItem(LS_KEY);
        if (!raw) {
            localStorage.setItem(LS_KEY, JSON.stringify(DEFAULT_TABLES));
            return DEFAULT_TABLES.slice();
        }

        try {
            const data = JSON.parse(raw);
            if (!Array.isArray(data) || data.length === 0) {
                localStorage.setItem(LS_KEY, JSON.stringify(DEFAULT_TABLES));
                return DEFAULT_TABLES.slice();
            }
            return data;
        } catch (e) {
            console.error('Invalid table data, reset to default', e);
            localStorage.setItem(LS_KEY, JSON.stringify(DEFAULT_TABLES));
            return DEFAULT_TABLES.slice();
        }
    }

    function saveTables(tables) {
        localStorage.setItem(LS_KEY, JSON.stringify(tables));
    }

    function getTableById(id) {
        const tables = loadTables();
        return tables.find(t => t.id === id) || null;
    }

    function updateTableStatus(id, status) {
        const tables = loadTables();
        const idx = tables.findIndex(t => t.id === id);
        if (idx === -1) return;

        tables[idx] = {
            ...tables[idx],
            status: status
        };

        saveTables(tables);
    }

    window.TableStore = {
        loadTables,
        saveTables,
        getTableById,
        updateTableStatus
    };

})(window);
