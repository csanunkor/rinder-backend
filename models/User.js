const { ObjectId } = require('mongoose');
const mongoose = require('mongoose');
const { isEmail } = require('validator');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const UserSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: [true, 'Please enter a first name'],
      lowercase: true,
    },
    lastName: {
      type: String,
      required: [true, 'Please enter a last name'],
      lowercase: true,
    },
    email: {
      type: String,
      required: [true, 'Please enter an email'],
      unique: true,
      lowercase: true,
      validate: [isEmail, 'Please enter a valid email'],
    },
    phoneNumber: {
      type: String,
      minlength: [10, 'Minimum phone number length is 10 digits'],
    },
    addressStreet: {
      type: String,
    },
    addressCity: {
      type: String,
    },
    addressState: {
      type: String,
    },
    password: {
      type: String,
      required: [true, 'Please enter a password'],
      minlength: [6, 'Minimum password length is 6 characters'],
    },
    role: {
      type: String,
      enum: ['user', 'admin', 'student'],
      default:'user',
      // required: [false, 'Please enter a role (user/admin/student)'],
      lowercase: true,
    },
    dateOfBirth: {
      type: Date,
      // required: [true, 'Please enter a valid date of birth'],
    },
    preferences: {
      type: [String],
    },
    isDisabled: {
      type: Boolean,
      default: false,
    },
    isBanned: {
      type: Boolean,
      default: false,
    },
    ProfilePhoto: {
      type: String, //store a link to the file
    },
    AboutMe: {
      type: String,
    },
    OwnedListings: [{ type: ObjectId, ref: 'listing' }],
    savedListings: [{ type: ObjectId, ref: 'listing' }],
    blockedList: [{ type: ObjectId, ref: 'User' }],
  },
  { timestamps: true }
);

// //fire after doc is saved to db
// userSchema.post('save', function(doc, next) {
//     console.log("new user was created & saved");
//     next();
// });

//fire before doc is saved to db
UserSchema.pre('save', async function (next) {
  const salt = await bcrypt.genSalt();
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// sign jwt and return
UserSchema.methods.getSignedJwtToken = function () {
  return jwt.sign({ id: this._id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE,
  });
};

// match user entered password to hashed password from DB
UserSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// return the user objects given the user ids
UserSchema.statics.getUsersByIds = async function (ids) {
  try {
    return await this.find({ _id: { $in: ids } });
  } catch (error) {
    throw error;
  }
};

// //return the savedListings for a user
// UserSchema.statics.getSavedListings = async function (userId) {
//     try {
//       return this.aggregate([
//         {
//           '$match': {
//             '_id': userId
//           }
//         }, {
//           '$lookup': {
//             'from': 'listings',
//             'localField': 'savedListings',
//             'foreignField': '_id',
//             'as': 'savedListings'
//           }
//         }
//       ]);
//     }
//     catch (error) {
//       throw error;
//     }
//   };

// //static method to login user with either email or phoneNumber
// userSchema.statics.login = async function(email, password) {
//     const user = await this.findOne({email: email});

//     if (user) {
//         const auth = await bcrypt.compare(password, user.password);
//         if (auth) {
//             return user;
//         }
//         throw Error('incorrect password');
//     }
//     throw Error('incorrect email');
// }

// const User = mongoose.model('user', userSchema);

// module.exports = User;

module.exports = mongoose.model('User', UserSchema);
