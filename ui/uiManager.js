const UIManager = {
    go(page) {
        // 显示加载动画
        const loadingScreen = document.getElementById('loading-screen');
        if (loadingScreen) {
            loadingScreen.style.display = 'flex';
            loadingScreen.classList.remove('opacity-0', 'pointer-events-none');
            loadingScreen.style.transition = 'none';
        }
        
        // 延迟切换页面，让加载动画显示
        setTimeout(() => {
            // 隐藏所有页面
            document.querySelectorAll('.page').forEach(p => {
                p.classList.remove('active', 'fade-in', 'slide-up');
            });
            
            // 显示目标页面并添加动画
            const targetPage = document.getElementById(page + 'Page');
            if (targetPage) {
                targetPage.classList.add('active', 'fade-in', 'slide-up');
            }
            
            // 更新导航栏状态
            document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active', 'home', 'chart', 'record', 'setting'));
            
            const items = document.querySelectorAll('.nav-item');
            if (page === 'dashboard') {
                items[0].classList.add('active', 'home', 'scale-in');
                // 显示年月选择器容器
                const selectorContainer = document.querySelector('.flex.gap-2.mt-1');
                if (selectorContainer) {
                    selectorContainer.style.display = 'flex';
                    selectorContainer.classList.add('fade-in', 'slide-down');
                }
                // 刷新仪表板数据和模块显示状态
                this.updateDashboard();
            }
            if (page === 'charts') {
                items[1].classList.add('active', 'chart', 'scale-in');
                // 隐藏年月选择器容器
                const selectorContainer = document.querySelector('.flex.gap-2.mt-1');
                if (selectorContainer) {
                    selectorContainer.style.display = 'none';
                }
                setTimeout(() => ChartManager.drawChart(), 50);
            }
            if (page === 'records') {
                items[2].classList.add('active', 'record', 'scale-in');
                // 隐藏年月选择器容器
                const selectorContainer = document.querySelector('.flex.gap-2.mt-1');
                if (selectorContainer) {
                    selectorContainer.style.display = 'none';
                }
                this.syncYearToRecord();
                this.renderList();
            }
            if (page === 'settings') {
                items[3].classList.add('active', 'setting', 'scale-in');
                // 隐藏年月选择器容器
                const selectorContainer = document.querySelector('.flex.gap-2.mt-1');
                if (selectorContainer) {
                    selectorContainer.style.display = 'none';
                }
            }
            
            // 更新页面标题并添加动画
            const pageTitle = document.getElementById('pageTitle');
            if (pageTitle) {
                pageTitle.textContent = Config.PAGE_TITLES[page];
                pageTitle.classList.remove('fade-in');
                // 触发重排
                void pageTitle.offsetWidth;
                pageTitle.classList.add('fade-in');
            }
            
            // 隐藏加载动画
            if (loadingScreen) {
                setTimeout(() => {
                    loadingScreen.classList.add('opacity-0', 'pointer-events-none');
                    loadingScreen.style.transition = 'opacity 0.3s ease';
                    setTimeout(() => {
                        loadingScreen.style.display = 'none';
                    }, 300);
                }, 200);
            }
        }, 300);
    },

    initYearSelect() {
        const sel = document.getElementById('yearFilter');
        const currentYear = new Date().getFullYear();
        for (let y = 2000; y <= 2200; y++) {
            const opt = document.createElement('option');
            opt.value = y;
            opt.textContent = y + '年度';
            if (y == currentYear) opt.selected = true;
            sel.appendChild(opt);
        }
        this.initMonthSelect();
    },

    initMonthSelect() {
        const sel = document.getElementById('monthFilter');
        sel.innerHTML = '';
        for (let m = 1; m <= 12; m++) {
            const opt = document.createElement('option');
            opt.value = m;
            opt.textContent = m + '月';
            if (m == AppState.currentMonth) opt.selected = true;
            sel.appendChild(opt);
        }
    },

    initChartYearSelect() {
        const sel = document.getElementById('chartYearFilter');
        sel.innerHTML = '';
        // 添加"全部年份"选项
        const allOpt = document.createElement('option');
        allOpt.value = '';
        allOpt.textContent = '全部年份';
        allOpt.selected = true;
        sel.appendChild(allOpt);
        // 添加年份选项
        const currentYear = new Date().getFullYear();
        for (let y = 2000; y <= 2200; y++) {
            const opt = document.createElement('option');
            opt.value = y;
            opt.textContent = y + '年';
            sel.appendChild(opt);
        }
        this.initChartMonthSelect();
    },

    initChartMonthSelect() {
        const sel = document.getElementById('chartMonthFilter');
        sel.innerHTML = '';
        // 添加"全部月份"选项
        const allOpt = document.createElement('option');
        allOpt.value = '';
        allOpt.textContent = '全部月份';
        allOpt.selected = true;
        sel.appendChild(allOpt);
        // 添加"全年"选项
        const yearOpt = document.createElement('option');
        yearOpt.value = 'year';
        yearOpt.textContent = '全年';
        sel.appendChild(yearOpt);
        // 添加月份选项
        for (let m = 1; m <= 12; m++) {
            const opt = document.createElement('option');
            opt.value = m;
            opt.textContent = m + '月';
            sel.appendChild(opt);
        }
    },

    syncYearToRecord() {
        const sel = document.getElementById('recordYearFilter');
        sel.innerHTML = `<option value="all" selected>全部年份</option>`;
        for (let y = 2000; y <= 2200; y++) {
            const opt = document.createElement('option');
            opt.value = y;
            opt.textContent = y + '年';
            sel.appendChild(opt);
        }
        this.updateMonthOptions();
    },

    updateMonthOptions() {
        const y = document.getElementById('recordYearFilter').value;
        const sel = document.getElementById('recordMonthFilter');
        sel.innerHTML = `<option value="all">全部月份</option>`;
        if (y === 'all') return;
        for (let m = 1; m <= 12; m++) {
            const opt = document.createElement('option');
            opt.value = String(m).padStart(2, '0');
            opt.textContent = m + '月';
            sel.appendChild(opt);
        }
    },

    async renderList() {
        try {
            const typeFilter = document.querySelector('[data-f].btn-active').dataset.f;
            const selY = document.getElementById('recordYearFilter').value;
            const selM = document.getElementById('recordMonthFilter').value;
            let bills = await DataManager.getBills();
            bills = bills.sort((a, b) => b.date.localeCompare(a.date));

            if (typeFilter !== 'all') bills = bills.filter(i => i.type === typeFilter);
            if (selY !== 'all') bills = bills.filter(i => i.date.startsWith(selY));
            if (selM !== 'all') bills = bills.filter(i => i.date.endsWith('-' + selM));

            const dom = document.getElementById('recordList');
            if (bills.length === 0) {
                dom.innerHTML = '<div class="text-center py-8 text-gray-400 fade-in"><i class="fa fa-file-text-o text-2xl mb-2"></i><p>暂无记录</p></div>';
                return;
            }

            const yearGroup = {};
            bills.forEach(b => {
                const y = b.date.slice(0, 4);
                if (!yearGroup[y]) yearGroup[y] = [];
                yearGroup[y].push(b);
            });

            let html = '';
            Object.keys(yearGroup).sort().reverse().forEach(year => {
                const items = yearGroup[year];
                const yearTotal = items.reduce((s, i) => s + parseFloat(i.amount), 0).toFixed(2);
                const isYearOpen = AppState.expandedYears.has(year);

                const monthGroup = {};
                items.forEach(b => {
                    const m = b.date.slice(5, 7);
                    if (!monthGroup[m]) monthGroup[m] = [];
                    monthGroup[m].push(b);
                });

                html += `
                <div class="rounded-xl overflow-hidden border border-gray-200 fade-in slide-up">
                    <div class="flex justify-between items-center p-3 bg-gray-50 cursor-pointer" onclick="App.toggleYear('${year}')">
                        <div class="font-medium">${year} 年</div>
                        <div class="flex items-center gap-2">
                            <span class="font-bold text-primary">¥${yearTotal}</span>
                            <i class="fa ${isYearOpen ? 'fa-chevron-up' : 'fa-chevron-down'} text-xs text-gray-400 transition-transform duration-300"></i>
                        </div>
                    </div>

                    ${isYearOpen ? `
                    <div class="bg-white divide-y divide-gray-100 fade-in slide-down">
                        ${Object.keys(monthGroup).sort().reverse().map(month => {
                            const mItems = monthGroup[month];
                            const monthTotal = mItems.reduce((s, i) => s + parseFloat(i.amount), 0).toFixed(2);
                            const isMonthOpen = AppState.expandedMonths.has(year + '-' + month);
                            const icon = isMonthOpen ? 'fa-chevron-up' : 'fa-chevron-down';

                            return `
                            <div class="border-t border-gray-100/60">
                                <div class="flex justify-between items-center p-3 bg-gray-50/50 cursor-pointer" onclick="App.toggleMonth('${year}-${month}')">
                                    <div class="text-sm font-medium">${month} 月</div>
                                    <div class="flex items-center gap-2">
                                        <span class="text-primary font-semibold">¥${monthTotal}</span>
                                        <button onclick="event.stopPropagation(); App.editMonth('${year}-${month}')" class="w-7 h-7 rounded bg-gray-100 flex items-center justify-center text-xs transition-transform duration-200 hover:scale-110">
                                            <i class="fa fa-pencil"></i>
                                        </button>
                                        <i class="fa ${icon} text-xs text-gray-400 transition-transform duration-300"></i>
                                    </div>
                                </div>

                                ${isMonthOpen ? `
                                <div class="divide-y divide-gray-100/50">
                                    ${mItems.map(i => {
                                        const colorClass = 'text-' + i.type;
                                        const icon = Config.ICON_MAP[i.type];
                                        const label = Config.TYPE_MAP[i.type];
                                        let usageText = '';
                                        if (i.type === 'water' && i.usage) usageText = `用水量 ${i.usage} m³`;
                                        if (i.type === 'electricity' && i.usage) usageText = `用电量 ${i.usage} kWh`;
                                        if (i.type === 'gas' && i.usage) usageText = `用气量 ${i.usage} m³`;

                                        return `
                                        <div class="p-3 flex items-center justify-between fade-in slide-up" data-id="${i.id}">
                                            <div class="flex flex-col">
                                                <div class="${colorClass} font-medium">${icon} ${label}</div>
                                                ${usageText ? `<div class="text-xs text-gray-500 mt-0.5">${usageText}</div>` : ''}
                                            </div>
                                            <div class="text-right">
                                                <div class="${colorClass} font-bold">¥${parseFloat(i.amount).toFixed(2)}</div>
                                            </div>
                                            <div class="flex gap-1 ml-2">
                                                <button onclick="App.delItem(${i.id})" class="w-7 h-7 rounded bg-red-50 text-red-500 flex items-center justify-center text-xs transition-transform duration-200 hover:scale-110">
                                                    <i class="fa fa-trash"></i>
                                                </button>
                                            </div>
                                        </div>`;
                                    }).join('')}
                                </div>` : ''}
                            </div>`;
                        }).join('')}
                    </div>` : ''}
                </div>`;
            });

            dom.innerHTML = html;
            // 为新添加的记录项添加动画延迟，使效果更美观
            setTimeout(() => {
                const recordItems = dom.querySelectorAll('.fade-in.slide-up');
                recordItems.forEach((item, index) => {
                    item.style.animationDelay = `${index * 0.05}s`;
                });
            }, 10);
        } catch (error) {
            console.error('Error rendering list:', error);
            document.getElementById('recordList').innerHTML = '<div class="text-center py-8 text-gray-400 fade-in"><i class="fa fa-exclamation-circle text-2xl mb-2"></i><p>加载记录失败</p></div>';
        }
    },

    toggleMonth(key) {
        AppState.expandedMonths.has(key) ? AppState.expandedMonths.delete(key) : AppState.expandedMonths.add(key);
        this.renderList();
    },

    toggleYear(year) {
        AppState.expandedYears.has(year) ? AppState.expandedYears.delete(year) : AppState.expandedYears.add(year);
        this.renderList();
    },

    updateUsageDisplay(type) {
        document.getElementById('waterUsage').classList.add('hidden');
        document.getElementById('elecUsage').classList.add('hidden');
        document.getElementById('gasUsage').classList.add('hidden');
        if (type === 'water') document.getElementById('waterUsage').classList.remove('hidden');
        if (type === 'electricity') document.getElementById('elecUsage').classList.remove('hidden');
        if (type === 'gas') document.getElementById('gasUsage').classList.remove('hidden');
    },

    recalcUsageAfterTypeChange() {
        const t = document.querySelector('input[name="type"]:checked').value;
        const amt = parseFloat(document.getElementById('billAmount').value) || 0;
        this.updateUsageDisplay(t);
        if (t === 'water') {
            const val = Utils.calculateUsage(amt, Config.PRICE.water);
            document.querySelector('#waterUsage span').textContent = val + ' m³';
        }
        if (t === 'electricity') {
            const val = Utils.calculateUsage(amt, Config.PRICE.electricity);
            document.querySelector('#elecUsage span').textContent = val + ' kWh';
        }
        if (t === 'gas') {
            const val = Utils.calculateUsage(amt, Config.PRICE.gas);
            document.querySelector('#gasUsage span').textContent = val + ' m³';
        }
    },

    async updateDashboard() {
        try {
            const bills = await DataManager.getBills();
            const currentYear = AppState.currentYear;
            const currentMonth = AppState.currentMonth;
            const currMonth = `${currentYear}-${String(currentMonth).padStart(2, '0')}`;
            const lastMonth = Utils.prevMonth(currMonth);
            const lastYearMonth = currMonth.replace(currentYear, Number(currentYear) - 1);

            const sum = (type, month) => bills.filter(i => i.date === month && i.type === type)
                .reduce((s, i) => s + parseFloat(i.amount || 0), 0);

            const w = sum('water', currMonth);
            const e = sum('electricity', currMonth);
            const g = sum('gas', currMonth);
            const p = sum('property', currMonth);
            const pk = sum('parking', currMonth);

            const wm = sum('water', lastMonth);
            const em = sum('electricity', lastMonth);
            const gm = sum('gas', lastMonth);
            const pm = sum('property', lastMonth);
            const pkm = sum('parking', lastMonth);

            const wy = sum('water', lastYearMonth);
            const ey = sum('electricity', lastYearMonth);
            const gy = sum('gas', lastYearMonth);
            const py = sum('property', lastYearMonth);
            const pky = sum('parking', lastYearMonth);

            const set = (id, v, m, y) => {
                const element = document.getElementById('month' + id.charAt(0).toUpperCase() + id.slice(1) + 'Cost');
                if (element) {
                    element.textContent = Utils.formatCurrency(v);
                }
                const cm = Utils.compare(v, m, 'month');
                const cy = Utils.compare(v, y, 'year');
                const elM = document.getElementById(id + 'MonthCompare');
                const elY = document.getElementById(id + 'YearCompare');
                if (elM) {
                    elM.textContent = cm.text;
                    elM.className = cm.cls + ' text-xs';
                }
                if (elY) {
                    elY.textContent = cy.text;
                    elY.className = cy.cls + ' text-xs';
                }
            };

            set('water', w, wm, wy);
            set('elec', e, em, ey);
            set('gas', g, gm, gy);
            set('property', p, pm, py);
            set('parking', pk, pkm, pky);

            const yBills = bills.filter(i => i.date.startsWith(currentYear));
            const ySum = t => yBills.filter(i => i.type === t).reduce((s, i) => s + parseFloat(i.amount || 0), 0);
            const yUse = t => yBills.filter(i => i.type === t).reduce((s, i) => s + parseFloat(i.usage || 0), 0).toFixed(2);

            const yearWaterTotal = document.getElementById('yearWaterTotal');
            const yearElecTotal = document.getElementById('yearElecTotal');
            const yearGasTotal = document.getElementById('yearGasTotal');
            const yearPropertyTotal = document.getElementById('yearPropertyTotal');
            const yearParkingTotal = document.getElementById('yearParkingTotal');
            const yearTotalCost = document.getElementById('yearTotalCost');
            const yearWaterUsage = document.getElementById('yearWaterUsage');
            const yearElecUsage = document.getElementById('yearElecUsage');
            const yearGasUsage = document.getElementById('yearGasUsage');

            if (yearWaterTotal) yearWaterTotal.textContent = Utils.formatCurrency(ySum('water'));
            if (yearElecTotal) yearElecTotal.textContent = Utils.formatCurrency(ySum('electricity'));
            if (yearGasTotal) yearGasTotal.textContent = Utils.formatCurrency(ySum('gas'));
            if (yearPropertyTotal) yearPropertyTotal.textContent = Utils.formatCurrency(ySum('property'));
            if (yearParkingTotal) yearParkingTotal.textContent = Utils.formatCurrency(ySum('parking'));
            if (yearTotalCost) yearTotalCost.textContent = Utils.formatCurrency(
                ySum('water') + ySum('electricity') + ySum('gas') + ySum('property') + ySum('parking')
            );

            if (yearWaterUsage) yearWaterUsage.textContent = yUse('water') + ' m³';
            if (yearElecUsage) yearElecUsage.textContent = yUse('electricity') + ' kWh';
            if (yearGasUsage) yearGasUsage.textContent = yUse('gas') + ' m³';

            // 根据模块开关状态显示或隐藏模块
            const moduleVisibility = AppState.moduleVisibility || {
                water: true,
                electricity: true,
                gas: true,
                property: true,
                parking: true
            };

            // 显示或隐藏本月费用模块
            const modules = {
                water: document.getElementById('waterModule'),
                electricity: document.getElementById('electricityModule'),
                gas: document.getElementById('gasModule'),
                property: document.getElementById('propertyModule'),
                parking: document.getElementById('parkingModule')
            };

            // 统计可见的模块数量
            const visibleModules = [];
            for (const [key, module] of Object.entries(modules)) {
                if (module) {
                    if (moduleVisibility[key]) {
                        module.classList.remove('hidden');
                        visibleModules.push(module);
                    } else {
                        module.classList.add('hidden');
                    }
                }
            }

            // 动态调整模块布局
            const dashboardGrid = document.querySelector('#dashboardPage .grid');
            if (dashboardGrid) {
                // 重置所有模块的col-span
                for (const module of Object.values(modules)) {
                    if (module) {
                        module.classList.remove('col-span-1', 'col-span-2');
                    }
                }

                // 根据可见模块数量调整布局
                if (visibleModules.length === 1) {
                    // 只有一个模块时，占满整行
                    visibleModules[0].classList.add('col-span-2');
                } else if (visibleModules.length === 2) {
                    // 两个模块时，各占一半
                    visibleModules[0].classList.add('col-span-1');
                    visibleModules[1].classList.add('col-span-1');
                } else if (visibleModules.length === 3) {
                    // 三个模块时，前两个各占一半，第三个占满整行
                    visibleModules[0].classList.add('col-span-1');
                    visibleModules[1].classList.add('col-span-1');
                    visibleModules[2].classList.add('col-span-2');
                } else if (visibleModules.length === 4) {
                    // 四个模块时，各占一半
                    visibleModules[0].classList.add('col-span-1');
                    visibleModules[1].classList.add('col-span-1');
                    visibleModules[2].classList.add('col-span-1');
                    visibleModules[3].classList.add('col-span-1');
                } else if (visibleModules.length === 5) {
                    // 五个模块时，前四个各占一半，第五个占满整行
                    visibleModules[0].classList.add('col-span-1');
                    visibleModules[1].classList.add('col-span-1');
                    visibleModules[2].classList.add('col-span-1');
                    visibleModules[3].classList.add('col-span-1');
                    visibleModules[4].classList.add('col-span-2');
                }
            }
        } catch (error) {
            console.error('Error updating dashboard:', error);
        }
    }
};