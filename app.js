const AppState = {
    currentYear: new Date().getFullYear().toString(),
    currentMonth: new Date().getMonth() + 1,
    chart: null,
    expandedMonths: new Set(),
    expandedYears: new Set(),
    moduleVisibility: {
        water: true,
        electricity: true,
        gas: true,
        property: true,
        parking: true
    }
};

const App = {
    async init() {
        try {
            await DataManager.init();
            UIManager.initYearSelect();
            UIManager.initChartYearSelect();
            this.bindEvents();
            UIManager.syncYearToRecord();
            await this.refresh();
            
            // 先检查URL锚点，决定显示哪个页面
            this.checkUrlHash();
            
            // 隐藏加载屏幕
            setTimeout(() => {
                const loadingScreen = document.getElementById('loading-screen');
                if (loadingScreen) {
                    loadingScreen.classList.add('opacity-0', 'pointer-events-none');
                    loadingScreen.style.transition = 'opacity 0.5s ease';
                    setTimeout(() => {
                        loadingScreen.style.display = 'none';
                    }, 500);
                }
            }, 1000);
        } catch (error) {
            console.error('Error initializing app:', error);
            // 即使出错也隐藏加载屏幕
            const loadingScreen = document.getElementById('loading-screen');
            if (loadingScreen) {
                loadingScreen.style.display = 'none';
            }
        }
    },
    
    checkUrlHash() {
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
            document.querySelectorAll('.page').forEach(p => p.classList.remove('active', 'fade-in', 'slide-up'));
            
            // 重置导航栏状态
            document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active', 'home', 'chart', 'record', 'setting'));
            
            if (window.location.hash === '#settings') {
                // 显示设置页面
                const settingsPage = document.getElementById('settingsPage');
                if (settingsPage) {
                    settingsPage.classList.add('active', 'fade-in', 'slide-up');
                }
                // 更新页面标题
                const pageTitle = document.getElementById('pageTitle');
                if (pageTitle) {
                    pageTitle.textContent = '设置';
                }
                // 隐藏年月选择器
                const selectorContainer = document.querySelector('.flex.gap-2.mt-1');
                if (selectorContainer) {
                    selectorContainer.style.display = 'none';
                }
                // 更新导航栏状态
                const navItems = document.querySelectorAll('.nav-item');
                if (navItems.length >= 4) {
                    navItems[3].classList.add('active', 'setting', 'scale-in');
                }
            } else {
                // 默认显示仪表板页面
                const dashboardPage = document.getElementById('dashboardPage');
                if (dashboardPage) {
                    dashboardPage.classList.add('active', 'fade-in', 'slide-up');
                }
                // 更新页面标题
                const pageTitle = document.getElementById('pageTitle');
                if (pageTitle) {
                    pageTitle.textContent = '生活管家';
                }
                // 显示年月选择器容器
                const selectorContainer = document.querySelector('.flex.gap-2.mt-1');
                if (selectorContainer) {
                    selectorContainer.style.display = 'flex';
                }
                // 更新导航栏状态
                const navItems = document.querySelectorAll('.nav-item');
                if (navItems.length >= 1) {
                    navItems[0].classList.add('active', 'home', 'scale-in');
                }
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

    bindEvents() {
        // 年份选择器功能
        const yearDisplay = document.getElementById('yearDisplay');
        const yearPicker = document.getElementById('yearPicker');
        const yearList = document.getElementById('yearList');
        const yearCancel = document.getElementById('yearCancel');
        const yearConfirm = document.getElementById('yearConfirm');
        
        // 月份选择器功能
        const monthDisplay = document.getElementById('monthDisplay');
        const monthPicker = document.getElementById('monthPicker');
        const monthList = document.getElementById('monthList');
        const monthCancel = document.getElementById('monthCancel');
        const monthConfirm = document.getElementById('monthConfirm');
        
        let selectedYear = AppState.currentYear;
        let selectedMonth = AppState.currentMonth;
        
        // 初始化年份选择器
        const initYearPicker = () => {
            yearList.innerHTML = '';
            const currentYear = new Date().getFullYear();
            for (let y = 2000; y <= 2200; y++) {
                const yearItem = document.createElement('div');
                yearItem.className = `py-3 px-8 rounded-full ${y == selectedYear ? 'bg-primary text-white' : 'text-gray-700'}`;
                yearItem.textContent = y + '年度';
                yearItem.dataset.year = y;
                yearItem.addEventListener('click', () => {
                    document.querySelectorAll('#yearList > div').forEach(item => {
                        item.classList.remove('bg-primary', 'text-white');
                        item.classList.add('text-gray-700');
                    });
                    yearItem.classList.remove('text-gray-700');
                    yearItem.classList.add('bg-primary', 'text-white');
                    selectedYear = y.toString();
                });
                yearList.appendChild(yearItem);
            }
            
            // 定位到当前选中的年份
            setTimeout(() => {
                const selectedItem = yearList.querySelector('.bg-primary');
                if (selectedItem) {
                    selectedItem.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
            }, 100);
        };
        
        // 初始化月份选择器
        const initMonthPicker = () => {
            monthList.innerHTML = '';
            for (let m = 1; m <= 12; m++) {
                const monthItem = document.createElement('div');
                monthItem.className = `py-3 px-8 rounded-full ${m == selectedMonth ? 'bg-primary text-white' : 'text-gray-700'}`;
                monthItem.textContent = m + '月';
                monthItem.dataset.month = m;
                monthItem.addEventListener('click', () => {
                    document.querySelectorAll('#monthList > div').forEach(item => {
                        item.classList.remove('bg-primary', 'text-white');
                        item.classList.add('text-gray-700');
                    });
                    monthItem.classList.remove('text-gray-700');
                    monthItem.classList.add('bg-primary', 'text-white');
                    selectedMonth = m;
                });
                monthList.appendChild(monthItem);
            }
            
            // 定位到当前选中的月份
            setTimeout(() => {
                const selectedItem = monthList.querySelector('.bg-primary');
                if (selectedItem) {
                    selectedItem.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
            }, 100);
        };
        
        // 打开年份选择器
        yearDisplay.addEventListener('click', () => {
            selectedYear = AppState.currentYear;
            initYearPicker();
            yearPicker.classList.remove('hidden');
        });
        
        // 打开月份选择器
        monthDisplay.addEventListener('click', () => {
            selectedMonth = AppState.currentMonth;
            initMonthPicker();
            monthPicker.classList.remove('hidden');
        });
        
        // 关闭年份选择器
        yearCancel.addEventListener('click', () => {
            yearPicker.classList.add('hidden');
        });
        
        // 关闭月份选择器
        monthCancel.addEventListener('click', () => {
            monthPicker.classList.add('hidden');
        });
        
        // 确认选择年份
        yearConfirm.addEventListener('click', async () => {
            yearPicker.classList.add('hidden');
            if (selectedYear !== AppState.currentYear) {
                AppState.currentYear = selectedYear;
                document.getElementById('yearFilter').value = selectedYear;
                yearDisplay.textContent = selectedYear + '年度';
                await this.refresh();
            }
        });
        
        // 确认选择月份
        monthConfirm.addEventListener('click', async () => {
            monthPicker.classList.add('hidden');
            if (selectedMonth !== AppState.currentMonth) {
                AppState.currentMonth = selectedMonth;
                document.getElementById('monthFilter').value = selectedMonth;
                monthDisplay.textContent = selectedMonth + '月';
                await this.refresh();
            }
        });
        
        // 点击遮罩层关闭选择器
        yearPicker.addEventListener('click', (e) => {
            if (e.target === yearPicker) {
                yearPicker.classList.add('hidden');
            }
        });
        
        monthPicker.addEventListener('click', (e) => {
            if (e.target === monthPicker) {
                monthPicker.classList.add('hidden');
            }
        });
        
        // 原来的select事件监听（保持兼容性）
        document.getElementById('yearFilter').addEventListener('change', async (e) => {
            AppState.currentYear = e.target.value;
            yearDisplay.textContent = e.target.value + '年度';
            await this.refresh();
        });

        document.getElementById('monthFilter').addEventListener('change', async (e) => {
            AppState.currentMonth = parseInt(e.target.value);
            monthDisplay.textContent = e.target.value + '月';
            await this.refresh();
        });
        
        // 初始化显示
        yearDisplay.textContent = AppState.currentYear + '年度';
        monthDisplay.textContent = AppState.currentMonth + '月';
        
        // 图表页面选择器功能
        const chartYearDisplay = document.getElementById('chartYearDisplay');
        const chartYearPicker = document.getElementById('chartYearPicker');
        const chartYearList = document.getElementById('chartYearList');
        const chartYearCancel = document.getElementById('chartYearCancel');
        const chartYearConfirm = document.getElementById('chartYearConfirm');
        
        const chartMonthDisplay = document.getElementById('chartMonthDisplay');
        const chartMonthPicker = document.getElementById('chartMonthPicker');
        const chartMonthList = document.getElementById('chartMonthList');
        const chartMonthCancel = document.getElementById('chartMonthCancel');
        const chartMonthConfirm = document.getElementById('chartMonthConfirm');
        
        const chartStyleDisplay = document.getElementById('chartStyleDisplay');
        const chartStylePicker = document.getElementById('chartStylePicker');
        const chartStyleList = document.getElementById('chartStyleList');
        const chartStyleCancel = document.getElementById('chartStyleCancel');
        const chartStyleConfirm = document.getElementById('chartStyleConfirm');
        
        let selectedChartYear = new Date().getFullYear().toString();
        let selectedChartMonth = '';
        let selectedChartStyle = 'bar';
        
        // 初始化图表年份选择器
        const initChartYearPicker = () => {
            chartYearList.innerHTML = '';
            // 添加"全部年份"选项
            const allItem = document.createElement('div');
            allItem.className = `py-3 px-8 rounded-full ${selectedChartYear === '' ? 'bg-primary text-white' : 'text-gray-700'}`;
            allItem.textContent = '全部年份';
            allItem.dataset.year = '';
            allItem.addEventListener('click', () => {
                document.querySelectorAll('#chartYearList > div').forEach(item => {
                    item.classList.remove('bg-primary', 'text-white');
                    item.classList.add('text-gray-700');
                });
                allItem.classList.remove('text-gray-700');
                allItem.classList.add('bg-primary', 'text-white');
                selectedChartYear = '';
            });
            chartYearList.appendChild(allItem);
            
            // 添加年份选项
            const currentYear = new Date().getFullYear();
            for (let y = 2000; y <= 2200; y++) {
                const yearItem = document.createElement('div');
                yearItem.className = `py-3 px-8 rounded-full ${y == selectedChartYear ? 'bg-primary text-white' : 'text-gray-700'}`;
                yearItem.textContent = y + '年';
                yearItem.dataset.year = y;
                yearItem.addEventListener('click', () => {
                    document.querySelectorAll('#chartYearList > div').forEach(item => {
                        item.classList.remove('bg-primary', 'text-white');
                        item.classList.add('text-gray-700');
                    });
                    yearItem.classList.remove('text-gray-700');
                    yearItem.classList.add('bg-primary', 'text-white');
                    selectedChartYear = y.toString();
                });
                chartYearList.appendChild(yearItem);
            }
            
            // 定位到当前选中的年份
            setTimeout(() => {
                const selectedItem = chartYearList.querySelector('.bg-primary');
                if (selectedItem) {
                    selectedItem.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
            }, 100);
        };
        
        // 初始化图表月份选择器
        const initChartMonthPicker = () => {
            chartMonthList.innerHTML = '';
            // 添加"全部月份"选项
            const allItem = document.createElement('div');
            allItem.className = `py-3 px-8 rounded-full ${selectedChartMonth === '' ? 'bg-primary text-white' : 'text-gray-700'}`;
            allItem.textContent = '全部月份';
            allItem.dataset.month = '';
            allItem.addEventListener('click', () => {
                document.querySelectorAll('#chartMonthList > div').forEach(item => {
                    item.classList.remove('bg-primary', 'text-white');
                    item.classList.add('text-gray-700');
                });
                allItem.classList.remove('text-gray-700');
                allItem.classList.add('bg-primary', 'text-white');
                selectedChartMonth = '';
            });
            chartMonthList.appendChild(allItem);
            
            // 添加"全年"选项
            const yearItem = document.createElement('div');
            yearItem.className = `py-3 px-8 rounded-full ${selectedChartMonth === 'year' ? 'bg-primary text-white' : 'text-gray-700'}`;
            yearItem.textContent = '全年';
            yearItem.dataset.month = 'year';
            yearItem.addEventListener('click', () => {
                document.querySelectorAll('#chartMonthList > div').forEach(item => {
                    item.classList.remove('bg-primary', 'text-white');
                    item.classList.add('text-gray-700');
                });
                yearItem.classList.remove('text-gray-700');
                yearItem.classList.add('bg-primary', 'text-white');
                selectedChartMonth = 'year';
            });
            chartMonthList.appendChild(yearItem);
            
            // 添加月份选项
            for (let m = 1; m <= 12; m++) {
                const monthItem = document.createElement('div');
                monthItem.className = `py-3 px-8 rounded-full ${m == selectedChartMonth ? 'bg-primary text-white' : 'text-gray-700'}`;
                monthItem.textContent = m + '月';
                monthItem.dataset.month = m;
                monthItem.addEventListener('click', () => {
                    document.querySelectorAll('#chartMonthList > div').forEach(item => {
                        item.classList.remove('bg-primary', 'text-white');
                        item.classList.add('text-gray-700');
                    });
                    monthItem.classList.remove('text-gray-700');
                    monthItem.classList.add('bg-primary', 'text-white');
                    selectedChartMonth = m.toString();
                });
                chartMonthList.appendChild(monthItem);
            }
            
            // 定位到当前选中的月份
            setTimeout(() => {
                const selectedItem = chartMonthList.querySelector('.bg-primary');
                if (selectedItem) {
                    selectedItem.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
            }, 100);
        };
        
        // 初始化图表类型选择器
        const initChartStylePicker = () => {
            chartStyleList.innerHTML = '';
            const styles = [
                { value: 'bar', label: '柱状图' },
                { value: 'line', label: '折线图' },
                { value: 'curve', label: '曲线图' }
            ];
            styles.forEach(style => {
                const styleItem = document.createElement('div');
                styleItem.className = `py-3 px-8 rounded-full ${style.value == selectedChartStyle ? 'bg-primary text-white' : 'text-gray-700'}`;
                styleItem.textContent = style.label;
                styleItem.dataset.style = style.value;
                styleItem.addEventListener('click', () => {
                    document.querySelectorAll('#chartStyleList > div').forEach(item => {
                        item.classList.remove('bg-primary', 'text-white');
                        item.classList.add('text-gray-700');
                    });
                    styleItem.classList.remove('text-gray-700');
                    styleItem.classList.add('bg-primary', 'text-white');
                    selectedChartStyle = style.value;
                });
                chartStyleList.appendChild(styleItem);
            });
            
            // 定位到当前选中的图表类型
            setTimeout(() => {
                const selectedItem = chartStyleList.querySelector('.bg-primary');
                if (selectedItem) {
                    selectedItem.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
            }, 100);
        };
        
        // 打开图表年份选择器
        chartYearDisplay.addEventListener('click', () => {
            selectedChartYear = document.getElementById('chartYearFilter').value;
            initChartYearPicker();
            chartYearPicker.classList.remove('hidden');
        });
        
        // 打开图表月份选择器
        chartMonthDisplay.addEventListener('click', () => {
            selectedChartMonth = document.getElementById('chartMonthFilter').value;
            initChartMonthPicker();
            chartMonthPicker.classList.remove('hidden');
        });
        
        // 打开图表类型选择器
        chartStyleDisplay.addEventListener('click', () => {
            selectedChartStyle = document.getElementById('chartStyle').value;
            initChartStylePicker();
            chartStylePicker.classList.remove('hidden');
        });
        
        // 关闭图表年份选择器
        chartYearCancel.addEventListener('click', () => {
            chartYearPicker.classList.add('hidden');
        });
        
        // 关闭图表月份选择器
        chartMonthCancel.addEventListener('click', () => {
            chartMonthPicker.classList.add('hidden');
        });
        
        // 关闭图表类型选择器
        chartStyleCancel.addEventListener('click', () => {
            chartStylePicker.classList.add('hidden');
        });
        
        // 确认选择图表年份
        chartYearConfirm.addEventListener('click', () => {
            chartYearPicker.classList.add('hidden');
            if (selectedChartYear !== document.getElementById('chartYearFilter').value) {
                document.getElementById('chartYearFilter').value = selectedChartYear;
                chartYearDisplay.textContent = selectedChartYear ? selectedChartYear + '年' : '全部年份';
                if (typeof ChartManager !== 'undefined' && ChartManager.drawChart) {
                    ChartManager.drawChart();
                }
            }
        });
        
        // 确认选择图表月份
        chartMonthConfirm.addEventListener('click', () => {
            chartMonthPicker.classList.add('hidden');
            if (selectedChartMonth !== document.getElementById('chartMonthFilter').value) {
                document.getElementById('chartMonthFilter').value = selectedChartMonth;
                if (selectedChartMonth === '') {
                    chartMonthDisplay.textContent = '全部月份';
                } else if (selectedChartMonth === 'year') {
                    chartMonthDisplay.textContent = '全年';
                } else {
                    chartMonthDisplay.textContent = selectedChartMonth + '月';
                }
                if (typeof ChartManager !== 'undefined' && ChartManager.drawChart) {
                    ChartManager.drawChart();
                }
            }
        });
        
        // 确认选择图表类型
        chartStyleConfirm.addEventListener('click', () => {
            chartStylePicker.classList.add('hidden');
            if (selectedChartStyle !== document.getElementById('chartStyle').value) {
                document.getElementById('chartStyle').value = selectedChartStyle;
                const styleLabels = {
                    'bar': '柱状图',
                    'line': '折线图',
                    'curve': '曲线图'
                };
                chartStyleDisplay.textContent = styleLabels[selectedChartStyle] || '柱状图';
                if (typeof ChartManager !== 'undefined' && ChartManager.drawChart) {
                    ChartManager.drawChart();
                }
            }
        });
        
        // 点击遮罩层关闭选择器
        chartYearPicker.addEventListener('click', (e) => {
            if (e.target === chartYearPicker) {
                chartYearPicker.classList.add('hidden');
            }
        });
        
        chartMonthPicker.addEventListener('click', (e) => {
            if (e.target === chartMonthPicker) {
                chartMonthPicker.classList.add('hidden');
            }
        });
        
        chartStylePicker.addEventListener('click', (e) => {
            if (e.target === chartStylePicker) {
                chartStylePicker.classList.add('hidden');
            }
        });
        
        // 原来的select事件监听（保持兼容性）
        document.getElementById('chartYearFilter').addEventListener('change', () => {
            const value = document.getElementById('chartYearFilter').value;
            chartYearDisplay.textContent = value ? value + '年' : '全部年份';
        });

        document.getElementById('chartMonthFilter').addEventListener('change', () => {
            const value = document.getElementById('chartMonthFilter').value;
            if (value === '') {
                chartMonthDisplay.textContent = '全部月份';
            } else if (value === 'year') {
                chartMonthDisplay.textContent = '全年';
            } else {
                chartMonthDisplay.textContent = value + '月';
            }
        });

        document.getElementById('chartStyle').addEventListener('change', () => {
            const value = document.getElementById('chartStyle').value;
            const styleLabels = {
                'bar': '柱状图',
                'line': '折线图',
                'curve': '曲线图'
            };
            chartStyleDisplay.textContent = styleLabels[value] || '柱状图';
        });
        
        // 初始化显示
        const value = document.getElementById('chartYearFilter').value;
        chartYearDisplay.textContent = value ? value + '年' : '全部年份';
        const chartMonthValue = document.getElementById('chartMonthFilter').value;
        if (chartMonthValue === '') {
            chartMonthDisplay.textContent = '全部月份';
        } else if (chartMonthValue === 'year') {
            chartMonthDisplay.textContent = '全年';
        } else {
            chartMonthDisplay.textContent = chartMonthValue + '月';
        }
        const chartStyleValue = document.getElementById('chartStyle').value;
        const styleLabels = {
            'bar': '柱状图',
            'line': '折线图',
            'curve': '曲线图'
        };
        chartStyleDisplay.textContent = styleLabels[chartStyleValue] || '柱状图';
        
        // 记录页面选择器功能
        const recordYearDisplay = document.getElementById('recordYearDisplay');
        const recordYearPicker = document.getElementById('recordYearPicker');
        const recordYearList = document.getElementById('recordYearList');
        const recordYearCancel = document.getElementById('recordYearCancel');
        const recordYearConfirm = document.getElementById('recordYearConfirm');
        
        const recordMonthDisplay = document.getElementById('recordMonthDisplay');
        const recordMonthPicker = document.getElementById('recordMonthPicker');
        const recordMonthList = document.getElementById('recordMonthList');
        const recordMonthCancel = document.getElementById('recordMonthCancel');
        const recordMonthConfirm = document.getElementById('recordMonthConfirm');
        
        let selectedRecordYear = 'all';
        let selectedRecordMonth = 'all';
        
        // 初始化记录年份选择器
        const initRecordYearPicker = () => {
            recordYearList.innerHTML = '';
            const currentYear = new Date().getFullYear();
            
            // 添加"全部年份"选项
            const allItem = document.createElement('div');
            allItem.className = `py-3 px-8 rounded-full ${selectedRecordYear === 'all' ? 'bg-primary text-white' : 'text-gray-700'}`;
            allItem.textContent = '全部年份';
            allItem.dataset.year = 'all';
            allItem.addEventListener('click', () => {
                document.querySelectorAll('#recordYearList > div').forEach(item => {
                    item.classList.remove('bg-primary', 'text-white');
                    item.classList.add('text-gray-700');
                });
                allItem.classList.remove('text-gray-700');
                allItem.classList.add('bg-primary', 'text-white');
                selectedRecordYear = 'all';
            });
            recordYearList.appendChild(allItem);
            
            // 添加年份选项
            for (let y = 2000; y <= 2200; y++) {
                const yearItem = document.createElement('div');
                yearItem.className = `py-3 px-8 rounded-full ${y == selectedRecordYear ? 'bg-primary text-white' : 'text-gray-700'}`;
                yearItem.textContent = y + '年';
                yearItem.dataset.year = y;
                yearItem.addEventListener('click', () => {
                    document.querySelectorAll('#recordYearList > div').forEach(item => {
                        item.classList.remove('bg-primary', 'text-white');
                        item.classList.add('text-gray-700');
                    });
                    yearItem.classList.remove('text-gray-700');
                    yearItem.classList.add('bg-primary', 'text-white');
                    selectedRecordYear = y.toString();
                });
                recordYearList.appendChild(yearItem);
            }
            
            // 定位到当前选中的年份
            setTimeout(() => {
                const selectedItem = recordYearList.querySelector('.bg-primary');
                if (selectedItem) {
                    selectedItem.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
            }, 100);
        };
        
        // 初始化记录月份选择器
        const initRecordMonthPicker = () => {
            recordMonthList.innerHTML = '';
            
            // 添加"全部月份"选项
            const allItem = document.createElement('div');
            allItem.className = `py-3 px-8 rounded-full ${selectedRecordMonth === 'all' ? 'bg-primary text-white' : 'text-gray-700'}`;
            allItem.textContent = '全部月份';
            allItem.dataset.month = 'all';
            allItem.addEventListener('click', () => {
                document.querySelectorAll('#recordMonthList > div').forEach(item => {
                    item.classList.remove('bg-primary', 'text-white');
                    item.classList.add('text-gray-700');
                });
                allItem.classList.remove('text-gray-700');
                allItem.classList.add('bg-primary', 'text-white');
                selectedRecordMonth = 'all';
            });
            recordMonthList.appendChild(allItem);
            
            // 添加月份选项
            for (let m = 1; m <= 12; m++) {
                const monthItem = document.createElement('div');
                monthItem.className = `py-3 px-8 rounded-full ${m == selectedRecordMonth ? 'bg-primary text-white' : 'text-gray-700'}`;
                monthItem.textContent = m + '月';
                monthItem.dataset.month = m;
                monthItem.addEventListener('click', () => {
                    document.querySelectorAll('#recordMonthList > div').forEach(item => {
                        item.classList.remove('bg-primary', 'text-white');
                        item.classList.add('text-gray-700');
                    });
                    monthItem.classList.remove('text-gray-700');
                    monthItem.classList.add('bg-primary', 'text-white');
                    selectedRecordMonth = m.toString();
                });
                recordMonthList.appendChild(monthItem);
            }
            
            // 定位到当前选中的月份
            setTimeout(() => {
                const selectedItem = recordMonthList.querySelector('.bg-primary');
                if (selectedItem) {
                    selectedItem.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
            }, 100);
        };
        
        // 打开记录年份选择器
        recordYearDisplay.addEventListener('click', () => {
            selectedRecordYear = document.getElementById('recordYearFilter').value;
            initRecordYearPicker();
            recordYearPicker.classList.remove('hidden');
        });
        
        // 打开记录月份选择器
        recordMonthDisplay.addEventListener('click', () => {
            selectedRecordMonth = document.getElementById('recordMonthFilter').value;
            initRecordMonthPicker();
            recordMonthPicker.classList.remove('hidden');
        });
        
        // 关闭记录年份选择器
        recordYearCancel.addEventListener('click', () => {
            recordYearPicker.classList.add('hidden');
        });
        
        // 关闭记录月份选择器
        recordMonthCancel.addEventListener('click', () => {
            recordMonthPicker.classList.add('hidden');
        });
        
        // 确认选择记录年份
        recordYearConfirm.addEventListener('click', () => {
            recordYearPicker.classList.add('hidden');
            if (selectedRecordYear !== document.getElementById('recordYearFilter').value) {
                document.getElementById('recordYearFilter').value = selectedRecordYear;
                recordYearDisplay.textContent = selectedRecordYear === 'all' ? '全部年份' : selectedRecordYear + '年';
                // 触发筛选事件
                const event = new Event('change');
                document.getElementById('recordYearFilter').dispatchEvent(event);
            }
        });
        
        // 确认选择记录月份
        recordMonthConfirm.addEventListener('click', () => {
            recordMonthPicker.classList.add('hidden');
            if (selectedRecordMonth !== document.getElementById('recordMonthFilter').value) {
                document.getElementById('recordMonthFilter').value = selectedRecordMonth;
                recordMonthDisplay.textContent = selectedRecordMonth === 'all' ? '全部月份' : selectedRecordMonth + '月';
                // 触发筛选事件
                const event = new Event('change');
                document.getElementById('recordMonthFilter').dispatchEvent(event);
            }
        });
        
        // 点击遮罩层关闭选择器
        recordYearPicker.addEventListener('click', (e) => {
            if (e.target === recordYearPicker) {
                recordYearPicker.classList.add('hidden');
            }
        });
        
        recordMonthPicker.addEventListener('click', (e) => {
            if (e.target === recordMonthPicker) {
                recordMonthPicker.classList.add('hidden');
            }
        });
        
        // 原来的select事件监听（保持兼容性）
        document.getElementById('recordYearFilter').addEventListener('change', () => {
            const value = document.getElementById('recordYearFilter').value;
            recordYearDisplay.textContent = value === 'all' ? '全部年份' : value + '年';
        });

        document.getElementById('recordMonthFilter').addEventListener('change', () => {
            const value = document.getElementById('recordMonthFilter').value;
            recordMonthDisplay.textContent = value === 'all' ? '全部月份' : value + '月';
        });
        
        // 初始化记录选择器显示
        const recordYearValue = document.getElementById('recordYearFilter').value;
        recordYearDisplay.textContent = recordYearValue === 'all' ? '全部年份' : recordYearValue + '年';
        const recordMonthValue = document.getElementById('recordMonthFilter').value;
        recordMonthDisplay.textContent = recordMonthValue === 'all' ? '全部月份' : recordMonthValue + '月';
        
        // 确保记录年份选择器默认值为"全部年份"
        if (document.getElementById('recordYearFilter').value !== 'all') {
            document.getElementById('recordYearFilter').value = 'all';
            recordYearDisplay.textContent = '全部年份';
            // 触发筛选事件
            const event = new Event('change');
            document.getElementById('recordYearFilter').dispatchEvent(event);
        }

        document.getElementById('recordYearFilter').addEventListener('change', () => {
            UIManager.updateMonthOptions();
            UIManager.renderList();
        });

        document.getElementById('recordMonthFilter').addEventListener('change', () => {
            UIManager.renderList();
        });

        document.querySelectorAll('[data-f]').forEach(btn => {
            btn.addEventListener('click', e => {
                document.querySelectorAll('[data-f]').forEach(b => b.classList.remove('btn-active'));
                e.target.classList.add('btn-active');
                UIManager.renderList();
            });
        });

        document.querySelectorAll('[data-filter]').forEach(btn => {
            btn.addEventListener('click', e => {
                document.querySelectorAll('[data-filter]').forEach(b => b.classList.remove('btn-active'));
                e.target.classList.add('btn-active');
                ChartManager.drawChart();
            });
        });

        document.getElementById('chartStyle').addEventListener('change', () => ChartManager.drawChart());
        document.getElementById('chartYearFilter').addEventListener('change', () => ChartManager.drawChart());
        document.getElementById('chartMonthFilter').addEventListener('change', () => ChartManager.drawChart());

        document.getElementById('addBtn').addEventListener('click', () => {
            document.getElementById('editForm').reset();
            document.getElementById('dataId').value = '';
            // 清空所有输入框
            ['water', 'electricity', 'gas', 'property', 'parking'].forEach(type => {
                document.getElementById(type + 'Amount').value = '';
            });
            // 隐藏所有用量显示
            document.getElementById('waterUsage').classList.add('hidden');
            document.getElementById('elecUsage').classList.add('hidden');
            document.getElementById('gasUsage').classList.add('hidden');
            // 更新弹窗标题
            document.querySelector('#editModal h3').textContent = '添加缴费记录';
            const editModal = document.getElementById('editModal');
            editModal.style.display = 'flex';
            editModal.classList.add('fade-in');
            const modalContent = editModal.querySelector('.ios-modal');
            if (modalContent) {
                modalContent.classList.add('scale-in');
            }
        });

        document.getElementById('closeModal').addEventListener('click', () => {
            const editModal = document.getElementById('editModal');
            // 添加模态框隐藏动画
            const modalContent = editModal.querySelector('.ios-modal');
            if (modalContent) {
                modalContent.classList.remove('scale-in');
                modalContent.classList.add('scale-out');
            }
            setTimeout(() => {
                editModal.style.display = 'none';
                editModal.classList.remove('fade-in');
                if (modalContent) {
                    modalContent.classList.remove('scale-out');
                }
            }, 200);
        });

        document.getElementById('waterAmount').addEventListener('input', () => {
            const amt = parseFloat(document.getElementById('waterAmount').value) || 0;
            const val = Utils.calculateUsage(amt, Config.PRICE.water);
            const usageEl = document.querySelector('#waterUsage span');
            if (usageEl) usageEl.textContent = val + ' m³';
            document.getElementById('waterUsage').classList.toggle('hidden', amt === 0);
        });

        document.getElementById('electricityAmount').addEventListener('input', () => {
            const amt = parseFloat(document.getElementById('electricityAmount').value) || 0;
            const val = Utils.calculateUsage(amt, Config.PRICE.electricity);
            const usageEl = document.querySelector('#elecUsage span');
            if (usageEl) usageEl.textContent = val + ' kWh';
            document.getElementById('elecUsage').classList.toggle('hidden', amt === 0);
        });

        document.getElementById('gasAmount').addEventListener('input', () => {
            const amt = parseFloat(document.getElementById('gasAmount').value) || 0;
            const val = Utils.calculateUsage(amt, Config.PRICE.gas);
            const usageEl = document.querySelector('#gasUsage span');
            if (usageEl) usageEl.textContent = val + ' m³';
            document.getElementById('gasUsage').classList.toggle('hidden', amt === 0);
        });

        // 绑定设置页面按钮事件
        document.getElementById('exportExcelBtn').addEventListener('click', () => {
            ExportManager.exportExcel();
        });

        document.getElementById('backupDataBtn').addEventListener('click', () => {
            ExportManager.backupData();
        });

        document.getElementById('restoreDataBtn').addEventListener('click', () => {
            ExportManager.restoreData();
        });

        document.getElementById('editForm').addEventListener('submit', async e => {
            e.preventDefault();
            const date = document.getElementById('billDate').value;
            if (!date) {
                alert('请选择年月');
                return;
            }

            const bills = [];
            const types = ['water', 'electricity', 'gas', 'property', 'parking'];
            
            types.forEach(type => {
                const amountInput = document.getElementById(type + 'Amount');
                const amount = parseFloat(amountInput.value) || 0;
                
                const bill = {
                    date: date,
                    type: type,
                    amount: amount
                };
                
                if (type === 'water') bill.usage = Utils.calculateUsage(amount, Config.PRICE.water);
                if (type === 'electricity') bill.usage = Utils.calculateUsage(amount, Config.PRICE.electricity);
                if (type === 'gas') bill.usage = Utils.calculateUsage(amount, Config.PRICE.gas);
                
                bills.push(bill);
            });

            try {
                const editModal = document.getElementById('editModal');
                const modalContent = editModal.querySelector('.ios-modal');
                if (modalContent) {
                    modalContent.classList.remove('scale-in');
                    modalContent.classList.add('scale-out');
                }
                setTimeout(async () => {
                    // 先删除该月份的所有旧记录
                    await DataManager.deleteByMonth(date);
                    
                    // 保存所有新记录（包括0值）
                    for (const bill of bills) {
                        await DataManager.save(bill);
                    }
                    
                    editModal.style.display = 'none';
                    editModal.classList.remove('fade-in');
                    if (modalContent) {
                        modalContent.classList.remove('scale-out');
                    }
                    await this.refresh();
                }, 200);
            } catch (error) {
                console.error('Error saving bills:', error);
            }
        });

        document.getElementById('exportExcelBtn').addEventListener('click', () => ExportManager.exportExcel());

        document.getElementById('backupDataBtn').addEventListener('click', async () => {
            try {
                const bills = await DataManager.getBills();
                const backupData = {
                    version: '1.0',
                    timestamp: new Date().toISOString(),
                    data: bills
                };
                
                const jsonString = JSON.stringify(backupData, null, 2);
                const blob = new Blob([jsonString], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                
                const a = document.createElement('a');
                a.href = url;
                a.download = `生活管家备份_${new Date().toISOString().slice(0, 10)}.json`;
                // 确保元素可见
                a.style.display = 'block';
                a.style.position = 'fixed';
                a.style.top = '-100px';
                a.style.left = '-100px';
                document.body.appendChild(a);
                // 强制触发点击
                if (a.click) {
                    a.click();
                } else {
                    // 兼容旧浏览器
                    const event = document.createEvent('MouseEvents');
                    event.initEvent('click', true, true);
                    a.dispatchEvent(event);
                }
                // 延迟移除元素
                setTimeout(() => {
                    document.body.removeChild(a);
                    URL.revokeObjectURL(url);
                }, 100);
                
                alert('数据备份成功！文件已下载到本地默认下载目录。');
            } catch (error) {
                console.error('Error backing up data:', error);
                alert('备份数据失败，请重试。');
            }
        });

        document.getElementById('restoreDataBtn').addEventListener('click', () => {
            // 创建文件输入元素
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = '.json';
            input.style.display = 'none';
            document.body.appendChild(input);
            
            input.onchange = async (e) => {
                const file = e.target.files[0];
                if (!file) {
                    document.body.removeChild(input);
                    return;
                }
                
                try {
                    const reader = new FileReader();
                    reader.onload = async (event) => {
                        try {
                            const backupData = JSON.parse(event.target.result);
                            if (!backupData.data || !Array.isArray(backupData.data)) {
                                throw new Error('无效的备份文件格式');
                            }
                            
                            if (confirm('确定要恢复数据吗？这将覆盖当前所有数据。')) {
                                // 清空当前数据
                                await DataManager.clearAll();
                                // 导入备份数据
                                for (const bill of backupData.data) {
                                    await DataManager.save(bill);
                                }
                                await App.refresh();
                                alert('数据恢复成功！');
                            }
                        } catch (error) {
                            console.error('Error parsing backup file:', error);
                            alert('恢复数据失败，备份文件格式无效。');
                        } finally {
                            // 移除文件输入元素
                            if (input && input.parentNode) {
                                input.parentNode.removeChild(input);
                            }
                        }
                    };
                    reader.readAsText(file);
                } catch (error) {
                    console.error('Error restoring data:', error);
                    alert('恢复数据失败，请重试。');
                    // 移除文件输入元素
                    if (input && input.parentNode) {
                        input.parentNode.removeChild(input);
                    }
                }
            };
            
            // 触发文件选择
            try {
                input.click();
            } catch (e) {
                console.error('Error triggering file input:', e);
                alert('无法打开文件选择器，请重试。');
                // 移除文件输入元素
                if (input && input.parentNode) {
                    input.parentNode.removeChild(input);
                }
            }
        });

        document.getElementById('clearData').addEventListener('click', async () => {
            if (confirm('确定清空所有数据？此操作不可恢复！')) {
                try {
                    await DataManager.clearAll();
                    await this.refresh();
                } catch (error) {
                    console.error('Error clearing data:', error);
                }
            }
        });

        // 年月选择器
        let yearMonthSelectedYear = new Date().getFullYear();
        let yearMonthSelectedMonth = new Date().getMonth();
        let yearMonthPickerMode = ''; // 'add' or 'edit'

        // 初始化年月选择器
        const initYearMonthPicker = () => {
            const yearMonthPicker = document.getElementById('yearMonth-picker');
            const yearMonthPickerBtn = document.getElementById('yearMonthPickerBtn');
            const yearMonthCancel = document.getElementById('yearMonth-cancel');
            const yearMonthConfirm = document.getElementById('yearMonth-confirm');
            const yearMonthClear = document.getElementById('yearMonth-clear');
            const yearMonthCurrent = document.getElementById('yearMonth-current');
            const prevYearBtn = document.getElementById('prev-year');
            const nextYearBtn = document.getElementById('next-year');
            const yearGrid = document.getElementById('year-grid');
            const monthGrid = document.getElementById('month-grid');
            const currentYearMonth = document.getElementById('current-year-month');

            // 打开年月选择器
            yearMonthPickerBtn.addEventListener('click', () => {
                // 检查当前是添加还是编辑模式
                const dataId = document.getElementById('dataId').value;
                yearMonthPickerMode = dataId ? 'edit' : 'add';
                
                // 更新标题
                document.getElementById('yearMonth-title').textContent = yearMonthPickerMode === 'add' ? '添加缴费记录' : '编辑缴费记录';
                
                // 加载当前值
                const currentValue = document.getElementById('billDate').value;
                if (currentValue) {
                    const [year, month] = currentValue.split('-');
                    yearMonthSelectedYear = parseInt(year);
                    yearMonthSelectedMonth = parseInt(month) - 1;
                } else {
                    yearMonthSelectedYear = new Date().getFullYear();
                    yearMonthSelectedMonth = new Date().getMonth();
                }
                
                updateYearMonthDisplay();
                renderYearGrid();
                renderMonthGrid();
                yearMonthPicker.classList.remove('hidden');
                yearMonthPicker.style.display = 'flex';
            });

            // 关闭年月选择器
            yearMonthCancel.addEventListener('click', () => {
                yearMonthPicker.style.display = 'none';
            });

            // 确认选择
            yearMonthConfirm.addEventListener('click', () => {
                const formattedMonth = String(yearMonthSelectedMonth + 1).padStart(2, '0');
                document.getElementById('billDate').value = `${yearMonthSelectedYear}-${formattedMonth}`;
                yearMonthPicker.style.display = 'none';
            });

            // 清除选择
            yearMonthClear.addEventListener('click', () => {
                document.getElementById('billDate').value = '';
                yearMonthPicker.style.display = 'none';
            });

            // 选择本月
            yearMonthCurrent.addEventListener('click', () => {
                yearMonthSelectedYear = new Date().getFullYear();
                yearMonthSelectedMonth = new Date().getMonth();
                updateYearMonthDisplay();
                renderYearGrid();
                renderMonthGrid();
            });

            // 上一年
            prevYearBtn.addEventListener('click', () => {
                yearMonthSelectedYear -= 1;
                renderYearGrid();
            });

            // 下一年
            nextYearBtn.addEventListener('click', () => {
                yearMonthSelectedYear += 1;
                renderYearGrid();
            });

            // 更新年月显示
            function updateYearMonthDisplay() {
                currentYearMonth.textContent = `${yearMonthSelectedYear}年${yearMonthSelectedMonth + 1}月`;
            }

            // 渲染年份网格
            function renderYearGrid() {
                yearGrid.innerHTML = '';
                for (let i = -1; i <= 1; i++) {
                    const year = yearMonthSelectedYear + i;
                    const yearElement = document.createElement('div');
                    yearElement.className = `py-3 text-center rounded-lg ${year === yearMonthSelectedYear ? 'bg-primary text-white' : 'bg-gray-100 text-gray-700'}`;
                    yearElement.textContent = year;
                    yearElement.addEventListener('click', () => {
                        yearMonthSelectedYear = year;
                        renderYearGrid();
                    });
                    yearGrid.appendChild(yearElement);
                }
            }

            // 渲染月份网格
            function renderMonthGrid() {
                monthGrid.innerHTML = '';
                const months = ['一月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '十一月', '十二月'];
                months.forEach((month, index) => {
                    const monthElement = document.createElement('div');
                    monthElement.className = `py-2 text-center rounded-lg ${index === yearMonthSelectedMonth ? 'bg-primary text-white' : 'bg-gray-100 text-gray-700'}`;
                    monthElement.textContent = month;
                    monthElement.addEventListener('click', () => {
                        yearMonthSelectedMonth = index;
                        updateYearMonthDisplay();
                        renderMonthGrid();
                    });
                    monthGrid.appendChild(monthElement);
                });
            }

            // 点击外部关闭
            yearMonthPicker.addEventListener('click', (e) => {
                if (e.target === yearMonthPicker) {
                    yearMonthPicker.style.display = 'none';
                }
            });
        };

        // 初始化年月选择器
        initYearMonthPicker();

        // 模块开关页面
        document.getElementById('moduleToggleBtn').addEventListener('click', () => {
            // 隐藏所有页面
            document.querySelectorAll('.page').forEach(p => p.classList.remove('active', 'fade-in', 'slide-up'));
            // 显示模块开关页面
            const modulePage = document.getElementById('moduleTogglePage');
            if (modulePage) {
                modulePage.classList.add('active', 'fade-in', 'slide-up');
            }
            // 更新页面标题
            const pageTitle = document.getElementById('pageTitle');
            if (pageTitle) {
                pageTitle.textContent = '首页模块显示开关';
                pageTitle.classList.remove('fade-in');
                void pageTitle.offsetWidth;
                pageTitle.classList.add('fade-in');
            }
            // 隐藏年月选择器
            const selectorContainer = document.querySelector('.flex.gap-2.mt-1');
            if (selectorContainer) {
                selectorContainer.style.display = 'none';
            }
        });

        document.getElementById('backToSettings').addEventListener('click', () => {
            // 隐藏所有页面
            document.querySelectorAll('.page').forEach(p => p.classList.remove('active', 'fade-in', 'slide-up'));
            // 显示设置页面
            const settingsPage = document.getElementById('settingsPage');
            if (settingsPage) {
                settingsPage.classList.add('active', 'fade-in', 'slide-up');
            }
            // 更新页面标题
            const pageTitle = document.getElementById('pageTitle');
            if (pageTitle) {
                pageTitle.textContent = '设置';
                pageTitle.classList.remove('fade-in');
                void pageTitle.offsetWidth;
                pageTitle.classList.add('fade-in');
            }
            // 隐藏年月选择器
            const selectorContainer = document.querySelector('.flex.gap-2.mt-1');
            if (selectorContainer) {
                selectorContainer.style.display = 'none';
            }
        });

        // 模块开关事件
        const toggleElements = {
            water: document.getElementById('toggleWater'),
            electricity: document.getElementById('toggleElectricity'),
            gas: document.getElementById('toggleGas'),
            property: document.getElementById('toggleProperty'),
            parking: document.getElementById('toggleParking')
        };

        // 加载保存的设置
        const loadModuleSettings = () => {
            try {
                const saved = localStorage.getItem('moduleVisibility');
                if (saved) {
                    AppState.moduleVisibility = JSON.parse(saved);
                    // 更新UI
                    for (const [key, element] of Object.entries(toggleElements)) {
                        if (element) {
                            element.checked = AppState.moduleVisibility[key];
                        }
                    }
                } else {
                    // 默认全部开启
                    for (const element of Object.values(toggleElements)) {
                        if (element) {
                            element.checked = true;
                        }
                    }
                }
            } catch (error) {
                console.error('Error loading module settings:', error);
            }
        };

        // 保存设置
        const saveModuleSettings = () => {
            try {
                localStorage.setItem('moduleVisibility', JSON.stringify(AppState.moduleVisibility));
            } catch (error) {
                console.error('Error saving module settings:', error);
            }
        };

        // 绑定开关事件
        for (const [key, element] of Object.entries(toggleElements)) {
            if (element) {
                element.addEventListener('change', (e) => {
                    AppState.moduleVisibility[key] = e.target.checked;
                    saveModuleSettings();
                    
                    // 检查当前是否在仪表板页面，如果是则刷新
                    const dashboardPage = document.getElementById('dashboardPage');
                    if (dashboardPage && dashboardPage.classList.contains('active')) {
                        // 直接调用updateDashboard来刷新仪表板
                        if (typeof UIManager !== 'undefined' && UIManager.updateDashboard) {
                            UIManager.updateDashboard();
                        }
                    }
                });
            }
        }

        // 初始化时加载设置
        loadModuleSettings();
    },

    async editMonth(yearMonth) {
        try {
            const bills = await DataManager.getBills();
            const monthBills = bills.filter(i => i.date === yearMonth);
            
            // 清空所有输入框
            ['water', 'electricity', 'gas', 'property', 'parking'].forEach(type => {
                document.getElementById(type + 'Amount').value = '';
            });
            document.getElementById('waterUsage').classList.add('hidden');
            document.getElementById('elecUsage').classList.add('hidden');
            document.getElementById('gasUsage').classList.add('hidden');
            
            // 加载该月份的费用记录
            monthBills.forEach(bill => {
                const amountInput = document.getElementById(bill.type + 'Amount');
                if (amountInput) {
                    amountInput.value = parseFloat(bill.amount).toFixed(2);
                    
                    // 显示用量
                    if (bill.type === 'water' && bill.usage) {
                        document.querySelector('#waterUsage span').textContent = bill.usage + ' m³';
                        document.getElementById('waterUsage').classList.remove('hidden');
                    }
                    if (bill.type === 'electricity' && bill.usage) {
                        document.querySelector('#elecUsage span').textContent = bill.usage + ' kWh';
                        document.getElementById('elecUsage').classList.remove('hidden');
                    }
                    if (bill.type === 'gas' && bill.usage) {
                        document.querySelector('#gasUsage span').textContent = bill.usage + ' m³';
                        document.getElementById('gasUsage').classList.remove('hidden');
                    }
                }
            });
            
            // 设置日期
            document.getElementById('billDate').value = yearMonth;
            document.getElementById('dataId').value = '';
            
            // 更新弹窗标题
            document.querySelector('#editModal h3').textContent = '编辑缴费记录';
            const editModal = document.getElementById('editModal');
            editModal.style.display = 'flex';
            editModal.classList.add('fade-in');
            const modalContent = editModal.querySelector('.ios-modal');
            if (modalContent) {
                modalContent.classList.add('scale-in');
            }
        } catch (error) {
            console.error('Error editing month bills:', error);
        }
    },

    async delItem(id) {
        if (confirm('确定删除这条记录？')) {
            try {
                // 找到要删除的元素并添加删除动画
                const itemToDelete = document.querySelector(`[data-id="${id}"]`);
                if (itemToDelete) {
                    itemToDelete.classList.add('scale-out');
                    // 等待动画完成后再删除
                    setTimeout(async () => {
                        await DataManager.delete(id);
                        await this.refresh();
                    }, 200);
                } else {
                    // 如果找不到元素，直接删除
                    await DataManager.delete(id);
                    await this.refresh();
                }
            } catch (error) {
                console.error('Error deleting bill:', error);
            }
        }
    },

    toggleMonth(key) {
        UIManager.toggleMonth(key);
    },

    toggleYear(year) {
        UIManager.toggleYear(year);
    },

    async refresh() {
        try {
            await UIManager.updateDashboard();
            await UIManager.renderList();
        } catch (error) {
            console.error('Error refreshing app:', error);
        }
    }
};

// 缴费周期设置功能
let currentSettingType = '';

// 初始化缴费周期设置
function initPaymentCycleSettings() {
    // 读取保存的设置
    const propertySettings = localStorage.getItem('propertyCycle');
    const parkingSettings = localStorage.getItem('parkingCycle');
    
    // 更新显示
    if (propertySettings) {
        const settings = JSON.parse(propertySettings);
        const days = calculateDays(settings.startDate, settings.endDate);
        const propertyDaysElement = document.getElementById('property-days');
        propertyDaysElement.textContent = `${days} 天`;
        propertyDaysElement.className = 'text-property text-sm mr-2';
    }
    
    if (parkingSettings) {
        const settings = JSON.parse(parkingSettings);
        const days = calculateDays(settings.startDate, settings.endDate);
        const parkingDaysElement = document.getElementById('parking-days');
        parkingDaysElement.textContent = `${days} 天`;
        parkingDaysElement.className = 'text-parking text-sm mr-2';
    }
    
    // 绑定点击事件
    document.getElementById('property-item').addEventListener('click', () => {
        openDateModal('property');
    });
    
    document.getElementById('parking-item').addEventListener('click', () => {
        openDateModal('parking');
    });
    
    // 绑定弹窗按钮事件
    document.getElementById('date-modal-cancel').addEventListener('click', closeDateModal);
    document.getElementById('date-modal-confirm').addEventListener('click', confirmDateSetting);
    
    // 初始化剩余天数显示
    updateRemainingDays();
    
    // 设置定时器，每小时更新一次剩余天数
    setInterval(updateRemainingDays, 3600000); // 1小时
    
    // 设置定时器，每天检查一次是否到期
    setInterval(checkExpiration, 86400000); // 24小时
}

// 打开日期选择弹窗
function openDateModal(type) {
    currentSettingType = type;
    
    // 更新弹窗标题
    const title = type === 'property' ? '物业费周期设置' : '停车费周期设置';
    document.getElementById('modal-title').textContent = title;
    
    // 读取现有设置并填充日期
    const settings = localStorage.getItem(`${type}Cycle`);
    if (settings) {
        const data = JSON.parse(settings);
        document.getElementById('start-date-display').value = data.startDate;
        document.getElementById('end-date-display').value = data.endDate;
    } else {
        // 清空日期
        document.getElementById('start-date-display').value = '';
        document.getElementById('end-date-display').value = '';
    }
    
    // 显示弹窗
    document.getElementById('date-modal').classList.remove('hidden');
    document.getElementById('date-modal').classList.add('flex');
}

// 关闭日期选择弹窗
function closeDateModal() {
    document.getElementById('date-modal').classList.add('hidden');
    document.getElementById('date-modal').classList.remove('flex');
}

// 确认日期设置
function confirmDateSetting() {
    const startDate = document.getElementById('start-date').value;
    const endDate = document.getElementById('end-date').value;
    
    // 如果日期被清除，重置周期设置
    if (!startDate || !endDate) {
        // 重置周期
        resetCycle(currentSettingType);
        // 关闭弹窗
        closeDateModal();
        return;
    }
    
    if (new Date(endDate) < new Date(startDate)) {
        alert('结束日期不能早于开始日期');
        return;
    }
    
    // 计算天数
    const days = calculateDays(startDate, endDate);
    
    // 保存设置
    const settings = {
        startDate: startDate,
        endDate: endDate,
        days: days
    };
    
    localStorage.setItem(`${currentSettingType}Cycle`, JSON.stringify(settings));
    
    // 更新显示
    const daysElement = document.getElementById(`${currentSettingType}-days`);
    daysElement.textContent = `${days} 天`;
    daysElement.className = `text-${currentSettingType} text-sm mr-2`;
    
    // 更新剩余天数
    updateRemainingDays();
    
    // 关闭弹窗
    closeDateModal();
}

// 计算两个日期之间的天数
function calculateDays(startDate, endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return diffDays;
}

// 计算剩余天数
function calculateRemainingDays(endDate) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const end = new Date(endDate);
    end.setHours(0, 0, 0, 0);
    const diffTime = end - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
}

// 更新剩余天数显示
function updateRemainingDays() {
    // 更新物业费剩余天数
    const propertySettings = localStorage.getItem('propertyCycle');
    if (propertySettings) {
        const settings = JSON.parse(propertySettings);
        const remainingDays = calculateRemainingDays(settings.endDate);
        const remainingElement = document.getElementById('property-remaining');
        
        if (remainingDays > 0) {
            // 根据剩余天数设置不同颜色
            if (remainingDays <= 1) {
                remainingElement.className = 'text-xs text-red-500';
            } else if (remainingDays <= 7) {
                remainingElement.className = 'text-xs text-yellow-500';
            } else {
                remainingElement.className = 'text-xs text-green-500';
            }
            remainingElement.textContent = `剩余：${remainingDays} 天`;
        } else {
            // 到期后重置
            remainingElement.className = 'text-xs text-gray-500';
            remainingElement.textContent = '已到期';
            // 重置周期
            resetCycle('property');
        }
    }
    
    // 更新停车费剩余天数
    const parkingSettings = localStorage.getItem('parkingCycle');
    if (parkingSettings) {
        const settings = JSON.parse(parkingSettings);
        const remainingDays = calculateRemainingDays(settings.endDate);
        const remainingElement = document.getElementById('parking-remaining');
        
        if (remainingDays > 0) {
            // 根据剩余天数设置不同颜色
            if (remainingDays <= 1) {
                remainingElement.className = 'text-xs text-red-500';
            } else if (remainingDays <= 7) {
                remainingElement.className = 'text-xs text-yellow-500';
            } else {
                remainingElement.className = 'text-xs text-green-500';
            }
            remainingElement.textContent = `剩余：${remainingDays} 天`;
        } else {
            // 到期后重置
            remainingElement.className = 'text-xs text-gray-500';
            remainingElement.textContent = '已到期';
            // 重置周期
            resetCycle('parking');
        }
    }
}

// 检查是否到期并提醒
function checkExpiration() {
    // 检查物业费
    const propertySettings = localStorage.getItem('propertyCycle');
    if (propertySettings) {
        const settings = JSON.parse(propertySettings);
        const remainingDays = calculateRemainingDays(settings.endDate);
        if (remainingDays === 1) {
            alert('物业费即将到期，剩余1天');
        }
    }
    
    // 检查停车费
    const parkingSettings = localStorage.getItem('parkingCycle');
    if (parkingSettings) {
        const settings = JSON.parse(parkingSettings);
        const remainingDays = calculateRemainingDays(settings.endDate);
        if (remainingDays === 1) {
            alert('停车费即将到期，剩余1天');
        }
    }
}

// 重置周期
function resetCycle(type) {
    // 清除本地存储
    localStorage.removeItem(`${type}Cycle`);
    
    // 更新显示
    const daysElement = document.getElementById(`${type}-days`);
    const remainingElement = document.getElementById(`${type}-remaining`);
    
    daysElement.textContent = '未设置';
    daysElement.className = `text-${type} text-sm mr-2`;
    remainingElement.textContent = '剩余天数：-';
    remainingElement.className = 'text-xs text-gray-500';
}

// iOS风格日历选择器功能
let currentDatePickerTarget = ''; // 'start' 或 'end'
let selectedDate = null;
let currentYear = new Date().getFullYear();
let currentMonth = new Date().getMonth();

// 初始化日历选择器
function initCalendarPicker() {
    // 绑定日期选择按钮事件
    document.getElementById('start-date-picker-btn').addEventListener('click', () => {
        openCalendarPicker('start');
    });
    
    document.getElementById('end-date-picker-btn').addEventListener('click', () => {
        openCalendarPicker('end');
    });
    
    // 绑定日历导航事件
    document.getElementById('prev-month').addEventListener('click', () => {
        currentMonth--;
        if (currentMonth < 0) {
            currentMonth = 11;
            currentYear--;
        }
        renderCalendar();
    });
    
    document.getElementById('next-month').addEventListener('click', () => {
        currentMonth++;
        if (currentMonth > 11) {
            currentMonth = 0;
            currentYear++;
        }
        renderCalendar();
    });
    
    // 绑定日历确认和取消事件
    document.getElementById('calendar-confirm').addEventListener('click', confirmCalendarSelection);
    document.getElementById('calendar-cancel').addEventListener('click', closeCalendarPicker);
    
    // 绑定今天和清除按钮事件
    document.getElementById('calendar-today').addEventListener('click', selectToday);
    document.getElementById('calendar-clear').addEventListener('click', clearDateSelection);
    
    // 初始化日历
    renderCalendar();
}

// 打开日历选择器
function openCalendarPicker(target) {
    currentDatePickerTarget = target;
    
    // 读取当前选择的日期
    const displayId = target === 'start' ? 'start-date-display' : 'end-date-display';
    const displayValue = document.getElementById(displayId).value;
    
    if (displayValue) {
        const date = new Date(displayValue);
        currentYear = date.getFullYear();
        currentMonth = date.getMonth();
        selectedDate = date;
    } else {
        const today = new Date();
        currentYear = today.getFullYear();
        currentMonth = today.getMonth();
        selectedDate = today;
    }
    
    // 渲染日历
    renderCalendar();
    
    // 显示日历弹窗
    document.getElementById('calendar-picker').classList.remove('hidden');
    document.getElementById('calendar-picker').classList.add('flex');
}

// 关闭日历选择器
function closeCalendarPicker() {
    document.getElementById('calendar-picker').classList.add('hidden');
    document.getElementById('calendar-picker').classList.remove('flex');
}

// 确认日历选择
function confirmCalendarSelection() {
    if (selectedDate) {
        const formattedDate = selectedDate.toISOString().split('T')[0];
        const displayId = currentDatePickerTarget === 'start' ? 'start-date-display' : 'end-date-display';
        document.getElementById(displayId).value = formattedDate;
    }
    closeCalendarPicker();
}

// 选择今天
function selectToday() {
    selectedDate = new Date();
    selectedDate.setHours(0, 0, 0, 0);
    
    // 检查是否在限制范围内
    let otherDate = null;
    if (currentDatePickerTarget === 'start') {
        const endDateValue = document.getElementById('end-date-display').value;
        if (endDateValue) {
            otherDate = new Date(endDateValue);
            otherDate.setHours(0, 0, 0, 0);
            if (selectedDate > otherDate) {
                selectedDate = new Date(otherDate);
            }
        }
    } else if (currentDatePickerTarget === 'end') {
        const startDateValue = document.getElementById('start-date-display').value;
        if (startDateValue) {
            otherDate = new Date(startDateValue);
            otherDate.setHours(0, 0, 0, 0);
            if (selectedDate < otherDate) {
                selectedDate = new Date(otherDate);
            }
        }
    }
    
    currentYear = selectedDate.getFullYear();
    currentMonth = selectedDate.getMonth();
    renderCalendar();
}

// 清除日期选择
function clearDateSelection() {
    selectedDate = null;
    const displayId = currentDatePickerTarget === 'start' ? 'start-date-display' : 'end-date-display';
    document.getElementById(displayId).value = '';
    closeCalendarPicker();
}

// 渲染日历
function renderCalendar() {
    const calendarGrid = document.getElementById('calendar-grid');
    const currentMonthElement = document.getElementById('current-month');
    
    // 设置当前月份标题
    const monthNames = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];
    currentMonthElement.textContent = `${currentYear}年${monthNames[currentMonth]}`;
    
    // 清空日历网格
    calendarGrid.innerHTML = '';
    
    // 获取另一个日期输入框的值
    let otherDate = null;
    if (currentDatePickerTarget === 'start') {
        const endDateValue = document.getElementById('end-date-display').value;
        if (endDateValue) {
            otherDate = new Date(endDateValue);
            otherDate.setHours(0, 0, 0, 0);
        }
    } else if (currentDatePickerTarget === 'end') {
        const startDateValue = document.getElementById('start-date-display').value;
        if (startDateValue) {
            otherDate = new Date(startDateValue);
            otherDate.setHours(0, 0, 0, 0);
        }
    }
    
    // 获取当月第一天
    const firstDay = new Date(currentYear, currentMonth, 1);
    // 获取当月最后一天
    const lastDay = new Date(currentYear, currentMonth + 1, 0);
    // 获取当月第一天是星期几
    const startDay = firstDay.getDay();
    // 获取当月的天数
    const daysInMonth = lastDay.getDate();
    
    // 添加上个月的日期
    const prevMonthLastDay = new Date(currentYear, currentMonth, 0).getDate();
    for (let i = 0; i < startDay; i++) {
        const dayElement = document.createElement('div');
        const currentDate = new Date(currentYear, currentMonth - 1, prevMonthLastDay - startDay + i + 1);
        currentDate.setHours(0, 0, 0, 0);
        
        // 检查是否在限制范围内
        let isDisabled = false;
        if (otherDate) {
            if (currentDatePickerTarget === 'start' && currentDate > otherDate) {
                isDisabled = true;
            } else if (currentDatePickerTarget === 'end' && currentDate < otherDate) {
                isDisabled = true;
            }
        }
        
        let classes = 'h-10 flex items-center justify-center text-xs';
        if (isDisabled) {
            classes += ' text-gray-300';
        } else {
            classes += ' text-gray-400';
        }
        
        dayElement.className = classes;
        dayElement.textContent = prevMonthLastDay - startDay + i + 1;
        
        // 只有未禁用的日期才能点击
        if (!isDisabled) {
            dayElement.classList.add('cursor-pointer');
            dayElement.addEventListener('click', () => {
                selectedDate = currentDate;
                renderCalendar();
            });
        }
        
        calendarGrid.appendChild(dayElement);
    }
    
    // 添加当月的日期
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    for (let i = 1; i <= daysInMonth; i++) {
        const dayElement = document.createElement('div');
        const currentDate = new Date(currentYear, currentMonth, i);
        currentDate.setHours(0, 0, 0, 0);
        
        // 检查是否在限制范围内
        let isDisabled = false;
        if (otherDate) {
            if (currentDatePickerTarget === 'start' && currentDate > otherDate) {
                isDisabled = true;
            } else if (currentDatePickerTarget === 'end' && currentDate < otherDate) {
                isDisabled = true;
            }
        }
        
        // 设置样式
        let classes = 'h-10 flex items-center justify-center text-sm';
        
        if (isDisabled) {
            classes += ' text-gray-300';
        } else {
            classes += ' cursor-pointer';
            
            // 今天
            if (currentDate.getTime() === today.getTime()) {
                classes += ' bg-blue-100 text-blue-500 rounded-full';
            }
            
            // 选中的日期
            if (selectedDate && currentDate.getTime() === selectedDate.getTime()) {
                classes += ' bg-blue-500 text-white rounded-full';
            }
        }
        
        dayElement.className = classes;
        dayElement.textContent = i;
        
        // 只有未禁用的日期才能点击
        if (!isDisabled) {
            dayElement.addEventListener('click', () => {
                selectedDate = new Date(currentYear, currentMonth, i);
                renderCalendar();
            });
        }
        
        calendarGrid.appendChild(dayElement);
    }
    
    // 添加下个月的日期
    const remainingDays = 42 - (startDay + daysInMonth); // 6行7列
    for (let i = 1; i <= remainingDays; i++) {
        const dayElement = document.createElement('div');
        const currentDate = new Date(currentYear, currentMonth + 1, i);
        currentDate.setHours(0, 0, 0, 0);
        
        // 检查是否在限制范围内
        let isDisabled = false;
        if (otherDate) {
            if (currentDatePickerTarget === 'start' && currentDate > otherDate) {
                isDisabled = true;
            } else if (currentDatePickerTarget === 'end' && currentDate < otherDate) {
                isDisabled = true;
            }
        }
        
        let classes = 'h-10 flex items-center justify-center text-xs';
        if (isDisabled) {
            classes += ' text-gray-300';
        } else {
            classes += ' text-gray-400 cursor-pointer';
        }
        
        dayElement.className = classes;
        dayElement.textContent = i;
        
        // 只有未禁用的日期才能点击
        if (!isDisabled) {
            dayElement.addEventListener('click', () => {
                selectedDate = currentDate;
                renderCalendar();
            });
        }
        
        calendarGrid.appendChild(dayElement);
    }
}

// 修改confirmDateSetting函数，使用显示值
function confirmDateSetting() {
    const startDate = document.getElementById('start-date-display').value;
    const endDate = document.getElementById('end-date-display').value;
    
    // 如果日期被清除，重置周期设置
    if (!startDate || !endDate) {
        // 重置周期
        resetCycle(currentSettingType);
        // 关闭弹窗
        closeDateModal();
        return;
    }
    
    if (new Date(endDate) < new Date(startDate)) {
        alert('结束日期不能早于开始日期');
        return;
    }
    
    // 计算天数
    const days = calculateDays(startDate, endDate);
    
    // 保存设置
    const settings = {
        startDate: startDate,
        endDate: endDate,
        days: days
    };
    
    localStorage.setItem(`${currentSettingType}Cycle`, JSON.stringify(settings));
    
    // 更新显示
    const daysElement = document.getElementById(`${currentSettingType}-days`);
    daysElement.textContent = `${days} 天`;
    daysElement.className = `text-${currentSettingType} text-sm mr-2`;
    
    // 更新剩余天数
    updateRemainingDays();
    
    // 关闭弹窗
    closeDateModal();
}

// 页面加载完成后初始化缴费周期设置和日历选择器
document.addEventListener('DOMContentLoaded', () => {
    initPaymentCycleSettings();
    initCalendarPicker();
});

window.go = function(page) {
    UIManager.go(page);
};

window.App = App;

window.addEventListener('DOMContentLoaded', () => App.init());