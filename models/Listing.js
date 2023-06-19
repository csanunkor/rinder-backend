const mongoose = require('mongoose');
const { ObjectId } = require('mongoose');

const listingSchema = new mongoose.Schema({
  Amenities: {
    type: Array,
  },
  city: {
    type: String,
  },
  title: {
    type: String,
  },
  state: {
    type: String,
  },
  street: {
    type: String,
  },
  zipCode: {
    type: String,
  },
  description: {
    type: String,
  },
  createdBy: { type: ObjectId },
  location: {
    type: { type: String, default: 'Point' },
    coordinates: Array,
  },
  numberOfBeds: {
    type: Number,
  },
  squareFt: {
    type: Number,
  },
  price: {
    type: Number,
  },
  status: {
    type: String,
    enum: ['AVAILABLE', 'CLOSED', 'DELETED'],
  },
  occupancy: {
    type: String,
    enum: ['PRIVATE_ROOM', 'SHARED_ROOM'],
    default: 'PRIVATE_ROOM'
  },
  images: {
    type: Array,
  },
  inclusions: Array, //['SMOKER','NON_SMOKER','GUESTS_ALLOWED','GUESTS_NOT_ALLOWED','PETS_ALLOWED','PETS_NOT_ALLOWED'],
}, {
  timestamps: true
});

const Listing = mongoose.model('listing', listingSchema);

module.exports = Listing;
