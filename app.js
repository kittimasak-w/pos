(function (window) {
    'use strict';

    function formatCurrency(value) {
        return '฿' + Number(value || 0).toLocaleString('th-TH', {
            minimumFractionDigits: 0
        });
    }

    function formatDateTime(dtString) {
        const d = new Date(dtString);
        return d.toLocaleString('th-TH', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    const PaymentLabels = {
        cash: 'เงินสด',
        qr: 'QR / PromptPay',
        card: 'บัตรเครดิต/เดบิต',
        transfer: 'โอนเงิน'
    };

    window.AppUtils = {
        formatCurrency,
        formatDateTime,
        PaymentLabels
    };
})(window);
