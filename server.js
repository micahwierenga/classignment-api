/* External Modules */
const express = require('express');
const session = require('express-session');
const MongoStore = require('connect-mongo')(session);
// security
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const cors = require('cors');
// logging
const morgan = require('mongoose-morgan');

require('dotenv').config();
const app = express();

/* Internal Modules */
const routes = require('./routes');
const { notFound, methodNotAllowed } = require('./middleware/responseHandlers');

const PORT = process.env.PORT;

/* Configuration */
app.use(cors({
    origin: ['https://cool-blog-98.herokuapp.com', 'http://localhost:3000'],
    optionsSuccesStatus: 200,
}));

/* Middleware */
app.use(express.json());

// use rate limiting
app.use(rateLimit({
    max: 10000,
    windowMs: 24 * 60 * 60 * 1000, // 1 day
    message: 'Too many requests',
}));
// reset headers in response for security
app.use(helmet());
// sanitize data coming in from req.body
app.use(mongoSanitize());

app.use(
    morgan(
        { connectionString: process.env.MONGODB_URI },
        {
            // just track errors
            skip: function (req, res) {
                return res.statusCode < 400;
            },
        },
        'dev'
    )
);

// sessions
app.use(
    session(
        {
            resave: false,
            saveUninitialized: false,
            secret: process.env.SECRET,
            store: new MongoStore({
                url: process.env.MONGODB_URI,
            }),
            cookie: {
            maxAge: 1000 * 60 * 60 * 24 * 7 * 2, // 2 weeks
        },
    })
);

/* Routes */

// Auth Routes

app.use('/api/v1/courses', routes.courses);

// response middleware
app.get('/*', notFound);
app.use(methodNotAllowed);

/* Server Listener */
app.listen(PORT, () => { console.log(`Listening on ${PORT}`) });