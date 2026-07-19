const XLSX = require('xlsx');

const generateExcel = (records, filePath) => {
    return new Promise((resolve, reject) => {
        try {
            const workbook = XLSX.utils.book_new();

            // Summary sheet
            const summaryData = records.map(r => ({
                'Student Name': r.student.name,
                'Roll Number': r.student.rollNumber,
                'Year': r.student.year,
                'Department': r.student.department,
                'Semester': r.student.semester,
                'Email': r.student.email,
                'Phone': r.student.phone,
                'Total Classes': r.overallAttendance.totalClasses,
                'Attended': r.overallAttendance.totalAttended,
                'Percentage': r.overallAttendance.percentage,
                'Status': r.overallAttendance.status,
                'Date': new Date(r.createdAt).toLocaleDateString()
            }));

            const summarySheet = XLSX.utils.json_to_sheet(summaryData);
            summarySheet['!cols'] = [
                { wch: 20 }, { wch: 15 }, { wch: 6 }, { wch: 15 },
                { wch: 10 }, { wch: 25 }, { wch: 15 }, { wch: 12 },
                { wch: 10 }, { wch: 10 }, { wch: 8 }, { wch: 12 }
            ];
            XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary');

            // Detailed sheet with all subjects
            const detailedData = [];
            records.forEach(r => {
                r.subjects.forEach(s => {
                    detailedData.push({
                        'Student Name': r.student.name,
                        'Roll Number': r.student.rollNumber,
                        'Department': r.student.department,
                        'Subject': s.subjectName,
                        'Faculty': s.facultyName,
                        'Total Classes': s.totalClasses,
                        'Attended': s.attendedClasses,
                        'Percentage': s.percentage,
                        'Classes Needed': s.classesNeeded,
                        'Status': s.status
                    });
                });
            });

            const detailedSheet = XLSX.utils.json_to_sheet(detailedData);
            detailedSheet['!cols'] = [
                { wch: 20 }, { wch: 15 }, { wch: 15 }, { wch: 20 },
                { wch: 20 }, { wch: 12 }, { wch: 10 }, { wch: 10 },
                { wch: 14 }, { wch: 8 }
            ];
            XLSX.utils.book_append_sheet(workbook, detailedSheet, 'Detailed');

            XLSX.writeFile(workbook, filePath);
            resolve();
        } catch (error) {
            reject(error);
        }
    });
};

module.exports = { generateExcel };
