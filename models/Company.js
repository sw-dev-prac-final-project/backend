const mongoose = require('mongoose');

// Define available time slots
const AVAILABLE_TIME_SLOTS = [
  '09:00-10:00',
  '10:00-11:00',
  '11:00-12:00',
  '12:00-13:00',
  '13:00-14:00',
  '14:00-15:00',
  '15:00-16:00',
  '16:00-17:00'
];

const BookedSlotSchema = new mongoose.Schema({
  date: {
    type: Date,
    required: true
  },
  timeSlot: {
    type: String,
    required: true,
    enum: AVAILABLE_TIME_SLOTS
  }
}, { _id: false });

const CompanySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please add a name'],
    unique: true,
    trim: true,
    maxlength: [50, 'Name cannot be more than 50 characters']
  },
  description: {
    type: String,
    maxlength: [500, 'Description cannot be more than 500 characters']
  },
  address: {
    type: String,
    required: [true, 'Please add an address']
  },
  website: {
    type: String,
    required: [true, 'Please add a website'],
  },
  tel: {
    type: String,
    required: [true, 'Please add a telephone number'],
    minlength: 9,
    maxlength: 10,
  },
  bookedSlots: [BookedSlotSchema]
}, { toJSON: { virtuals: true }, toObject: { virtuals: true } });

// Add virtual for bookings
CompanySchema.virtual('bookings', {
  ref: 'Booking',
  localField: '_id',
  foreignField: 'company',
  justOne: false
});

// Static method to get all available time slots
CompanySchema.statics.getAvailableTimeSlots = function() {
  return AVAILABLE_TIME_SLOTS;
};

module.exports = mongoose.model('Company', CompanySchema);