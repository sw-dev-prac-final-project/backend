const mongoose = require('mongoose');
const Company = require('./Company');

const BookingSchema = new mongoose.Schema({
  apptDate: {
    type: Date,
    required: [true, 'Please add an appointment date']
  },
  timeSlot: {
    type: String,
    required: [true, 'Please add a time slot'],
    enum: Company.getAvailableTimeSlots()
  },
  company: {
    type: mongoose.Schema.ObjectId,
    ref: 'Company',
    required: [true, 'Please add a company']
  },
  user: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: [true, 'Please add a user']
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Booking', BookingSchema);