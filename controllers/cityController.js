const City = require('../models/cityModel');
const APIFeatures = require('../utils/apiFeatures');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');

exports.getAllCities = catchAsync(async (req, res) => {
  let modelQuery;
  if (req.path === '/user') {
    modelQuery = City.find({ user: req.user._id }).select('-__v');
  } else {
    modelQuery = City.find()
      .populate({ path: 'user', select: 'name email' })
      .select('-__v');
  }
  // Execute query
  const features = new APIFeatures(modelQuery, req.query)
    .filter()
    .sort()
    .limit()
    .paginate();

  const cities = await features.query;

  res.status(200).json({
    status: 'success',
    results: cities.length,
    data: {
      cities,
    },
  });
});

exports.getCityById = catchAsync(async (req, res, next) => {
  const city = await City.findById(req.params.id)
    .select('-__v')
    .populate('user');

  if (!city) {
    return next(new AppError("Couldn't find city by provided ID.", 404));
  }

  res.status(200).json({
    status: 'success',
    data: {
      city,
    },
  });
});

exports.addCity = catchAsync(async (req, res) => {
  const city = await City.create(req.body);

  res.status(201).json({
    status: 'success',
    data: {
      city,
    },
  });
});

exports.updateCity = catchAsync(async (req, res, next) => {
  const city = await City.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  if (!city) {
    return next(new AppError("Couldn't find city by provided ID.", 404));
  }

  res.status(200).json({
    status: 'success',
    data: {
      city,
    },
  });
});

exports.deleteCity = catchAsync(async (req, res, next) => {
  const city = await City.findByIdAndDelete(req.params.id);
  if (!city) {
    return next(new AppError("Couldn't find city by provided ID.", 404));
  }

  res.status(204).json({
    status: 'success',
    data: null,
  });
});

exports.findTopVisited = catchAsync(async (req, res) => {
  const citiesTotal = await City.aggregate([
    {
      $group: {
        _id: '$cityName',
        total: { $sum: 1 },
      },
    },
    {
      $sort: { total: -1, _id: 1 },
    },
    { $limit: 10 },
  ]);

  const countriesTotal = await City.aggregate([
    {
      $group: {
        _id: '$country',
        total: { $sum: 1 },
      },
    },
    {
      $sort: { total: -1, _id: 1 },
    },
    { $limit: 10 },
  ]);

  res.status(200).json({
    status: 'success',
    data: {
      // cities: citiesTotal.sort((a, b) => b.total - a.total),
      // countries: countriesTotal.sort((a, b) => b.total - a.total),
      cities: citiesTotal,
      countries: countriesTotal,
    },
  });
});

exports.findTopMonth = catchAsync(async (req, res) => {
  const monthTotal = await City.aggregate([
    {
      $group: {
        _id: { $month: '$arrivalDate' },
        total: { $sum: 1 },
      },
    },
    {
      $sort: { total: -1, _id: 1 },
    },
  ]);

  res.status(200).json({
    status: 'success',
    data: monthTotal,
  });
});
