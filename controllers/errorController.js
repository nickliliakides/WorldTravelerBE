const AppError = require('../utils/appError');

const sendDevError = (err, res) => {
  res.status(err.statusCode || 500).json({
    status: err.status || 'error',
    message: err.message || 'Something went wrong',
    error: err,
    stack: err.stack,
  });
};

const sendProdError = (err, res) => {
  console.log('🚀 ~ sendProdError ~ err:', err);
  // Operational, trusted errors
  if (err.isOperational) {
    res.status(err.statusCode || 500).json({
      status: err.status || 'error',
      message: err.message,
    });
    // Programming ot other unknown errors
  } else {
    // log error
    console.error('💥 Error: ', err);
    res.status(500).json({
      status: 'error',
      message: 'Something went wrong',
    });
  }
};

const handleCastDBError = (err) => {
  const message = `${err.value} is an invalid ${err.path}`;
  return new AppError(message, 400);
};

const handleValidationError = (err) => {
  const errors = Object.values(err.errors).map((el) => el.message);
  const message = `Invalid input data. ${errors.join('. ')}`;
  return new AppError(message, 400);
};

const handleDuplicateFieldsDB = (err) => {
  const value = err.errorResponse.errmsg.match(/(["'])(\\?.)*?\1/)[0];
  const message = `Duplicate field value: ${value}. Try another`;
  return new AppError(message, 400);
};

const handleJWTError = (err) =>
  new AppError(`${err.message}. Please log in again.`, 401);

module.exports = (err, req, res, next) => {
  if (process.env.NODE_ENV === 'production') {
    let error = { ...err, message: err.message };

    if (err.name === 'CastError') {
      error = handleCastDBError(err);
    }
    if (err.name === 'ValidationError') {
      error = handleValidationError(err);
    }
    if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
      error = handleJWTError(err);
    }
    if (err.code === 11000) error = handleDuplicateFieldsDB(error);

    sendProdError(error, res);
  } else {
    sendDevError(err, res);
  }
};
