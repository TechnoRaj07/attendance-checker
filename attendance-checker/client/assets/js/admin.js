// ==========================================
// Admin Panel Logic
// ==========================================

// Check Authentication
const checkAuth = () => {
    const token = localStorage.getItem('adminToken');
    const isLoginPage = window.location.pathname.includes('admin-login.html') || window.location.pathname === '/admin';
    
    if (!token && !isLoginPage) {
        window.location.href = '/admin';
    } else if (token && isLoginPage) {
        window.location.href = '/admin/dashboard';
    }
    
    return token;
};

// Initialize Admin UI
const initAdmin = () => {
    if (!checkAuth() && !window.location.pathname.includes('admin-login.html')) return;
    
    const token = localStorage.getItem('adminToken');
    if (token) {
        // Set user profile data
        const adminDataStr = localStorage.getItem('adminData');
        if (adminDataStr) {
            try {
                const adminData = JSON.parse(adminDataStr);
                const avatarEl = document.getElementById('adminAvatarTxt');
                const nameEl = document.getElementById('adminNameTxt');
                const roleEl = document.getElementById('adminRoleTxt');
                
                if (avatarEl) avatarEl.textContent = adminData.name.charAt(0).toUpperCase();
                if (nameEl) nameEl.textContent = adminData.name;
                if (roleEl) roleEl.textContent = adminData.role;
            } catch (e) {
                console.error('Error parsing admin data', e);
            }
        }
        
        // Handle Logout
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', async (e) => {
                e.preventDefault();
                try {
                    await apiRequest('/admin/logout', { method: 'POST' });
                } catch (err) {
                    console.log('Logout API failed, continuing local logout');
                } finally {
                    localStorage.removeItem('adminToken');
                    localStorage.removeItem('adminData');
                    window.location.href = '/admin';
                }
            });
        }
        
        // Set Active Sidebar Link
        const currentPath = window.location.pathname.split('/').pop() || 'dashboard';
        document.querySelectorAll('.sidebar-link').forEach(link => {
            if (link.getAttribute('href') === currentPath || link.getAttribute('href') === `/admin/${currentPath}`) {
                link.classList.add('active');
            } else {
                link.classList.remove('active');
            }
        });
    }
};

// Admin Login Form
const initLoginForm = () => {
    const form = document.getElementById('adminLoginForm');
    if (!form) return;
    
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const btn = document.getElementById('loginBtn');
        const originalText = btn.innerHTML;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i> Authenticating...';
        btn.disabled = true;
        
        try {
            const formData = new FormData(form);
            const payload = Object.fromEntries(formData.entries());
            
            const response = await fetch('/api/admin/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            
            const data = await response.json();
            
            if (data.success) {
                localStorage.setItem('adminToken', data.data.token);
                localStorage.setItem('adminData', JSON.stringify(data.data.admin));
                showToast('Login successful! Redirecting...', 'success');
                setTimeout(() => {
                    window.location.href = '/admin/dashboard';
                }, 1000);
            } else {
                showToast(data.error || 'Login failed', 'error');
                btn.innerHTML = originalText;
                btn.disabled = false;
            }
        } catch (error) {
            showToast('Server connection error', 'error');
            btn.innerHTML = originalText;
            btn.disabled = false;
        }
    });
};

// Format Date helper
const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
};

// ==========================================
// Dashboard Data Fetching
// ==========================================
const loadDashboardData = async () => {
    if (!document.getElementById('dashTotalChecks')) return;
    
    try {
        const res = await apiRequest('/admin/dashboard');
        if (res.success) {
            const d = res.data;
            
            // Update stats
            document.getElementById('dashTotalChecks').textContent = d.attendance.total.toLocaleString();
            document.getElementById('dashPassed').textContent = d.attendance.passed.toLocaleString();
            document.getElementById('dashShort').textContent = d.attendance.short.toLocaleString();
            
            document.getElementById('dashTodayVisits').textContent = d.visitors.today.toLocaleString();
            document.getElementById('dashTotalVisits').textContent = d.visitors.total.toLocaleString();
            
            document.getElementById('dashMessages').textContent = d.messages.total.toLocaleString();
            
            // Update system status
            document.getElementById('sysMemUsed').textContent = `${d.system.memory.used} MB`;
            document.getElementById('sysMemTotal').textContent = `${d.system.memory.total} MB`;
            document.getElementById('sysUptime').textContent = `${Math.floor(d.system.uptime / 3600)}h ${Math.floor((d.system.uptime % 3600) / 60)}m`;
            
            // Unread messages badge
            const msgBadge = document.getElementById('unreadMessagesBadge');
            if (msgBadge && d.messages.unread > 0) {
                msgBadge.textContent = d.messages.unread;
                msgBadge.style.display = 'inline-block';
            }
        }
    } catch (error) {
        showToast('Failed to load dashboard data', 'error');
    }
};

// ==========================================
// Records Management
// ==========================================
let currentPage = 1;
const LIMIT = 20;

const loadRecords = async (page = 1, search = '', filter = '') => {
    const tableBody = document.getElementById('recordsTableBody');
    if (!tableBody) return;
    
    tableBody.innerHTML = '<tr><td colspan="8" class="text-center py-4"><i class="fas fa-spinner fa-spin fa-2x text-primary"></i></td></tr>';
    
    try {
        let url = `/attendance?page=${page}&limit=${LIMIT}`;
        if (search) url += `&search=${encodeURIComponent(search)}`;
        if (filter) url += `&status=${filter}`;
        
        const res = await apiRequest(url);
        
        if (res.success) {
            tableBody.innerHTML = '';
            
            if (res.data.length === 0) {
                tableBody.innerHTML = '<tr><td colspan="8" class="text-center py-4 text-muted">No records found.</td></tr>';
            } else {
                res.data.forEach(record => {
                    const statusClass = record.overallAttendance.status === 'PASS' ? 'badge-pass' : 'badge-short';
                    const approvedHtml = record.isApproved 
                        ? `<span class="text-success"><i class="fas fa-check-circle"></i></span>`
                        : `<span class="text-warning"><i class="fas fa-clock"></i></span>`;
                        
                    const tr = document.createElement('tr');
                    tr.innerHTML = `
                        <td>
                            <div class="fw-bold text-primary">${record.student.name}</div>
                            <div class="text-muted small">${record.student.rollNumber}</div>
                        </td>
                        <td>${record.student.department} (Y${record.student.year})</td>
                        <td class="font-orbitron">${record.overallAttendance.totalClasses}</td>
                        <td class="font-orbitron">${record.overallAttendance.totalAttended}</td>
                        <td class="font-orbitron fw-bold text-cyan">${record.overallAttendance.percentage}%</td>
                        <td><span class="${statusClass}">${record.overallAttendance.status}</span></td>
                        <td>${formatDate(record.createdAt)}</td>
                        <td>
                            <div class="d-flex gap-2">
                                <a href="/api/export/attendance/pdf/${record._id}" target="_blank" class="btn btn-sm btn-outline-info p-1 px-2" title="Download PDF"><i class="fas fa-file-pdf"></i></a>
                                <button onclick="deleteRecord('${record._id}')" class="btn btn-sm btn-outline-danger p-1 px-2" title="Delete"><i class="fas fa-trash"></i></button>
                            </div>
                        </td>
                    `;
                    tableBody.appendChild(tr);
                });
            }
            
            // Pagination UI
            renderPagination(res.pagination, 'recordsPagination', (p) => loadRecords(p, search, filter));
            document.getElementById('recordsTotal').textContent = res.pagination.total;
        }
    } catch (error) {
        tableBody.innerHTML = '<tr><td colspan="8" class="text-center py-4 text-danger">Error loading records.</td></tr>';
        showToast(error.message, 'error');
    }
};

const deleteRecord = async (id) => {
    if (!confirm('Are you sure you want to delete this record? This cannot be undone.')) return;
    
    try {
        const res = await apiRequest(`/attendance/${id}`, { method: 'DELETE' });
        if (res.success) {
            showToast('Record deleted', 'success');
            loadRecords(currentPage, document.getElementById('searchInput')?.value);
        }
    } catch (error) {
        showToast(error.message, 'error');
    }
};

// ==========================================
// Visitors Management
// ==========================================
const loadVisitors = async (page = 1, search = '') => {
    const tableBody = document.getElementById('visitorsTableBody');
    if (!tableBody) return;
    
    tableBody.innerHTML = '<tr><td colspan="7" class="text-center py-4"><i class="fas fa-spinner fa-spin fa-2x text-primary"></i></td></tr>';
    
    try {
        const res = await apiRequest(`/visitors?page=${page}&limit=${LIMIT}&search=${encodeURIComponent(search)}`);
        
        if (res.success) {
            tableBody.innerHTML = '';
            
            if (res.data.length === 0) {
                tableBody.innerHTML = '<tr><td colspan="7" class="text-center py-4 text-muted">No visitors found.</td></tr>';
            } else {
                res.data.forEach(v => {
                    const browserIcon = getBrowserIcon(v.browser);
                    const deviceIcon = getDeviceIcon(v.device);
                    
                    const tr = document.createElement('tr');
                    tr.innerHTML = `
                        <td>
                            <div class="text-primary">${v.studentName || 'Anonymous'}</div>
                            <div class="text-muted small">${v.visitorId.substring(0,8)}...</div>
                        </td>
                        <td class="font-monospace small">${v.ipAddress}</td>
                        <td>${v.country ? `${v.city}, ${v.country}` : 'Unknown'}</td>
                        <td><i class="${browserIcon} text-muted me-1"></i> ${v.browser}</td>
                        <td><i class="${deviceIcon} text-muted me-1"></i> ${v.device}</td>
                        <td class="small">${formatDate(v.date)}</td>
                        <td>
                            <button onclick="deleteVisitor('${v._id}')" class="btn btn-sm btn-outline-danger p-1 px-2"><i class="fas fa-trash"></i></button>
                        </td>
                    `;
                    tableBody.appendChild(tr);
                });
            }
            
            renderPagination(res.pagination, 'visitorsPagination', (p) => loadVisitors(p, search));
            document.getElementById('visitorsTotal').textContent = res.pagination.total;
        }
    } catch (error) {
        tableBody.innerHTML = '<tr><td colspan="7" class="text-center py-4 text-danger">Error loading visitors.</td></tr>';
    }
};

const deleteVisitor = async (id) => {
    if (!confirm('Delete visitor record?')) return;
    try {
        const res = await apiRequest(`/visitors/${id}`, { method: 'DELETE' });
        if (res.success) {
            showToast('Visitor deleted', 'success');
            loadVisitors(currentPage);
        }
    } catch (error) {
        showToast(error.message, 'error');
    }
};

// Helper for icons
const getBrowserIcon = (browser) => {
    const b = browser.toLowerCase();
    if (b.includes('chrome')) return 'fab fa-chrome';
    if (b.includes('firefox')) return 'fab fa-firefox';
    if (b.includes('safari')) return 'fab fa-safari';
    if (b.includes('edge')) return 'fab fa-edge';
    if (b.includes('opera')) return 'fab fa-opera';
    return 'fas fa-globe';
};

const getDeviceIcon = (device) => {
    const d = device.toLowerCase();
    if (d.includes('mobile')) return 'fas fa-mobile-alt';
    if (d.includes('tablet')) return 'fas fa-tablet-alt';
    return 'fas fa-desktop';
};

// ==========================================
// Pagination Render Helper
// ==========================================
const renderPagination = (pagination, containerId, callback) => {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    const { page, pages } = pagination;
    currentPage = page;
    
    let html = '';
    
    // Prev
    html += `<button class="pagination-btn" ${page === 1 ? 'disabled' : ''} onclick="window.changePage(-1, '${containerId}')"><i class="fas fa-chevron-left"></i></button>`;
    
    // Page numbers (simplified)
    const start = Math.max(1, page - 2);
    const end = Math.min(pages, page + 2);
    
    if (start > 1) html += `<button class="pagination-btn" onclick="window.goToPage(1, '${containerId}')">1</button>${start > 2 ? '<span class="text-muted px-1">...</span>' : ''}`;
    
    for (let i = start; i <= end; i++) {
        html += `<button class="pagination-btn ${i === page ? 'active' : ''}" onclick="window.goToPage(${i}, '${containerId}')">${i}</button>`;
    }
    
    if (end < pages) html += `${end < pages - 1 ? '<span class="text-muted px-1">...</span>' : ''}<button class="pagination-btn" onclick="window.goToPage(${pages}, '${containerId}')">${pages}</button>`;
    
    // Next
    html += `<button class="pagination-btn" ${page === pages || pages === 0 ? 'disabled' : ''} onclick="window.changePage(1, '${containerId}')"><i class="fas fa-chevron-right"></i></button>`;
    
    container.innerHTML = html;
    
    // Attach callbacks to window for onclick handlers
    window.changePage = (delta, id) => {
        if (id === containerId) callback(currentPage + delta);
    };
    window.goToPage = (p, id) => {
        if (id === containerId) callback(p);
    };
};

// ==========================================
// Init View Specific Logic
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    initAdmin();
    initLoginForm();
    
    // Check which page we are on and load appropriate data
    const path = window.location.pathname;
    
    if (path.includes('dashboard')) {
        loadDashboardData();
        // Charts will be loaded by charts.js
    } else if (path.includes('records')) {
        loadRecords();
        
        // Setup search
        const searchInput = document.getElementById('searchInput');
        const filterSelect = document.getElementById('filterSelect');
        
        if (searchInput) {
            let debounceTimer;
            searchInput.addEventListener('input', (e) => {
                clearTimeout(debounceTimer);
                debounceTimer = setTimeout(() => {
                    loadRecords(1, e.target.value, filterSelect ? filterSelect.value : '');
                }, 500);
            });
        }
        
        if (filterSelect) {
            filterSelect.addEventListener('change', (e) => {
                loadRecords(1, searchInput ? searchInput.value : '', e.target.value);
            });
        }
    } else if (path.includes('visitors')) {
        loadVisitors();
        
        const searchInput = document.getElementById('searchVisitorInput');
        if (searchInput) {
            let debounceTimer;
            searchInput.addEventListener('input', (e) => {
                clearTimeout(debounceTimer);
                debounceTimer = setTimeout(() => {
                    loadVisitors(1, e.target.value);
                }, 500);
            });
        }
    }
});
