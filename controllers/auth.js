const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/async');
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

// @desc    Register user
// @route   GET /api/v1/auth/register
// @access  Public
exports.register = asyncHandler(async (req, res, next) => {
  const { firstName, lastName, email, password, role } = req.body;

  // create user
  const user = await User.create({
    firstName,
    lastName,
    email,
    phoneNumber:"1231231231",
    password,
    role,
  });

  sendTokenResponse(user, 200, res);
});

// @desc    Login user
// @route   POST /api/v1/auth/login
// @access  Public
exports.login = asyncHandler(async (req, res, next) => {
  const { firstName, lastName, email, phoneNumber, password, role } = req.body;

  // validate email & password
  if (!email || !password) {
    return next(new ErrorResponse('Please provide an email and password', 400));
  }

  // check for user
  const user = await User.findOne({ email }).select('+password');

  if (!user) {
    return next(new ErrorResponse('Invalid credentials', 401));
  }

  // check if password matches
  const isMatch = await user.matchPassword(password);

  if (!isMatch) {
    return next(new ErrorResponse('Invalid credentials', 401));
  }

  sendTokenResponse(user, 200, res);
});

// get token from model, create cookie and send response
const sendTokenResponse = (user, statusCode, res) => {
  // create token
  const token = user.getSignedJwtToken();

  const options = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRE * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
  };

  if (process.env.NODE_ENV === 'production') {
    options.secure = true;
  }

  res
    .status(statusCode)
    .cookie('token', token, options)
    .json({ success: true, userId: user.id });
};

// @desc    Get current logged in user
// @route   GET /api/v1/auth/me
// @access  Private
exports.getMe = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user.id);

  res.status(200).json({
    success: true,
    data: user,
  });
});

// @desc    Update user details
// @route   PUT /api/v1/auth/updatedetails
// @access  Private
exports.updateDetails = asyncHandler(async (req, res, next) => {
  const fieldsToUpdate = {
    firstName: req.body.firstName,
    lastName: req.body.lastName,
    email: req.body.email,
    phoneNumber: req.body.phoneNumber,
    adressStreet: req.body.addressStreet,
    addressCity: req.body.addressCity,
    addressState: req.body.addressState,
    preferences: req.body.preferences,
  };

  const user = await User.findByIdAndUpdate(req.user.id, fieldsToUpdate, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({
    success: true,
    data: user,
  });
});

// @desc signout the user
exports.signout = asyncHandler(async (req, res, next) => {
  res.cookie('token', '', {maxAge: 1});
  res.status(200).json({
    success: true
  });
});


exports.resetpassword = asyncHandler(async (req, res, next) => {
  try {
    const {_id, oldPassword, newPassword} = req.body;
    const salt = await bcrypt.genSalt();
    const newHash = await bcrypt.hash(newPassword, salt);
    const update = { password: newHash }

    // check for user
    const user = await User.findOne({ _id }).select('+password');
    // check if password matches
    const isMatch = await user.matchPassword(oldPassword);

    if (isMatch) {
      const updatedUser = await User.findOneAndUpdate({ _id }, update, {
        new: true
      });
      res.status(200).json({
        success:true,
        data:updatedUser
      });
    }
    else {
      res.status(403).json({
        success:false,
        error: "Invalid password"
      });
    }
  }
  catch (err) {
    res.status(400).json({
      success:false,
      error: err
    });
  }
});
