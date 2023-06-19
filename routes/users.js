const express = require('express');
const { 
  getUsers, 
  getUser, 
  updateUser, 
  forgotPassword, 
  resetPasswordLink, 
  setPassword, 
  getSavedListings, 
  getOwnerId,
  removeSavedListing,
  addSavedListing,
  setProfilePicture,
  getProfilePicture,
  deleteProfilePicture,
  blockUser
} = require('../controllers/users');

const multer = require("multer");
const router = express.Router();
const { cookieAuth } = require('../middleware/authMiddleware');
const storage = multer.memoryStorage();
const upload = multer({storage: storage });

router.route('/').get(getUsers);
router.route('/:id').get(getUser).put(updateUser);
router.route('/forgotPassword').post(forgotPassword);
router.route('/resetPassword/:userId/:token').get(resetPasswordLink);
router.route('/setPassword').post(setPassword);
router.route('/getSavedListings/:userId').get(getSavedListings);
router.get('/getOwnerId/:listingId', getOwnerId);

router.route('/addSavedListing/:id').put(addSavedListing);
router.route('/removeSavedListing/:id').put(removeSavedListing);
router.get('/blockUser/:userId/:token', blockUser);
router.post('/setProfilePicture', cookieAuth, upload.single('submittedImage'), setProfilePicture);
router.get('/getProfilePicture/link', cookieAuth, getProfilePicture);
router.post('/deleteProfilePicture', cookieAuth, deleteProfilePicture);

module.exports = router;
