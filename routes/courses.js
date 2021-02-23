const express = require('express');
const router = express.Router();
const controllers = require('../controllers');

const authRequired = require("../middleware/authRequired");

router.get('/', authRequired, controllers.courses.index);
router.get('/:courseId', authRequired, controllers.courses.getCourseAssignments);
router.get('/:courseId/:assignmentId', authRequired, controllers.courses.getAssignmentSubmission);
router.put('/:assignmentId', authRequired, controllers.courses.markAssignmentComplete);

module.exports = router;
