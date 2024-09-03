const User = require('../models/userModel');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');

const filterObj = (obj, ...allowedFIelds) => {
  const newObj = {};
  Object.keys(obj).forEach((key) => {
    if (allowedFIelds.includes(key)) newObj[key] = obj[key];
  });
  return newObj;
};

exports.getMe = (req, res, next) => {
  const { user } = req;
  console.log('🚀 ~ user:', user);

  if (!user) {
    return next(new AppError('User details can not be found', 404));
  }

  res.status(200).json({
    status: 'success',
    data: {
      user,
    },
  });
};

exports.updateMe = catchAsync(async (req, res, next) => {
  // Create error if user post password data
  if (req.body.password || req.body.passwordConfirm) {
    return next(
      new AppError(
        'You cannot update password here. Use "/update my password"/ link instead',
        400,
      ),
    );
  }

  // Update user document
  const filteredBody = filterObj(req.body, 'name', 'email');
  // if (req.file) filteredBody.photo = req.file.filename;
  const user = await User.findByIdAndUpdate(req.user.id, filteredBody, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({
    status: 'success',
    data: {
      user,
    },
  });
});

exports.deleteMe = catchAsync(async (req, res, next) => {
  await User.findByIdAndUpdate(req.user.id, { active: false });

  res.status(204).json({
    status: 'success',
    data: null,
  });
});

exports.getUser = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.params.userId)
    .select('-__v')
    .populate('cities');

  if (!user) {
    return next(new AppError("Couldn't find user by its ID.", 404));
  }

  res.status(200).json({
    status: 'success',
    data: {
      user,
    },
  });
});
