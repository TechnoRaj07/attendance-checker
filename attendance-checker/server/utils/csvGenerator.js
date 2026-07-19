const { createObjectCsvWriter } = require('csv-writer');

const generateCSV = async (data, filePath) => {
    if (!data || data.length === 0) {
        throw new Error('No data to export.');
    }

    // Auto-detect headers from first record
    const firstRecord = data[0].toObject ? data[0].toObject() : data[0];
    const headers = Object.keys(firstRecord)
        .filter(key => key !== '_id' && key !== '__v' && key !== 'loginHistory')
        .map(key => ({
            id: key,
            title: key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())
        }));

    const csvWriter = createObjectCsvWriter({
        path: filePath,
        header: headers
    });

    const records = data.map(item => {
        const obj = item.toObject ? item.toObject() : item;
        const flat = {};
        headers.forEach(h => {
            let val = obj[h.id];
            if (val instanceof Date) {
                val = val.toISOString();
            } else if (typeof val === 'object' && val !== null) {
                val = JSON.stringify(val);
            }
            flat[h.id] = val ?? '';
        });
        return flat;
    });

    await csvWriter.writeRecords(records);
};

module.exports = { generateCSV };
