// ==========================================
// Frontend Utility Functions
// ==========================================

const utils = {
    // Form Validation
    validateEmail: (email) => {
        const re = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
        return re.test(String(email).toLowerCase());
    },
    
    validatePhone: (phone) => {
        const re = /^\+?[\d\s-]{10,15}$/;
        return re.test(String(phone));
    },
    
    // File Export Triggers
    downloadExcel: (id) => {
        window.open(`/api/export/attendance/excel`, '_blank');
    },
    
    downloadCSV: (type) => {
        if (type === 'visitors') {
            window.open(`/api/export/visitors/csv`, '_blank');
        } else {
            window.open(`/api/export/attendance/csv`, '_blank');
        }
    },
    
    // Formatting
    formatNumber: (num) => {
        return new Intl.NumberFormat().format(num);
    }
};
