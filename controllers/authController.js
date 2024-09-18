const jwt = require('jsonwebtoken');
const { promisify } = require('util');
const crypto = require('crypto');
const User = require('../models/userModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const City = require('../models/cityModel');
const Email = require('../utils/email');

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

const createAndSendActivationToken = async (user, req, res, next) => {
  const activationToken = user.createToken('userActivation');

  await user.save({ validateBeforeSave: false });

  const activateURL = `${process.env.CLIENT_BASE_URL}/user/activation/${activationToken}`;

  const message =
    'Please click or copy and paste the link below to activate your account.';

  try {
    await new Email(user, message, activateURL).sendWelcome();

    res.status(200).json({
      status: 'success',
      message:
        '✅ User created! Activation link sent to your email! ☑️ Please activate your account in order to use the application.',
    });
  } catch (err) {
    user.userActivationToken = undefined;
    user.userActivationExpires = undefined;
    await user.save({ validateBeforeSave: false });

    return next(
      new AppError(
        'Confirmation email error!!! User created but activation failed and is not able to login. Please contact your administrator!',
      ),
      500,
    );
  }
};

exports.signup = catchAsync(async (req, res, next) => {
  const { name, email, password, passwordConfirm } = req.body;
  const user = await User.create({ name, email, password, passwordConfirm });

  // eslint-disable-next-line no-unused-vars, node/no-unsupported-features/es-syntax
  const { password: _userPassword, __v, ...rest } = user._doc;

  createAndSendActivationToken(user, req, res, next);
});

exports.activateUser = catchAsync(async (req, res, next) => {
  // Get user based on the token
  const hashedToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');

  const user = await User.findOne({
    userActivationToken: hashedToken,
    // userActivationExpires: { $gt: Date.now() },
  });

  // if token has not expired, and there is a user activate user
  if (!user) {
    return next(new AppError('Activation Token is invalid or expired'), 400);
  }
  user.active = true;
  user.userActivationToken = undefined;
  user.userActivationExpires = undefined;
  await user.save({ validateBeforeSave: false });

  createAndSendToken(user, res, 200, true);
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

  if (!user.active) {
    return next(
      new AppError(
        'User is not activated or has been deleted his/her account. Please check your email for activation link, if you have recently registered.',
        401,
      ),
    );
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
  const resetToken = user.createToken('passwordReset');
  await user.save({ validateBeforeSave: false });

  const resetURL = `${process.env.CLIENT_BASE_URL}/password/reset/${resetToken}`;
  // await new Email(user, resetURL).sendPasswordReset();
  const message = `Forgot your password? Please click the link below to reset it. If you haven't requested password reset, please ignore this email.`;

  // Send token to users's email
  try {
    await new Email(user, message, resetURL).sendPasswordReset();

    res.status(200).json({
      status: 'success',
      message:
        '✅ Reset token sent to email successfully! For security reasons token will be valid for only 10 minutes.',
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
  createAndSendToken(user, res, 200, true);
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
