const mongoose = require('mongoose');

const CompanySchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please add aname'],
        unique: true,
        trim: true,
        maxlenght: [50, 'Name cannot more than 50 characters']
    },
    address: {
        type: String,
        required: [true, 'Please add an address']
    },
    website: {
        type: String,
        required: [true, 'Please add an website'],
    },
    tel: {
        type: String,
        required: [true, 'Please add an telephone number'],
        minlength: 9,
        maxlength: 10,
    },
    bookedTime: {
        type: Array,
        default: [],
    },
}, { toJSON: { virtuals: true }, toObject: { virtuals: true } });

    CompanySchema.virtual('bookings',{
        ref:'Booking',
        localField:'_id',
        foreignField:'company',
        justOne:false
});
module.exports = mongoose.model('Company',CompanySchema);