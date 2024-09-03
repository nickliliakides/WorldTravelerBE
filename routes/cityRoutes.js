const express = require('express');
const {
  addCity,
  getAllCities,
  getCityById,
  updateCity,
  deleteCity,
  findTopVisited,
  findTopMonth,
  // getAllCitiesByUser,
} = require('../controllers/cityController');
const { protect, restrict } = require('../controllers/authController');

const router = express.Router();

router.route('/top-visited').get(findTopVisited);
router.route('/top-month').get(findTopMonth);

// Protect routes below this middleware
router.use(protect);

router.route('/').get(getAllCities).post(addCity);

router.route('/user').get(getAllCities);

router
  .route('/:id')
  .get(getCityById)
  .patch(restrict, updateCity)
  .delete(restrict, deleteCity);

module.exports = router;
