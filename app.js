const path = require('path')
const express = require('express');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit')
const helmet = require('helmet')
const mongoSanitize = require('express-mongo-sanitize')
const xss = require('xss-clean')
const hpp = require('hpp')
const cookieParser = require('cookie-parser')

const AppError = require('./utils/appError');
const globalErrorHandler = require('./controllers/errorController');
const tourRouter = require('./routes/tourRoutes');
const userRouter = require('./routes/userRoutes');
const reviewRouter = require('./routes/reviewRoutes')
const bookingRouter = require('./routes/bookingRoutes')
const viewRouter = require('./routes/viewRoutes')

const app = express();

// we dont need to require pug, express supports pug.js , and all of that happens behind the scenes
// our pug templates are actually called views in express
app.set('view engine', 'pug')
// path.join(),behind the scenes create a path joining directory name and views
app.set('views', path.join(__dirname, 'views'))

// 1) GLOBAL MIDDLEWARES
app.use(express.static(path.join(__dirname, 'public')));

// set security HTTP HEADERS 
app.use(helmet())

// development logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

const limiter = rateLimit({
  max: 100,
  windowMs: 60 * 60 * 1000,
  message: 'Too many requests from this IP, please try again in an hour!'
})

app.use('/api', limiter);

// body parser, reading data from the body into req.body
app.use(express.json({ limit: '10kb' }));
app.use(cookieParser())

// data sanitization against NoSQL query injection
app.use(mongoSanitize())

// data sanitization against XSS
app.use(xss())

// prevent paramenter pollution
app.use(hpp({
  whitelist: [
    'duration',
    'ratingsQuantity',
    'ratingsAverage',
    'maxGroupSize',
    'difficulty',
    'price'
  ]
}))

// serving static files
// app.use(express.static(`${__dirname}/public`))

// test middleware
app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  // console.log(req.headers)
  // console.log(req.cookies,' from aryan line');
  next();
});

// 3) ROUTES
// these variable in the options are called locals in the pug file
app.use('/', viewRouter)
app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/reviews', reviewRouter)
app.use('/api/v1/bookings', bookingRouter)

app.all('*', (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

app.use(globalErrorHandler);

module.exports = app;
