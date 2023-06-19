const jwt = require('jsonwebtoken');
const asyncHandler = require('./async');
const ErrorResponse = require('../utils/errorResponse');
const User = require('../models/User');

exports.requireAuth = asyncHandler(async (req, res, next) => {
    let token = req.cookies.token;
    if (!token) {
        return next(new ErrorResponse('Not authorized to access this route', 401));
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        console.log(decoded);


        req.user = await User.findById(decoded.id);

        next();
    }
    catch (err) {
        return next(new ErrorResponse('Not authorized to access this route', 401));
    }
});

exports.cookieAuth = asyncHandler(async (req, res, next) => {
    let token = req.cookies['token'];
    // make sure token exists
    if (!token) {
      return next(new ErrorResponse('Not authorized to access this route', 401));
    }
    try {
      // verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      console.log(decoded);
      const user = await User.findById(decoded.id);
      req.userId = user.id;
      next();
    } catch (err) {
      return next(new ErrorResponse('Not authorized to access this route', 401));
    }
});


// exports.tokenAuth = asyncHandler(async (req, res, next) => {
//   const token = req.params.token;

//   if (!token) {
//     return next(new ErrorResponse('Not authorized to access this route', 401));
//   }
//   try {
//     const user = await User.findById(token);
//     req.userId = user.id;
//     next();
//   } catch (err) {
//     return next(new ErrorResponse('Not authorized to access this route', 401));
//   }
// });
