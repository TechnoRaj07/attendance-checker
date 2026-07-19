const QRCode = require('qrcode');

const generateQRCode = async (data) => {
    try {
        const qrDataUrl = await QRCode.toDataURL(data, {
            width: 200,
            margin: 2,
            color: {
                dark: '#00E5FF',
                light: '#050505'
            }
        });
        return qrDataUrl;
    } catch (error) {
        console.error('QR Code generation error:', error);
        return null;
    }
};

const generateQRCodeToFile = async (data, filePath) => {
    try {
        await QRCode.toFile(filePath, data, {
            width: 200,
            margin: 2,
            color: {
                dark: '#00E5FF',
                light: '#050505'
            }
        });
        return filePath;
    } catch (error) {
        console.error('QR Code file generation error:', error);
        return null;
    }
};

module.exports = { generateQRCode, generateQRCodeToFile };
