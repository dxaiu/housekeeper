const ChartManager = {
    async drawChart() {
        try {
            const ctx = document.getElementById('mainChart');
            if (!ctx) return;
            const context = ctx.getContext('2d');
            if (!context) return;

            const bills = await DataManager.getBills();
            const chartYear = document.getElementById('chartYearFilter').value;
            const chartMonth = document.getElementById('chartMonthFilter').value;
            const style = document.getElementById('chartStyle').value;
            const filter = document.querySelector('[data-filter].btn-active').dataset.filter;

            // 根据选择的年份和月份筛选数据
            let filteredBills = chartYear ? bills.filter(i => i.date.startsWith(chartYear)) : bills;
            // 如果选择了具体的月份，则进一步筛选
            if (chartMonth && chartMonth !== '' && chartMonth !== 'year') {
                const monthStr = String(chartMonth).padStart(2, '0');
                filteredBills = filteredBills.filter(i => i.date.endsWith('-' + monthStr));
            }
            
            const map = {};
            filteredBills.forEach(i => {
                // 如果选择了具体月份，使用费用类型作为键
                // 如果选择了全年，使用年份作为键
                // 否则使用日期作为键
                let key;
                if (chartMonth && chartMonth !== '' && chartMonth !== 'year') {
                    key = i.type;
                } else if (chartMonth === 'year') {
                    key = i.date.slice(0, 4);
                } else {
                    key = i.date;
                }
                
                if (!map[key]) {
                    if (chartMonth && chartMonth !== '' && chartMonth !== 'year') {
                        // 选择了具体月份，直接存储金额
                        map[key] = 0;
                    } else {
                        // 未选择具体月份或选择了全年，按日期/年份存储各类型金额
                        map[key] = { water: 0, electricity: 0, gas: 0, property: 0, parking: 0, total: 0 };
                    }
                }
                const val = parseFloat(i.amount || 0);
                if (chartMonth && chartMonth !== '' && chartMonth !== 'year') {
                    map[key] += val;
                } else {
                    map[key][i.type] += val;
                    map[key].total += val;
                }
            });

            let labels = [];
            let datasets = [];

            if (chartMonth && chartMonth !== '' && chartMonth !== 'year') {
                // 选择了具体月份，显示各费用类型的金额
                labels = Object.keys(map).map(type => Config.TYPE_MAP[type] || type);
                const yearLabel = chartYear ? `${chartYear}年` : '全部年份';
                datasets.push({
                    label: `${yearLabel}${chartMonth}月费用`,
                    data: Object.values(map),
                    backgroundColor: Object.keys(map).map(type => Config.COLOR_MAP[type] + '33'),
                    borderColor: Object.keys(map).map(type => Config.COLOR_MAP[type]),
                    borderWidth: 2,
                    tension: 0,
                    fill: true
                });
            } else if (chartMonth === 'year') {
                // 选择了全年，显示各年份的费用
                labels = Object.keys(map).sort();
                
                let types = [];
                if (filter === 'all') {
                    types = ['water', 'electricity', 'gas', 'property', 'parking'];
                } else if (filter === 'total') {
                    types = ['total'];
                } else {
                    types = [filter];
                }

                types.forEach(t => {
                    let label = Config.TYPE_MAP[t] || t;
                    if (t === 'total') label = '总费用';

                    datasets.push({
                        label: label,
                        data: labels.map(k => map[k][t] || 0),
                        backgroundColor: t === 'total' ? '#1677ff33' : Config.COLOR_MAP[t] + '33',
                        borderColor: Config.COLOR_MAP[t],
                        borderWidth: t === 'total' ? 3 : 2,
                        tension: style === 'curve' ? 0.4 : 0,
                        fill: true
                    });
                });
            } else {
                // 未选择具体月份，显示各月份的费用
                labels = Object.keys(map).sort();
                
                let types = [];
                if (filter === 'all') {
                    types = ['water', 'electricity', 'gas', 'property', 'parking'];
                } else if (filter === 'total') {
                    types = ['total'];
                } else {
                    types = [filter];
                }

                types.forEach(t => {
                    let label = Config.TYPE_MAP[t] || t;
                    if (t === 'total') label = '总费用';

                    datasets.push({
                        label: label,
                        data: labels.map(k => map[k][t] || 0),
                        backgroundColor: t === 'total' ? '#1677ff33' : Config.COLOR_MAP[t] + '33',
                        borderColor: Config.COLOR_MAP[t],
                        borderWidth: t === 'total' ? 3 : 2,
                        tension: style === 'curve' ? 0.4 : 0,
                        fill: true
                    });
                });
            }

            if (AppState.chart) AppState.chart.destroy();
            AppState.chart = new Chart(context, {
                type: style === 'bar' ? 'bar' : 'line',
                data: { labels, datasets },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { position: 'top' } },
                    scales: { y: { beginAtZero: true } }
                }
            });
        } catch (error) {
            console.error('Error drawing chart:', error);
        }
    }
};