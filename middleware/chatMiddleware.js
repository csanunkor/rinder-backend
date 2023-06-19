const asyncHandler = require('./async');
const ErrorResponse = require('../utils/errorResponse');
const User = require('../models/User');

exports.checkUsersExist = asyncHandler(async (req, res, next) => {
  const { userIds} = req.body  
  
  try {
    User.find({'_id': { $in: userIds}}).then((data,err) => {
      if (err || data.length != userIds.length) {
        console.log("error: ", err);
        return next(new ErrorResponse('user not found.', 401));    
      }
      next();  
    });
  } catch (err) {
      return next(new ErrorResponse('user not found.', 401));
  }
});
