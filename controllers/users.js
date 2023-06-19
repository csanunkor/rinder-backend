const ErrorResponse = require('../utils/errorResponse');
const Email = require('../Utils/Emailer');
const User = require('../models/User');
const Listing = require('../models/Listing');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

const { ObjectId } = require('mongodb');
const aws = require('aws-sdk');
const s3service = require('../Utils/S3service');

// @desc    Get all users
// @route   GET /api/users
// @access  Public
exports.getUsers = async (req, res, next) => {
  try {
    const users = await User.find();

    res.status(200).json({ success: true, count: users.length, data: users });
  } catch (err) {
    next(err);
  }
};

// @desc    Get single user by id
// @route   GET /api/user/:id
// @access  Public
exports.getUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id)
      .populate('OwnedListings')
      .populate('blockedList')
      .populate('savedListings');

    if (!user) {
      return next(
        new ErrorResponse(`User not found with id of ${req.params.id}`, 404)
      );
    }

    res.status(200).json({ success: true, data: user });
  } catch (err) {
    next(err);
  }
};

/**
 *
 * @param {*} req
 * @param {*} res
 * @param {*} next
 */
exports.getOwnerId = async (req, res, next) => {
  try {
    let listingId = req.params.listingId;

    const filter = {
      OwnedListings: {
        $elemMatch: {
          $eq: new ObjectId(listingId),
        },
      },
    };

    if (listingId) {
      const user = await User.findOne(filter, { _id: 1 });
      if (user) {
        res.status(200).json({ success: true, data: user });
      } else {
        return next(
          new ErrorResponse(
            `No owner found for listing with id of ${listingId}`,
            404
          )
        );
      }
    } else {
      return next(new ErrorResponse(`No listing provided`, 400));
    }
  } catch (err) {
    next(err);
  }
};

/**
 * Sends a reset password link to the given email.
 * link contains userid and a temporary json web token
 * upon clicking link, directs user to backend resetPassword GET api
 */
exports.forgotPassword = async (req, res, next) => {
  try {
    //no token since user is logged out. if the user had a token, he'd be logged in.
    const { email } = req.body;
    if (email) {
      const user = await User.findOne({ email });
      if (user) {
        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
          expiresIn: process.env.JWT_EXPIRE,
        });

        const link = `http://localhost:${process.env.PORT}/api/users/resetPassword/${user._id}/${token}`;

        await Email.sendEmail(
          email,
          `${user.firstName} Rinder Password Reset`,
          link
        );

        res.status(200).json({
          success: true,
          message: 'password reset link sent to your email account.',
        });

        //verify the token and allow them to create a new password.
      } else {
        res.status(500).json({
          success: false,
          error: 'No user associated with given email.',
        });
      }
    } else {
      res.status(500).json({ success: false, error: 'no email provided.' });
    }
  } catch (err) {
    console.log('error:', err);
    next(err);
  }
};

/**
 *
 * This is where the link takes the user when clicked.
 * Stores the jwt to the user's browser
 * verify that the jwt is valid and redirect the user to the resetPassword forms page.
 */
exports.resetPasswordLink = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.userId);

    const decoded = jwt.verify(req.params.token, process.env.JWT_SECRET);

    if (user && decoded) {
      //store the token for 15 minutes
      res.cookie('rinder_reset_token', req.params.token, {
        maxAge: 1000 * 60 * 15,
        httpOnly: false,
      });

      //redirect user
      res.send(
        '<script> window.location.href="http://localhost:3000/resetforgot"; </script>'
      );
    }
  } catch (err) {
    next(err);
  }
};

//take a user and password and set the new password
exports.setPassword = async (req, res) => {
  try {
    //decode the token, verify it,
    const decoded = jwt.verify(
      req.cookies.rinder_reset_token,
      process.env.JWT_SECRET
    );

    //TO DO: protect this route, encrypt password
    const { password } = req.body;

    //encrypt password
    const salt = await bcrypt.genSalt();
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await User.findByIdAndUpdate(decoded.id, {
      password: hashedPassword,
    });

    return res.status(200).json({ success: true, userId: user._id });
  } catch (err) {
    return res.status(500).json({ success: false, error: err });
  }
};

/**
 * remove image from s3 and from mongo
 * @param {*} req
 * @param {*} res
 */
exports.deleteProfilePicture = (req, res) => {
  const { link } = req.body;

  //only need item name that exists in bucket, not the entire link.
  const key = link.substring(link.lastIndexOf('amazonaws.com/') + 14);

  s3service.removeS3Object(key, async () => {
    await User.findByIdAndUpdate(req.userId, { $unset: { ProfilePhoto: '' } });
    return res.status(200).json({ success: true });
  });
};

exports.getProfilePicture = (req, res) => {
  User.findById(req.userId, { ProfilePhoto: 1, _id: 0 }, (err, data) => {
    if (err) {
      return res.status(500).json({ error: true, Message: err });
    }
    return res.status(200).json({ success: true, data });
  });
};

/** stores the photo image into s3 and stores the link in mongodb */
exports.setProfilePicture = async (req, res) => {
  //generate a unique key
  const key = req.userId + '-profile-picture-' + Date.now();
  const file = req.files.submittedImage;

  s3service.uploadS3Object(key, file, async (data) => {
    const user = await User.findByIdAndUpdate(req.userId, {
      ProfilePhoto: data.Location,
    });
    return res.status(200).json({ success: true, url: user.ProfilePicture });
  });
};


exports.getSavedListings = async (req, res) => {
  try {
    const user = await User.findById(req.params.userId).select('savedListings');

    const savedListings = user.savedListings;

    var listings = [];

    for (var i = 0; i < savedListings.length; i++) {
      var currentListing = savedListings[i];
      currentListing = await Listing.findById(currentListing);
      listings.push(currentListing);
    }

    console.log(listings);

    return res.status(200).json({ success: true, data: listings });
  } catch (err) {
    return res.status(500).json({ success: false, error: err });
  }
};

// @desc    Update user
// @route   PUT /api/users/:id
// @access  Private
exports.updateUser = async (req, res, next) => {
  try {
    const user = await User.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!user) {
      return next(
        new ErrorResponse(`User not found with id of ${req.params.id}`, 404)
      );
    }

    res.status(200).json({ success: true, data: user });
  } catch (err) {
    next(err);
  }
};

// @desc    Add listing to saved listings
// @route   PUT /api/users/addSavedListing/:id
// @access  Private
exports.addSavedListing = async (req, res, next) => {
  try {
    const user = await User.findOneAndUpdate(
      { _id: req.params.id },
      {
        $push: { savedListings: req.body._id },
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

    if (!user) {
      return next(
        new ErrorResponse(`User not found with id of ${req.params.id}`, 404)
      );
    }

    res.status(200).json({ success: true, data: user });
  } catch (err) {
    next(err);
  }
};

// @desc    Remove listing from savedListings
// @route   PUT /api/users/removeSavedListing:id
// @access  Private
exports.removeSavedListing = async (req, res, next) => {
  try {
    const user = await User.findOneAndUpdate(
      { _id: req.params.id },
      {
        $pull: { savedListings: req.body._id },
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

    if (!user) {
      return next(
        new ErrorResponse(`User not found with id of ${req.params.id}`, 404)
      );
    }
    res.status(200).json({ success: true, data: user });
  } catch (err) {
    next(err);
  }
};

// @desc    Block user
// @route   GET /api/v1/users/blockUser/:userId/:token
// @access  Private
exports.blockUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.token);

    if (!user) {
      return next(
        new ErrorResponse(`User not found with id of ${req.params.token}`, 404)
      );
    }

    const userAlreadyBlocked = user.blockedList.find((element) => {
      return element.toString() == req.params.userId.toString();
    });

    if (userAlreadyBlocked) {
      // remove the user from blocked list
      user.blockedList = user.blockedList.filter((element) => {
        return element.toString() !== req.params.userId.toString();
      });
    } else {
      // add the user into blocked list
      user.blockedList.push(ObjectId(req.params.userId));
    }

    await user.save();

    res.status(200).json({ success: true, data: user });
  } catch (err) {
    next(err);
  }
};
