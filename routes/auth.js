const express = require('express');
const {
  register,
  login,
  getMe,
  updateDetails,
  resetpassword,
  signout
  //   updatePreferences,
} = require('../controllers/auth');

const router = express.Router();

const { requireAuth } = require('../middleware/authMiddleware');

router.post('/register', register);
router.post('/login', login);
router.get('/me', requireAuth, getMe);
router.put('/updatedetails', requireAuth, updateDetails);
router.post('/resetpassword', resetpassword);
router.get('/signout', signout);
// router.put('/updatepreferences', protect, updatePreferences);

module.exports = router;
