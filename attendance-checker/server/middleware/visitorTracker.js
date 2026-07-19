const { v4: uuidv4 } = require('uuid');
const Visitor = require('../models/Visitor');

const visitorTracker = async (req, res, next) => {
    // Skip tracking for API calls, static assets, and admin routes
    if (req.path.startsWith('/api/') ||
        req.path.match(/\.(css|js|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot|map)$/) ||
        req.path.startsWith('/reports/') ||
        req.path.startsWith('/uploads/')) {
        return next();
    }

    try {
        const ua = req.headers['user-agent'] || '';
        const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.ip || req.connection?.remoteAddress || '0.0.0.0';

        // Parse user agent
        let browser = 'Unknown';
        let os = 'Unknown';
        let device = 'Desktop';

        if (ua.includes('Chrome')) browser = 'Chrome';
        else if (ua.includes('Firefox')) browser = 'Firefox';
        else if (ua.includes('Safari')) browser = 'Safari';
        else if (ua.includes('Edge')) browser = 'Edge';
        else if (ua.includes('Opera') || ua.includes('OPR')) browser = 'Opera';
        else if (ua.includes('MSIE') || ua.includes('Trident')) browser = 'Internet Explorer';

        if (ua.includes('Windows')) os = 'Windows';
        else if (ua.includes('Mac')) os = 'macOS';
        else if (ua.includes('Linux')) os = 'Linux';
        else if (ua.includes('Android')) os = 'Android';
        else if (ua.includes('iPhone') || ua.includes('iPad')) os = 'iOS';

        if (ua.includes('Mobile') || ua.includes('Android')) device = 'Mobile';
        else if (ua.includes('Tablet') || ua.includes('iPad')) device = 'Tablet';

        const visitorData = {
            visitorId: uuidv4(),
            sessionId: uuidv4(),
            ipAddress: ip,
            browser: browser,
            operatingSystem: os,
            device: device,
            userAgent: ua,
            visitedPage: req.path || '/',
            referralWebsite: req.headers.referer || req.headers.referrer || 'Direct',
            language: req.headers['accept-language']?.split(',')[0] || 'en',
            loginTime: new Date(),
            date: new Date()
        };

        // Save visitor asynchronously (don't block request)
        const visitor = new Visitor(visitorData);
        visitor.save().catch(err => {
            // Silently fail - don't break the user experience
            if (process.env.NODE_ENV === 'development') {
                console.log('Visitor tracking note:', err.message);
            }
        });

    } catch (error) {
        // Never block requests due to tracking errors
        if (process.env.NODE_ENV === 'development') {
            console.log('Visitor tracking note:', error.message);
        }
    }

    next();
};

module.exports = visitorTracker;
