const ExportManager = {
    async exportExcel() {
        try {
            const bills = await DataManager.getBills();
            if (bills.length === 0) {
                alert('暂无数据可导出');
                return;
            }

            // 按年月排序
            bills.sort((a, b) => {
                const dateA = a.date;
                const dateB = b.date;
                return dateA.localeCompare(dateB);
            });

            // 按年月分组
            const groupedData = {};
            const yearlyData = {};
            bills.forEach(bill => {
                const yearMonth = bill.date.slice(0, 7); // YYYY-MM
                const year = bill.date.slice(0, 4); // YYYY
                
                if (!groupedData[yearMonth]) {
                    groupedData[yearMonth] = [];
                }
                groupedData[yearMonth].push(bill);
                
                if (!yearlyData[year]) {
                    yearlyData[year] = [];
                }
                yearlyData[year].push(bill);
            });

            // 读取缴费周期设置
            const propertyCycle = JSON.parse(localStorage.getItem('propertyCycle') || 'null');
            const parkingCycle = JSON.parse(localStorage.getItem('parkingCycle') || 'null');

            // 计算剩余天数
            function calculateRemainingDays(startDate, endDate) {
                if (!startDate || !endDate) return 0;
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                const end = new Date(endDate);
                end.setHours(0, 0, 0, 0);
                const diffTime = end - today;
                return Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
            }

            // 创建工作簿
            const wb = XLSX.utils.book_new();

            // 工作表1：缴费周期设置
            const cycleData = [
                ['缴费周期设置', '', '', ''],
                ['费用类型', '周期天数', '剩余天数', '时间范围']
            ];

            if (propertyCycle) {
                const remainingDays = calculateRemainingDays(propertyCycle.startDate, propertyCycle.endDate);
                cycleData.push([
                    '物业费',
                    propertyCycle.days,
                    remainingDays,
                    `${propertyCycle.startDate} 至 ${propertyCycle.endDate}`
                ]);
            } else {
                cycleData.push(['物业费', '未设置', '-', '-']);
            }

            if (parkingCycle) {
                const remainingDays = calculateRemainingDays(parkingCycle.startDate, parkingCycle.endDate);
                cycleData.push([
                    '停车费',
                    parkingCycle.days,
                    remainingDays,
                    `${parkingCycle.startDate} 至 ${parkingCycle.endDate}`
                ]);
            } else {
                cycleData.push(['停车费', '未设置', '-', '-']);
            }

            const wsCycle = XLSX.utils.aoa_to_sheet(cycleData);
            XLSX.utils.book_append_sheet(wb, wsCycle, '缴费周期');

            // 工作表2：月度缴费记录
            const monthlyData = [['日期', '年份', '月份', '费用类型', '金额(元)', '用量']];
            
            Object.keys(groupedData).sort().forEach(yearMonth => {
                const billsInMonth = groupedData[yearMonth];
                
                // 计算当月总金额
                const monthTotal = billsInMonth.reduce((sum, bill) => sum + parseFloat(bill.amount), 0);
                
                // 添加月份分隔行
                monthlyData.push([
                    `${yearMonth.slice(0, 4)}年${yearMonth.slice(5)}月`,
                    '',
                    '',
                    '',
                    `当月总计: ${monthTotal.toFixed(2)}元`,
                    ''
                ]);
                
                // 添加当月数据
                billsInMonth.forEach(bill => {
                    monthlyData.push([
                        bill.date,
                        bill.date.slice(0, 4),
                        bill.date.slice(5, 7),
                        Config.TYPE_MAP[bill.type] || bill.type,
                        parseFloat(bill.amount),
                        bill.usage || '-'
                    ]);
                });
                
                // 添加空行作为分隔
                monthlyData.push(['', '', '', '', '', '']);
            });

            const wsMonthly = XLSX.utils.aoa_to_sheet(monthlyData);
            XLSX.utils.book_append_sheet(wb, wsMonthly, '月度记录');

            // 工作表3：年度统计
            const yearlyDataExport = [['年份', '总金额(元)', '记录数量']];
            
            Object.keys(yearlyData).sort().forEach(year => {
                const billsInYear = yearlyData[year];
                const yearTotal = billsInYear.reduce((sum, bill) => sum + parseFloat(bill.amount), 0);
                
                yearlyDataExport.push([
                    `${year}年`,
                    yearTotal.toFixed(2),
                    billsInYear.length
                ]);
            });

            const wsYearly = XLSX.utils.aoa_to_sheet(yearlyDataExport);
            XLSX.utils.book_append_sheet(wb, wsYearly, '年度统计');

            // 生成带日期时间的文件名
            const now = new Date();
            const timestamp = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}_${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}${String(now.getSeconds()).padStart(2, '0')}`;
            const fileName = `生活缴费记录_${timestamp}.xlsx`;
            
            XLSX.writeFile(wb, fileName);
        } catch (error) {
            console.error('Error exporting Excel:', error);
            alert('导出失败，请稍后重试');
        }
    },

    async backupData() {
        try {
            const bills = await DataManager.getBills();
            if (bills.length === 0) {
                alert('暂无数据可备份');
                return;
            }

            // 读取缴费周期设置
            const propertyCycle = JSON.parse(localStorage.getItem('propertyCycle') || 'null');
            const parkingCycle = JSON.parse(localStorage.getItem('parkingCycle') || 'null');

            // 读取模块开关状态
            const moduleVisibility = JSON.parse(localStorage.getItem('moduleVisibility') || JSON.stringify({
                water: true,
                electricity: true,
                gas: true,
                property: true,
                parking: true
            }));

            // 读取单价设置
            const priceSettings = JSON.parse(localStorage.getItem('priceSettings') || JSON.stringify(Config.PRICE));

            // 准备备份数据
            const backupData = {
                version: '1.0.0',
                timestamp: new Date().toISOString(),
                data: {
                    bills: bills,
                    propertyCycle: propertyCycle,
                    parkingCycle: parkingCycle,
                    moduleVisibility: moduleVisibility,
                    priceSettings: priceSettings
                }
            };

            // 生成带日期时间的文件名
            const now = new Date();
            const timestamp = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}_${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}${String(now.getSeconds()).padStart(2, '0')}`;
            const fileName = `生活缴费备份_${timestamp}.json`;

            // 创建Blob对象
            const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });

            // 检查是否在HBuilderX环境中
            if (typeof plus !== 'undefined' && plus.io) {
                // HBuilderX环境
                this.saveFileInApp(blob, fileName);
            } else {
                // H5浏览器环境
                this.downloadFile(blob, fileName);
            }
        } catch (error) {
            console.error('Error backing up data:', error);
            alert('备份失败，请稍后重试');
        }
    },

    downloadFile(blob, fileName) {
        // H5浏览器环境下载
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        setTimeout(() => {
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }, 100);
    },

    saveFileInApp(blob, fileName) {
        // HBuilderX环境保存文件
        plus.io.requestFileSystem(plus.io.PRIVATE_DOC, fs => {
            fs.root.getDirectory('backups', { create: true }, dir => {
                dir.getFile(fileName, { create: true }, fileEntry => {
                    fileEntry.createWriter(writer => {
                        writer.onwriteend = () => {
                            alert('备份成功，文件已保存到应用目录');
                        };
                        writer.onerror = () => {
                            alert('备份失败，请稍后重试');
                        };
                        writer.write(blob);
                    });
                });
            });
        });
    },

    restoreData() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        input.onchange = async (e) => {
            const file = e.target.files[0];
            if (!file) return;

            try {
                const reader = new FileReader();
                reader.onload = async (event) => {
                    try {
                        let backupData;
                        try {
                            backupData = JSON.parse(event.target.result);
                        } catch (parseErr) {
                            console.error('JSON解析失败:', parseErr);
                            alert('备份文件解析失败，请确保选择正确的JSON备份文件');
                            return;
                        }

                        console.log('解析到的备份数据:', backupData);

                        // 兼容多种备份格式
                        const data = backupData.data || backupData;
                        const bills = data.bills || data.records || data;

                        // 验证备份数据格式（放宽条件）
                        if (!Array.isArray(bills) || bills.length === 0) {
                            alert('备份文件中没有找到有效的缴费记录数据');
                            return;
                        }

                        if (!confirm('确定要恢复数据吗？这将覆盖当前所有数据')) {
                            return;
                        }

                        await DataManager.clearAll();

                        for (const bill of bills) {
                            if (bill && (bill.date || bill.amount !== undefined)) {
                                await DataManager.save(bill);
                            }
                        }

                        if (data.propertyCycle) {
                            localStorage.setItem('propertyCycle', JSON.stringify(data.propertyCycle));
                        }
                        if (data.parkingCycle) {
                            localStorage.setItem('parkingCycle', JSON.stringify(data.parkingCycle));
                        }
                        if (data.moduleVisibility) {
                            localStorage.setItem('moduleVisibility', JSON.stringify(data.moduleVisibility));
                        }
                        if (data.priceSettings) {
                            localStorage.setItem('priceSettings', JSON.stringify(data.priceSettings));
                        }

                        alert('数据恢复成功，页面将刷新');
                        setTimeout(() => { location.reload(); }, 1000);
                    } catch (error) {
                        console.error('Error processing backup data:', error);
                        alert('数据处理失败: ' + (error.message || '未知错误'));
                    }
                };
                reader.onerror = () => { alert('文件读取失败'); };
                reader.readAsText(file);
            } catch (error) {
                console.error('Error restoring data:', error);
                alert('恢复失败: ' + (error.message || '未知错误'));
            }
        };
        input.click();
    }
};