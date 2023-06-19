const express = require('express');
const { cookieAuth} = require('../middleware/authMiddleware');
const multer = require("multer");
const storage = multer.memoryStorage();
const upload = multer({storage: storage });

const {
  getListings,
  getListing,
  createListing,
  updateListing,
  deleteListing,
  uploadListingImage,
  getListingImages,
  deleteListingImage,
} = require('../controllers/listings');

const router = express.Router();

router.get('/getListings', getListings);
router.get('/getListing/:id', getListing);
router.post('/createListing', createListing);
router.put('/updateListing/:id', updateListing);
router.post('/deleteListing/:listingId', deleteListing);
router.post('/setListingImage/:listingId', cookieAuth, upload.single('submittedImage'), uploadListingImage);
router.get('/getListingImages/:listingId', cookieAuth, getListingImages);
router.post('/deleteListingImage/:listingId', cookieAuth, deleteListingImage);
module.exports = router;
