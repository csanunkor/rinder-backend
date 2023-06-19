const { Router } = require('express');
const listingController = require('../controllers/listingController.js');

const router = Router();

router.get('/createListing', listingController.createListing_get);
router.post('/createListing', listingController.createListing_post);
router.post('/deleteListing', listingController.deleteListing);
router.post('/modifyListing', listingController.modifyListing);

module.exports = router;