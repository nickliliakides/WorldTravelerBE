const multer = require('multer');

const User = require('../models/userModel');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');
const { handleImageUpload } = require('../utils/cloudinaryConfig');
const Email = require('../utils/email');

const multerStorage = multer.memoryStorage();

const multerFilter = (req, file, cb) => {
  if (file.originalname === 'undefined') cb(null, false);
  else if (file.mimetype.startsWith('image')) {
    cb(null, true);
  } else {
    cb(
      new AppError('File is not an image. Only image files are accepted.', 400),
      false,
    );
  }
};

const upload = multer({
  storage: multerStorage,
  fileFilter: multerFilter,
});

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

exports.uploadPhotoToCoudinary = catchAsync(async (req, res, next) => {
  if (!req.file || (req.file && req.file.originalname === 'undefined'))
    return next();

  const b64 = Buffer.from(req.file.buffer).toString('base64');
  const dataURI = `data:${req.file.mimetype};base64,${b64}`;
  const cldRes = await handleImageUpload(dataURI);
  req.file.filename = cldRes.secure_url;
  next();
});

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
  const filteredBody = filterObj(req.body, 'name', 'email', 'photo');

  if (req.file && req.file.filename) filteredBody.photo = req.file.filename;
  else filteredBody.photo = undefined;

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

exports.emailReceive = catchAsync(async (req, res, next) => {
  if (
    !req.body.name ||
    !req.body.email ||
    !req.body.message ||
    !req.body.subject
  ) {
    return next(new AppError('Not valid contact data!', 400));
  }

  const user = {
    name: req.body.name,
    email: req.body.email,
  };

  await new Email(
    user,
    req.body.message,
    null,
    false,
    req.body.subject,
  ).receiveMessage();

  res.status(200).json({
    status: 'success',
    message: 'Message sent successfully!',
  });
});
