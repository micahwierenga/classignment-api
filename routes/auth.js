const router = require('express').Router();
const ctrl = require('../controllers');

const authRequired = require('../middleware/authRequired');

router.post('/register', ctrl.auth.register);
router.post('/login', ctrl.auth.login);
router.get('/', authRequired, ctrl.auth.profile);

module.exports = router;
