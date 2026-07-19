// Utility helper functions

const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
        year: 'numeric', month: 'long', day: 'numeric'
    });
};

const formatTime = (date) => {
    return new Date(date).toLocaleTimeString('en-US', {
        hour: '2-digit', minute: '2-digit', second: '2-digit'
    });
};

const calculateAttendance = (attended, total) => {
    if (total === 0) return { percentage: 0, status: 'SHORT', classesNeeded: 0 };
    const percentage = (attended / total) * 100;
    let classesNeeded = (3 * total) - (4 * attended);
    if (classesNeeded < 0) classesNeeded = 0;
    return {
        percentage: Math.round(percentage * 100) / 100,
        status: percentage >= 75 ? 'PASS' : 'SHORT',
        classesNeeded: Math.ceil(classesNeeded)
    };
};

const sanitizeInput = (str) => {
    if (typeof str !== 'string') return str;
    return str.replace(/[<>]/g, '').trim();
};

const generateId = () => {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

module.exports = {
    formatDate,
    formatTime,
    calculateAttendance,
    sanitizeInput,
    generateId
};
