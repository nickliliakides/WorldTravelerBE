const mongoose = require('mongoose');
// const cookieParser = require('cookie-parser');
const morgan = require('morgan');
const express = require('express');
const path = require('path');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const compression = require('compression');

const cityRouter = require('./routes/cityRoutes');
const userRouter = require('./routes/userRoutes');
const AppError = require('./utils/appError');
const globalErrorHandler = require('./controllers/errorController');
require('dotenv').config();

process.on('uncaughtException', (err) => {
  console.log(err.name, err.message);
  console.log('Uncaught Exception! 💥 Shutting down...');
  process.exit(1);
});

const app = express();

mongoose
  .connect(process.env.DATABASE_URL)
  .then(() => console.log('DB Connection Successful!'));

// Sets security HTTP headers
app.use(helmet());

const whitelist = [
  'http://localhost:3000',
  'https://world-traveler-rho.vercel.app',
];
app.use(cors({ origin: whitelist, credentials: true }));
// app.options('*', cors());

// Serving static files
app.use(express.static(path.join(__dirname, 'public')));

// Development logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Limits requests from the same IP
const limiter = rateLimit({
  max: 160000,
  windowMs: 60 * 60 * 1000,
  message: 'Too many requests from this IP, please try again in an hour',
});
app.use('/api', limiter);

// Body parser, reading data from req.body
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
// app.use(cookieParser());

// Data sanitization against noSQL query injection
app.use(mongoSanitize());

// Data sanitization against XSS
app.use(xss());

// Prevent parameter pollution
app.use(
  hpp({
    whitelist: ['cityName', 'country', 'arrivalDate', 'durationDays'],
  }),
);

app.use(compression());

app.use('/api/v1/cities', cityRouter);
app.use('/api/v1/users', userRouter);
app.all('*', (req, res, next) => {
  next(
    new AppError(
      `Couldn't find ${req.originalUrl} page. Please check the URL and try again.`,
      404,
    ),
  );
});

app.use(globalErrorHandler);

module.exports = app;
