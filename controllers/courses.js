const axios = require('axios');
const JSONbig = require('json-bigint');

const BASE_URL = process.env.CANVAS_API_BASE_URL;
const BEARER_TOKEN = process.env.CANVAS_API_BEARER_TOKEN;
const STUDENT_ID = process.env.CANVAS_API_STUDENT_ID;
const courses = require('../courseData');
const { Assignment } = require('../models');

// List your courses
// GET /api/v1/courses
// https://canvas.instructure.com/doc/api/all_resources.html#method.courses.index
// Get a single course
// GET /api/v1/courses/:id
// https://canvas.instructure.com/doc/api/all_resources.html#method.courses.show
// List courses for a user (not up to date)
// GET /api/v1/users/:user_id/courses
// https://canvas.instructure.com/doc/api/all_resources.html#method.courses.user_index
// List students
// GET /api/v1/courses/:course_id/students
// https://canvas.instructure.com/doc/api/all_resources.html#method.courses.students
// List missing submissions
// GET /api/v1/users/:user_id/missing_submissions
// https://canvas.instructure.com/doc/api/all_resources.html#method.users.missing_submissions
// Show user details
// GET /api/v1/users/:id
// https://canvas.instructure.com/doc/api/all_resources.html#method.users.api_show
// List assignments
// GET /api/v1/courses/:course_id/assignments
// https://canvas.instructure.com/doc/api/assignments.html#method.assignments_api.index
// List assignments for user
// GET /api/v1/users/:user_id/courses/:course_id/assignments
// https://canvas.instructure.com/doc/api/all_resources.html#method.assignments_api.user_index
// List assignment submissions
// GET /api/v1/courses/:course_id/assignments/:assignment_id/submissions
// https://canvas.instructure.com/doc/api/all_resources.html#method.submissions_api.index
// Get a user's most recently graded submissions
// GET /api/v1/users/:id/graded_submissions
// https://canvas.instructure.com/doc/api/all_resources.html#method.users.user_graded_submissions
// List submissions
// GET /api/v1/courses/:course_id/gradebook_history/:date/graders/:grader_id/assignments/:assignment_id/submissions
// https://canvas.instructure.com/doc/api/all_resources.html#method.gradebook_history_api.submissions
// Get a single submission
// GET /api/v1/courses/:course_id/assignments/:assignment_id/submissions/:user_id
// https://canvas.instructure.com/api/v1/courses/148030000000002385/assignments/148030000000056805/submissions/148030000000001129
// https://canvas.instructure.com/doc/api/all_resources.html#method.submissions_api.show


const index = async (req, res) => {
    try {
        const coursesData = [];
        for(let i = 0; i < courses.length; i++) {
            const d = await axios.get(`${BASE_URL}/courses/${courses[i].api_id}`, {
                headers: {
                    'Authorization': `Bearer ${BEARER_TOKEN}`
                },
                transformResponse: data => JSONbig.parse(data),
            })

            const course = {...d.data, ...courses[i]}
            coursesData.push(course);
        }

        res.json({ courses: coursesData });
        
    } catch (error) {
        console.log('error:', error.response);
        res.json({error});
    }
}

const getCourseAssignments = async (req, res) => {
    try {
        const savedAssignments = await Assignment.find();
        console.log('savedAssignments:', savedAssignments);
        let assignments = await axios.get(`${BASE_URL}/courses/${req.params.courseId}/assignments`, {
            headers: {
                'Authorization': `Bearer ${BEARER_TOKEN}`
            },
            transformResponse: data => JSONbig.parse(data),
        })
        assignments = assignments.data.map(assignment => {
            assignment.id = assignment.id.c.join('');
            assignment.course_id = assignment.course_id.c.join('');
            assignment.assignment_group_id = assignment.assignment_group_id.c.join('');
            return assignment;
        });

        await createAssignments(savedAssignments, assignments);
        const incompleteAssignments = await filterIncompleteAssignments(assignments);

        const foundCourse = courses.findIndex(course => course.api_id === assignments[0].course_id);
        const preparedAssignments = markAuthorization(courses[foundCourse].assignmentGroups, incompleteAssignments);
        
        const fullAssignments = [...preparedAssignments];

        res.json({ fullAssignments });
    } catch (error) {
        console.log('[getCourseAssignments] error:', error);
        res.json({error: error});
    }
}

const markAuthorization = (assignmentGroups, assignments) => {
    return assignments.map(assignment => {
        const foundGroup = assignmentGroups.find(group => {
            console.log('assignment:', assignment);
            console.log('group:', group);
            return assignment.assignment_group_id === group.id
        });

        assignment.can_access = foundGroup.authorized;
        return assignment;
    })
}

const createAssignments = async (saved, retrieved) => {
    try {
        const savedIds = saved.map(assignment => assignment.assignmentId);
        const unsaved = retrieved.filter(assignment => !savedIds.includes(assignment.id));
        const assignmentsToCreate = unsaved.map(assignment => ({ assignmentId: assignment.id }));

        await Assignment.create(assignmentsToCreate);
    } catch (error) {
        console.log('[createAssignments] error:', error);
    }
}

const filterIncompleteAssignments = async retrieved => {
    try {
        const savedAssignments = await Assignment.find();

        return retrieved.filter(assignment => {
            const foundAssignment = savedAssignments.find(savedAssignment => {
                return savedAssignment.assignmentId === assignment.id
            });
            return !foundAssignment.completed;
        })
    } catch (error) {
        console.log('[getIncompleteAssignments] error:', error);
    }
}

const markAssignmentComplete = async (req, res) => {
    try {
        const updatedAssignment = await Assignment.findOneAndUpdate({ assignmentId: req.params.assignmentId }, { completed: true }, {new: true});
        console.log('updatedAssignment:', updatedAssignment);
        res.json({ updatedAssignment });
    } catch (error) {
        console.log('[markAssignmentComplete] error:', error);
        res.json({error: error});
    }
}

const getAssignmentSubmission = async (req, res) => {
    try {
        const submission = await axios.get(`${BASE_URL}/courses/${req.params.courseId}/assignments/${req.params.assignmentId}/submissions/${STUDENT_ID}?include[]=submission_comments`, {
            headers: {
                'Authorization': `Bearer ${BEARER_TOKEN}`
            },
            transformResponse: data => JSONbig.parse(data),
        })
        
        // const fullAssignments = await getAssignmentSubmissions(assignments.data);
        console.log('submission:', submission);
        res.json({ submission: submission.data });
    } catch (error) {
        console.log('error:', error.response);
        // console.log('error:', error.response.statusCode);
        res.json({error: error.response});
    }
    
}


module.exports = {
    index,
    getCourseAssignments,
    getAssignmentSubmission,
    markAssignmentComplete,
}