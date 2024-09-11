const express = require('express');

const router = express.Router();
const {
  signup,
  login,
  forgotPassword,
  resetPassword,
  updatePassword,
  protect,
  restrict,
} = require('../controllers/authController');
const {
  updateMe,
  deleteMe,
  getUser,
  getMe,
  uploadUserPhoto,
  uploadPhotoToCoudinary,
} = require('../controllers/userController');

router.route('/signup').post(signup);
router.route('/login').post(login);

router.route('/forgot-password').post(forgotPassword);
router.route('/reset-password/:token').patch(resetPassword);

// Protect routes below this middleware
router.use(protect);

router.route('/update-my-password').patch(updatePassword);
router
  .route('/update-me')
  .patch(uploadUserPhoto, uploadPhotoToCoudinary, updateMe);
router.route('/delete-me').delete(deleteMe);
router.route('/me').get(getMe);
router.route('/:userId').get(restrict, getUser);

module.exports = router;
