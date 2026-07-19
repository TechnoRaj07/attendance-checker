// ==========================================
// Attendance Checker Logic
// ==========================================

let subjectCount = 0;
const MAX_SUBJECTS = 15;

// Formula exactly matching the C++ code
const calculateClassesNeeded = (attended, total) => {
    let x = (3 * total) - (4 * attended);
    return x < 0 ? 0 : Math.ceil(x);
};

// Initialize the attendance page
const initAttendance = () => {
    const form = document.getElementById('attendanceForm');
    const addSubjectBtn = document.getElementById('addSubjectBtn');
    const resultSection = document.getElementById('resultSection');

    if (!form) return;

    // Add initial subjects
    addSubject();
    addSubject();
    addSubject();

    addSubjectBtn.addEventListener('click', addSubject);

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        if (validateForm()) {
            await submitAttendance();
        }
    });
};

// Add a new subject card
const addSubject = () => {
    if (subjectCount >= MAX_SUBJECTS) {
        showToast('Maximum 15 subjects allowed', 'warning');
        return;
    }

    subjectCount++;
    const container = document.getElementById('subjectsContainer');
    
    const card = document.createElement('div');
    card.className = 'col-md-6 col-lg-4 subject-card-wrapper scale-in';
    card.id = `subjectCard_${subjectCount}`;
    
    card.innerHTML = `
        <div class="subject-card tilt-effect">
            <div class="subject-number">Subject ${subjectCount}</div>
            ${subjectCount > 1 ? `<button type="button" class="remove-subject" onclick="removeSubject(${subjectCount})"><i class="fas fa-times"></i></button>` : ''}
            
            <div class="mb-3">
                <label class="form-label">Subject Name</label>
                <input type="text" class="form-control" name="subjectName[]" placeholder="e.g., Mathematics" required>
            </div>
            
            <div class="mb-3">
                <label class="form-label">Faculty Name</label>
                <input type="text" class="form-control" name="facultyName[]" placeholder="e.g., Prof. Smith" required>
            </div>
            
            <div class="row">
                <div class="col-6 mb-3">
                    <label class="form-label">Total Classes</label>
                    <input type="number" class="form-control text-primary subject-total" name="totalClasses[]" min="0" required onchange="validateClasses(this)">
                </div>
                <div class="col-6 mb-3">
                    <label class="form-label">Attended</label>
                    <input type="number" class="form-control text-success subject-attended" name="attendedClasses[]" min="0" required onchange="validateClasses(this)">
                </div>
            </div>
        </div>
    `;
    
    container.appendChild(card);
    document.getElementById('numSubjects').value = subjectCount;
};

// Remove a subject card
window.removeSubject = (id) => {
    const card = document.getElementById(`subjectCard_${id}`);
    if (card) {
        card.style.animation = 'scaleIn 0.3s ease reverse forwards';
        setTimeout(() => {
            card.remove();
            reindexSubjects();
        }, 300);
    }
};

// Reindex subjects after removal
const reindexSubjects = () => {
    const cards = document.querySelectorAll('.subject-card-wrapper');
    subjectCount = cards.length;
    document.getElementById('numSubjects').value = subjectCount;
    
    cards.forEach((card, index) => {
        const numIndex = index + 1;
        card.id = `subjectCard_${numIndex}`;
        card.querySelector('.subject-number').textContent = `Subject ${numIndex}`;
        
        const removeBtn = card.querySelector('.remove-subject');
        if (removeBtn) {
            removeBtn.setAttribute('onclick', `removeSubject(${numIndex})`);
            // Ensure at least one subject exists without remove button
            if (numIndex === 1) removeBtn.remove();
        } else if (numIndex > 1) {
            // Add remove button if missing and not first
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'remove-subject';
            btn.setAttribute('onclick', `removeSubject(${numIndex})`);
            btn.innerHTML = '<i class="fas fa-times"></i>';
            card.querySelector('.subject-card').insertBefore(btn, card.querySelector('.mb-3'));
        }
    });
};

// Validate attended <= total
window.validateClasses = (input) => {
    const card = input.closest('.subject-card');
    const totalInput = card.querySelector('.subject-total');
    const attendedInput = card.querySelector('.subject-attended');
    
    const total = parseInt(totalInput.value) || 0;
    const attended = parseInt(attendedInput.value) || 0;
    
    if (attended > total) {
        attendedInput.classList.add('is-invalid');
        showToast('Attended classes cannot exceed total classes', 'error');
        return false;
    } else {
        attendedInput.classList.remove('is-invalid');
        return true;
    }
};

// Validate entire form
const validateForm = () => {
    const form = document.getElementById('attendanceForm');
    let isValid = true;
    
    // Check required fields
    if (!form.checkValidity()) {
        form.classList.add('was-validated');
        showToast('Please fill all required fields correctly', 'error');
        return false;
    }
    
    // Check class logic
    const cards = document.querySelectorAll('.subject-card');
    cards.forEach(card => {
        const total = parseInt(card.querySelector('.subject-total').value) || 0;
        const attended = parseInt(card.querySelector('.subject-attended').value) || 0;
        
        if (attended > total) {
            card.querySelector('.subject-attended').classList.add('is-invalid');
            isValid = false;
        }
    });
    
    if (!isValid) {
        showToast('Please fix the errors in subject classes', 'error');
    }
    
    return isValid;
};

// Submit attendance to API
const submitAttendance = async () => {
    const submitBtn = document.getElementById('generateBtn');
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i> Generating...';
    submitBtn.disabled = true;
    
    try {
        const formData = new FormData(document.getElementById('attendanceForm'));
        
        // Build payload
        const payload = {
            student: {
                name: formData.get('studentName'),
                rollNumber: formData.get('rollNumber'),
                year: formData.get('year'),
                department: formData.get('department'),
                semester: formData.get('semester'),
                email: formData.get('email'),
                phone: formData.get('phone')
            },
            numberOfSubjects: formData.get('numSubjects'),
            subjects: []
        };
        
        const subjectNames = formData.getAll('subjectName[]');
        const facultyNames = formData.getAll('facultyName[]');
        const totalClasses = formData.getAll('totalClasses[]');
        const attendedClasses = formData.getAll('attendedClasses[]');
        
        for (let i = 0; i < subjectNames.length; i++) {
            payload.subjects.push({
                subjectName: subjectNames[i],
                facultyName: facultyNames[i],
                totalClasses: parseInt(totalClasses[i]),
                attendedClasses: parseInt(attendedClasses[i])
            });
        }
        
        const response = await apiRequest('/attendance/check', {
            method: 'POST',
            body: JSON.stringify(payload)
        });
        
        if (response.success) {
            showToast('Report generated successfully!', 'success');
            renderReport(response.data);
            
            // Scroll to result
            document.getElementById('resultSection').classList.remove('d-none');
            setTimeout(() => {
                document.getElementById('resultSection').scrollIntoView({ behavior: 'smooth' });
            }, 100);
        }
        
    } catch (error) {
        showToast(error.message || 'Error generating report', 'error');
    } finally {
        submitBtn.innerHTML = '<i class="fas fa-magic me-2"></i> Generate Report';
        submitBtn.disabled = false;
    }
};

// Render the report UI
const renderReport = (data) => {
    // Populate profile
    document.getElementById('resName').textContent = data.student.name;
    document.getElementById('resRoll').textContent = data.student.rollNumber;
    document.getElementById('resDept').textContent = data.student.department;
    document.getElementById('resYearSem').textContent = `Year ${data.student.year}, Sem ${data.student.semester}`;
    document.getElementById('resDate').textContent = new Date(data.createdAt).toLocaleDateString();
    
    // Populate table
    const tableBody = document.getElementById('resultTableBody');
    tableBody.innerHTML = '';
    
    data.subjects.forEach(sub => {
        const tr = document.createElement('tr');
        const statusBadge = sub.status === 'PASS' 
            ? '<span class="badge-pass">PASS</span>' 
            : '<span class="badge-short">SHORT</span>';
            
        const neededText = sub.status === 'PASS' ? '-' : `<span class="text-danger-cyber">+${sub.classesNeeded}</span>`;
            
        tr.innerHTML = `
            <td>${sub.subjectName}</td>
            <td>${sub.facultyName}</td>
            <td class="text-center font-orbitron">${sub.totalClasses}</td>
            <td class="text-center font-orbitron">${sub.attendedClasses}</td>
            <td class="text-center font-orbitron text-primary">${sub.percentage}%</td>
            <td class="text-center font-orbitron">${neededText}</td>
            <td class="text-center">${statusBadge}</td>
        `;
        tableBody.appendChild(tr);
    });
    
    // Populate overall stats
    document.getElementById('overallTotal').textContent = data.overallAttendance.totalClasses;
    document.getElementById('overallAttended').textContent = data.overallAttendance.totalAttended;
    
    const percentageEl = document.getElementById('overallPercentage');
    percentageEl.textContent = `${data.overallAttendance.percentage}%`;
    
    const statusEl = document.getElementById('overallStatus');
    statusEl.textContent = data.overallAttendance.status;
    
    const resultBox = document.getElementById('overallResultBox');
    resultBox.className = `overall-result ${data.overallAttendance.status.toLowerCase()}`;
    
    // Setup download button
    const downloadBtn = document.getElementById('downloadPdfBtn');
    downloadBtn.onclick = () => {
        window.open(`/api/export/attendance/pdf/${data._id}`, '_blank');
    };
    
    // Setup print button
    document.getElementById('printBtn').onclick = () => window.print();
};

document.addEventListener('DOMContentLoaded', initAttendance);
