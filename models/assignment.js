const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const AssignmentSchema = new Schema({
    assignmentId: {
        type: String,
        unique: true,
    },
    completed: {
        type: Boolean,
        default: false,
    }
}, { timestamps: true });

const Assignment = mongoose.model('Assignment', AssignmentSchema);

module.exports = Assignment;