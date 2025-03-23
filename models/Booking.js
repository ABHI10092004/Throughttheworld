const mongoose = require('mongoose');

const BookingSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'user',
    required: true
  },
  type: {
    type: String,
    enum: ['flight', 'car', 'bus', 'train', 'hotel'],
    required: true
  },
  details: {
    // For flights
    flightNumber: { type: String },
    airline: { type: String },
    
    // For all transportation
    departure: {
      location: { type: String },
      date: { type: Date },
      time: { type: String }
    },
    arrival: {
      location: { type: String },
      date: { type: Date },
      time: { type: String }
    },
    
    // For cars
    carType: { type: String },
    pickupLocation: { type: String },
    dropoffLocation: { type: String },
    
    // For hotels
    hotelName: { type: String },
    checkIn: { type: Date },
    checkOut: { type: Date },
    roomType: { type: String },
    guests: { type: Number }
  },
  price: {
    amount: { type: Number, required: true },
    currency: { type: String, default: 'USD' }
  },
  status: {
    type: String,
    enum: ['confirmed', 'pending', 'cancelled'],
    default: 'confirmed'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = Booking = mongoose.model('booking', BookingSchema); 