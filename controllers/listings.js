const asyncHandler = require('../middleware/async');
const Listing = require('../models/Listing');
const User = require('../models/User');
const { ObjectId } = require('mongodb');
const aws = require('aws-sdk');
const s3service = require('../Utils/S3service');

// @desc    Get all listings
// @route   GET /api/v1/listings
// @access  Public
exports.getListings = asyncHandler(async (req, res, next) => {
  let query;

  // Fields to exclude
  const removeFields = ['select', 'sort', 'page', 'limit'];

  // applying filters

  let queryParams = {}
  
    if (req.query.city && req.query.city != '' && req.query.city != 'null')
      queryParams['city'] = req.query.city
  
    if (req.query.state && req.query.state != '' && req.query.state != 'null')
      queryParams['state'] = req.query.state
  
    if (req.query.beds && req.query.beds != '' && req.query.beds != 'null')
      queryParams['numberOfBeds'] = req.query.beds
  
    if (req.query.area && !isNaN(req.query.area))
      queryParams['squareFt'] = { $gte: Number(req.query.area) }
  
    if (req.query.occupancy && req.query.occupancy && req.query.occupancy != 'null')
      queryParams['occupancy'] = req.query.occupancy
  
    if (req.query.amenities &&  req.query.amenities != '' && req.query.amenities != 'null')
      queryParams['Amenities'] = { $in: req.query.amenities.toString().split(',') }
  
    if (req.query.inclusions &&  req.query.inclusions != '' && req.query.inclusions != 'null')
      queryParams['inclusions'] = { $in: req.query.inclusions.toString().split(',') }
  
    if (req.query.zip && req.query.zip != '')
      queryParams['zipCode'] = req.query.zip
  
    if (req.query.minPrice && req.query.maxPrice) {
      queryParams['price'] = { $gte: req.query.minPrice, $lte: req.query.maxPrice }
    } else if (!req.query.minPrice && req.query.maxPrice) {
      queryParams['price'] = { $lte: req.query.maxPrice }
    } else if (req.query.minPrice && !req.query.maxPrice) {
      queryParams['price'] = { $gte: req.query.minPrice }
    }

console.log(queryParams)

  // Find resource
  query = Listing.find(queryParams);

  // SELECT FIELDS; only executes if select is included
  if (req.query.select) {
    const fields = req.query.select.split(',').join(' ');
    query = query.select(fields);
  }

  // Sort
  if (req.query.sort) {
    const sortBy = req.query.sort.split(',').join(' ');
    query = query.sort(sortBy);
  } else {
    query = query.sort('-createdAt');
  }

  // Pagination
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 6;
  const startIndex = (page - 1) * limit;
  const endIndex = page * limit;
  const total = await Listing.countDocuments();

  query = query.skip(startIndex).limit(endIndex);

  // Execute query
  const listings = await query;

  // Pagination result
  const pagination = {};

  if (endIndex < total) {
    pagination.next = {
      page: page + 1,
      limit,
    };
  }

  if (startIndex > 0) {
    pagination.prev = {
      page: page - 1,
      limit,
    };
  }

  res.status(200).json({
    success: true,
    count: listings.length,
    pagination: pagination,
    data: listings,
  });
});


// @desc    Get single listing
// @route   GET /api/listings/:id
// @access  Public
exports.getListing = asyncHandler(async (req, res, next) => {
  const listing = await Listing.findById(req.params.id);

  res.status(200).json({
    success: true,
    data: listing,
  });
});

// @desc    Create new listing
// @route   POST /api/listings
// @access  Private
exports.createListing = asyncHandler(async (req, res, next) => {
    try {
      const listing = await Listing.create(req.body);

      const user = await User.findOneAndUpdate(
        { _id: req.body.createdBy },
        {
          $push: { OwnedListings: listing._id },
          function(error, success) {
            if (error) {
              console.log(error);
            } else {
              console.log(success);
            }
          },
        },
        { new: true }
      );

      if (!user || !listing) {
        return next(
          new ErrorResponse(`Failed to create Listing.`, 404)
        );
      }

      res.status(200).json({ success: true, data: listing });
    } catch (err) {
      next(err);
    }
  });


// @desc    Update listing
// @route   PUT /api/v1/listings/:id
// @access  Private
exports.updateListing = asyncHandler(async (req, res, next) => {
  const listing = await Listing.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  if (!listing) {
    return res.status(400).json({ success: false });
  }

  res.status(200).json({ success: true, data: listing });
});


exports.getListingImages = (req, res) => {
  Listing.findById(req.params.listingId, { images: 1, _id: 0 }, (err, data) => {
    if (err) {
      return res.status(500).json({ error: true, Message: err });
    }
    return res.status(200).json({ success: true, data });
  });
}

/**
 * remove listing image from s3 and from mongo
 */
exports.deleteListingImage = (req, res) => {
  const { link } = req.body;
  //only need item name that exists in bucket, not the entire link.
  const key = link.substring(link.lastIndexOf("amazonaws.com/") + 14);
  s3service.removeS3Object(key, async () => {
    await Listing.findByIdAndUpdate(req.params.listingId, { $pull: { images: link } });
    return res.status(200).json({ success: true });
  });
}

/**
 * input: upload a jpg to s3
 * output, the url to the image
 */
exports.uploadListingImage = async (req, res) => {

  const key = req.userId + "-listing-" + Date.now();
  const file = req.files.submittedImage;
  const listingId = req.params.listingId;

  s3service.uploadS3Object(key, file, (data) => {
    Listing.findByIdAndUpdate(listingId, { $push: { images: data.Location } }, (err, doc) => {
      if (err) {
        return res.status(500).json({ error: true, Message: err });
      }
      return res.status(200).json({ success: true, url: data.Location });
    });
  });
}

// @desc    Delete listing
// @route   DELETE/api/v1/listings/:id
// @access  Private
exports.deleteListing = async (req, res, next) => {
  try {
    const listingId = req.params.listingId;

    const deletedListing = await Listing.deleteOne({
      _id: ObjectId(listingId),
    });


    if (req.query && req.query.deletedBy) {
      let user = await User.findById(req.query.deletedBy)
      if (user) {
        console.log(user.OwnedListings.length)
        if (user.OwnedListings && Array.isArray(user.OwnedListings)) {
          user.OwnedListings = user.OwnedListings.filter((list) => list.toString() != req.params.listingId)

        await User.update({ _id: user._id }, { $set: { OwnedListings: user.OwnedListings } })

        }
        console.log(user.OwnedListings.length)


      }
    }

    return res.status(200).json({
      success: true,
      msg: `Listing Removed ${listingId}`,
      deletedListingCount: deletedListing.deletedCount,
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error });
  }
};
