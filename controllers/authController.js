// const { hash, compare } = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { promisify } = require('util');
const crypto = require('crypto');
// const cookieToken = require('../utils/cookieToken');
const User = require('../models/userModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const sendEmail = require('../utils/email');
const City = require('../models/cityModel');

const signToken = (id) =>
  jwt.sign({ id }, process.env.JTW_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });

const createAndSendToken = (user, res, statusCode = 200, sendUser = false) => {
  const token = signToken(user._id);
  const cookieOptions = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000,
    ),
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'none',
    // secure: true,
    // secure: req.secure || req.headers('x-forwarded-proto') === 'https',
  };

  res.cookie('jwt', token, cookieOptions);
  user.password = undefined;

  // eslint-disable-next-line no-unused-expressions
  sendUser
    ? res.status(statusCode).json({
        status: 'success',
        token,
        data: {
          user,
        },
      })
    : res.status(statusCode).json({
        status: 'success',
        token,
      });
};

exports.signup = catchAsync(async (req, res, next) => {
  const { name, email, password, passwordConfirm } = req.body;
  const user = await User.create({ name, email, password, passwordConfirm });

  // eslint-disable-next-line no-unused-vars, node/no-unsupported-features/es-syntax
  const { password: _userPassword, __v, ...rest } = user._doc;

  createAndSendToken(rest, res, 201, true);
});

exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return next(new AppError('Please provide email and password', 400));
  }

  const user = await User.findOne({ email }).select('+password');

  if (!user || !(await user.correctPassword(password, user.password))) {
    return next(new AppError('Incorrect credentials', 401));
  }

  // eslint-disable-next-line no-unused-vars, node/no-unsupported-features/es-syntax
  const { password: _userPassword, __v, ...rest } = user._doc;

  createAndSendToken(rest, res, 200, true);
});

exports.protect = catchAsync(async (req, res, next) => {
  // Check if token exists
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies.jwt) {
    token = req.cookies.jwt;
  }

  if (!token) {
    return next(
      new AppError('You are not logged in. Please log in to get access.', 401),
    );
  }
  // Token verification
  const decoded = await promisify(jwt.verify)(token, process.env.JTW_SECRET);

  // Check if user still exists
  const user = await User.findById(decoded.id);
  // .populate('cities');

  if (!user) {
    return next(new AppError('User of the token does no longer exist.', 401));
  }
  // Check if user changed password after token was issued
  if (user.changedPasswordAfter(decoded.iat)) {
    return next(
      new AppError(
        'User changed password after the token has been issued, Please log in again.',
        401,
      ),
    );
  }
  // If all checks pass, grant access to protected route and add user data to request

  req.user = user;
  next();
});

exports.restrict = catchAsync(async (req, res, next) => {
  if (req.baseUrl.endsWith('cities')) {
    const city = await City.findById(req.params.id);
    if (req.user._id.equals(city.user)) {
      return next();
    }
  }

  if (req.user.role !== 'admin') {
    return next(
      new AppError('You do not have permissions to perform this action', 403),
    );
  }
  next();
});

exports.forgotPassword = catchAsync(async (req, res, next) => {
  // Find user from posted email
  const user = await User.findOne({ email: req.body.email });
  if (!user) {
    return next(
      new AppError('There is no user with the provided email address'),
      404,
    );
  }

  // Generate the random reset token
  const resetToken = user.createPasswordResetToken();
  await user.save({ validateBeforeSave: false });

  try {
    // Send token to users's email
    const resetURL = `${req.protocol}://${req.get(
      'host',
    )}/api/v1/users/reset-password/${resetToken}`;
    // await new Email(user, resetURL).sendPasswordReset();
    const message = `Forgot your password? Please click the link below to reset it.\n ${resetURL}\n If you haven't forget your password, please ignore this email.`;

    await sendEmail({
      email: user.email,
      subject: 'Your password reset link, active for 10 minutes.',
      message,
    });

    res.status(200).json({
      status: 'success',
      message: 'Token sent to email!',
    });
  } catch (err) {
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });

    return next(
      new AppError('There was an error sending the email. Try again later.'),
      500,
    );
  }
});

exports.resetPassword = catchAsync(async (req, res, next) => {
  // Get user based on the token
  const hashedToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() },
  });

  // if token has not expired, and there is a user, set a new password
  if (!user) {
    return next(new AppError('Token is invalid or expired'), 400);
  }
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();

  // Log in user, send JWT
  createAndSendToken(user, res);
});

exports.updatePassword = catchAsync(async (req, res, next) => {
  // Get user from collection
  const user = await User.findById(req.user.id).select('+password');

  // Check if posted password is correct
  if (!(await user.correctPassword(req.body.passwordCurrent, user.password))) {
    return next(new AppError('Current password is incorrect'), 401);
  }

  // If so, update password
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  await user.save();

  // Log in user, send JWT
  createAndSendToken(user, res);
});
