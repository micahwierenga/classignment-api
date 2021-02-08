const express = require('express');
const router = express.Router();
const controllers = require('../controllers');

router.get('/', controllers.courses.index);
router.get('/:courseId', controllers.courses.getCourseAssignments);
router.get('/:courseId/:assignmentId', controllers.courses.getAssignmentSubmission);
router.put('/:assignmentId', controllers.courses.markAssignmentComplete);

module.exports = router;