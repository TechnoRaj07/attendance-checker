const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Student name is required'],
        trim: true,
        maxlength: [100, 'Name cannot exceed 100 characters']
    },
    rollNumber: {
        type: String,
        required: [true, 'Roll number is required'],
        trim: true,
        maxlength: [20, 'Roll number cannot exceed 20 characters']
    },
    year: {
        type: Number,
        required: [true, 'Year is required'],
        min: [1, 'Year must be between 1 and 4'],
        max: [4, 'Year must be between 1 and 4']
    },
    department: {
        type: String,
        required: [true, 'Department is required'],
        trim: true
    },
    semester: {
        type: String,
        required: [true, 'Semester is required'],
        trim: true
    },
    email: {
        type: String,
        required: [true, 'Email is required'],
        trim: true,
        lowercase: true,
        match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
    },
    phone: {
        type: String,
        required: [true, 'Phone number is required'],
        trim: true
    }
}, {
    timestamps: true
});

studentSchema.index({ rollNumber: 1 });
studentSchema.index({ email: 1 });

module.exports = mongoose.model('Student', studentSchema);
