const multer = require('multer');
const User = require('../models/userModel');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');

const multerStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'public/img/users');
  },
  filename: (req, file, cb) => {
    const ext = file.mimetype.split('/')[1];
    cb(null, `user-${req.user.id}-${Date.now()}.${ext}`);
  },
});

const multerFilter = (req, file, cb) => {
  const fileSize = parseInt(req.headers['content-length'], 10);
  console.log('🚀 ~ multerFilter ~ fileSize:', fileSize);
  if (file.mimetype.startsWith('image')) {
    cb(null, true);
  } else {
    cb(
      new AppError('File is not an image. Only image files are accepted.', 400),
      false,
    );
  }
  if (fileSize < 500000) {
    cb(null, true);
  } else {
    cb(
      new AppError(
        'File is too large. For a profile image, only files smaller than 500KB are accepted.',
        400,
      ),
      false,
    );
  }
};

const upload = multer({ storage: multerStorage, fileFilter: multerFilter });

const filterObj = (obj, ...allowedFIelds) => {
  const newObj = {};
  Object.keys(obj).forEach((key) => {
    if (allowedFIelds.includes(key)) newObj[key] = obj[key];
  });
  return newObj;
};

exports.getMe = (req, res, next) => {
  const { user } = req;

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

exports.uploadUserPhoto = upload.single('photo');

exports.updateMe = catchAsync(async (req, res, next) => {
  console.log('🚀 ~ exports.updateMe=catchAsync ~ req file:', req.file);
  console.log('🚀 ~ exports.updateMe=catchAsync ~ req body:', req.body);
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
  const filteredBody = filterObj(req.body, 'name', 'email', 'photo');
  if (req.file) filteredBody.photo = req.file.filename;
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
