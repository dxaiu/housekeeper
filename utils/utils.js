const Utils = {
    prevMonth(ym) {
        const [y, m] = ym.split('-').map(Number);
        return m === 1 ? (y - 1) + '-12' : y + '-' + String(m - 1).padStart(2, '0');
    },
    
    compare(val, prev, type) {
        if (!prev || prev === 0) return { text: '—', cls: 'text-neutral' };
        if (!val || val === 0) return { text: '—', cls: 'text-neutral' };
        const diff = val - prev;
        const absDiff = Math.abs(diff).toFixed(2);
        const prefix = type === 'month' ? '上月' : '去年';
        if (diff > 0) return { text: `${prefix}↑¥${absDiff}`, cls: 'text-up' };
        if (diff < 0) return { text: `${prefix}↓¥${absDiff}`, cls: 'text-down' };
        return { text: '—', cls: 'text-neutral' };
    },
    
    formatCurrency(amount) {
        return '¥' + parseFloat(amount).toFixed(2);
    },
    
    calculateUsage(amount, price) {
        return (amount / price).toFixed(2);
    }
};