const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');

const securityMiddleware = (app) => {
    // Helmet for HTTP security headers
    app.use(helmet({
        contentSecurityPolicy: false,
        crossOriginEmbedderPolicy: false
    }));

    // Mongo sanitization against NoSQL injection
    app.use(mongoSanitize({
        replaceWith: '_',
        onSanitize: ({ req, key }) => {
            console.warn(`[SECURITY] Sanitized ${key} in request from ${req.ip}`);
        }
    }));

    // Custom XSS protection middleware
    app.use((req, res, next) => {
        if (req.body) {
            const sanitizeObject = (obj) => {
                for (let key in obj) {
                    if (typeof obj[key] === 'string') {
                        obj[key] = obj[key]
                            .replace(/</g, '&lt;')
                            .replace(/>/g, '&gt;')
                            .replace(/javascript:/gi, '')
                            .replace(/on\w+=/gi, '');
                    } else if (typeof obj[key] === 'object' && obj[key] !== null) {
                        sanitizeObject(obj[key]);
                    }
                }
            };
            sanitizeObject(req.body);
        }
        next();
    });

    // Prevent clickjacking
    app.use((req, res, next) => {
        res.setHeader('X-Frame-Options', 'SAMEORIGIN');
        res.setHeader('X-Content-Type-Options', 'nosniff');
        res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
        next();
    });
};

module.exports = securityMiddleware;
