// ==========================================
// Chart.js Configurations for Admin Analytics
// ==========================================

// Global Chart settings
if (typeof Chart !== 'undefined') {
    Chart.defaults.color = '#B0B0B0';
    Chart.defaults.font.family = "'Poppins', sans-serif";
    Chart.defaults.plugins.tooltip.backgroundColor = 'rgba(5, 5, 5, 0.9)';
    Chart.defaults.plugins.tooltip.titleColor = '#00E5FF';
    Chart.defaults.plugins.tooltip.padding = 10;
    Chart.defaults.plugins.tooltip.borderColor = 'rgba(0, 229, 255, 0.2)';
    Chart.defaults.plugins.tooltip.borderWidth = 1;
}

const colors = {
    primary: 'rgba(0, 229, 255, 1)',
    primaryBg: 'rgba(0, 229, 255, 0.1)',
    secondary: 'rgba(0, 255, 255, 1)',
    accent: 'rgba(0, 157, 255, 1)',
    success: 'rgba(0, 255, 127, 1)',
    successBg: 'rgba(0, 255, 127, 0.1)',
    danger: 'rgba(255, 23, 68, 1)',
    dangerBg: 'rgba(255, 23, 68, 0.1)',
    warning: 'rgba(255, 193, 7, 1)',
    grid: 'rgba(255, 255, 255, 0.05)'
};

// Common options for line/bar charts
const commonOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
        legend: {
            display: false
        }
    },
    scales: {
        x: {
            grid: { color: colors.grid, drawBorder: false }
        },
        y: {
            grid: { color: colors.grid, drawBorder: false },
            beginAtZero: true
        }
    }
};

// Load charts based on current page
document.addEventListener('DOMContentLoaded', async () => {
    const path = window.location.pathname;
    
    // Only load Chart.js logic on dashboard or analytics pages
    if (!path.includes('dashboard') && !path.includes('analytics')) return;
    
    try {
        const res = await apiRequest('/analytics');
        if (res.success) {
            const data = res.data;
            
            if (path.includes('dashboard')) {
                initDashboardCharts(data);
            } else if (path.includes('analytics')) {
                initAnalyticsCharts(data);
            }
        }
    } catch (error) {
        console.error('Failed to load chart data', error);
    }
});

const initDashboardCharts = (data) => {
    // 1. Visitors Line Chart (Last 30 Days)
    const visitorsCtx = document.getElementById('visitorsChart');
    if (visitorsCtx) {
        new Chart(visitorsCtx, {
            type: 'line',
            data: {
                labels: data.dailyVisitors.map(d => d._id.substring(5)), // MM-DD
                datasets: [{
                    label: 'Visitors',
                    data: data.dailyVisitors.map(d => d.count),
                    borderColor: colors.primary,
                    backgroundColor: colors.primaryBg,
                    borderWidth: 2,
                    tension: 0.4,
                    fill: true,
                    pointBackgroundColor: colors.bgDark,
                    pointBorderColor: colors.primary,
                    pointRadius: 3,
                    pointHoverRadius: 6
                }]
            },
            options: commonOptions
        });
    }

    // 2. Pass vs Short Doughnut Chart
    const passShortCtx = document.getElementById('passShortChart');
    if (passShortCtx) {
        let passCount = 0, shortCount = 0;
        data.passShort.forEach(item => {
            if (item._id === 'PASS') passCount = item.count;
            if (item._id === 'SHORT') shortCount = item.count;
        });
        
        new Chart(passShortCtx, {
            type: 'doughnut',
            data: {
                labels: ['Passed', 'Short'],
                datasets: [{
                    data: [passCount, shortCount],
                    backgroundColor: [colors.success, colors.danger],
                    borderWidth: 0,
                    hoverOffset: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                cutout: '75%',
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: { color: colors.textSecondary, usePointStyle: true, padding: 20 }
                    }
                }
            }
        });
    }
};

const initAnalyticsCharts = (data) => {
    // If we're on the full analytics page, we render more detailed charts
    // (Similar logic to dashboard but for all 8 canvas elements)
    
    // Monthly Visitors (Bar)
    const monthlyCtx = document.getElementById('monthlyVisitorsChart');
    if (monthlyCtx) {
        new Chart(monthlyCtx, {
            type: 'bar',
            data: {
                labels: data.monthlyVisitors.map(d => d._id),
                datasets: [{
                    label: 'Visitors',
                    data: data.monthlyVisitors.map(d => d.count),
                    backgroundColor: colors.accent,
                    borderRadius: 4
                }]
            },
            options: commonOptions
        });
    }
    
    // Device Usage (Pie)
    const deviceCtx = document.getElementById('deviceChart');
    if (deviceCtx) {
        new Chart(deviceCtx, {
            type: 'pie',
            data: {
                labels: data.deviceUsage.map(d => d._id),
                datasets: [{
                    data: data.deviceUsage.map(d => d.count),
                    backgroundColor: [colors.primary, colors.accent, colors.warning, colors.success],
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { position: 'right', labels: { color: '#B0B0B0', usePointStyle: true } }
                }
            }
        });
    }
    
    // Dept Usage (Bar)
    const deptCtx = document.getElementById('deptChart');
    if (deptCtx) {
        new Chart(deptCtx, {
            type: 'bar',
            data: {
                labels: data.byDepartment.map(d => d._id),
                datasets: [{
                    label: 'Students',
                    data: data.byDepartment.map(d => d.count),
                    backgroundColor: colors.primary,
                    borderRadius: 4
                }]
            },
            options: {
                ...commonOptions,
                indexAxis: 'y',
            }
        });
    }
};
