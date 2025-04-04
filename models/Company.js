const mongoose = require('mongoose');

const CompanySchema = new mongoose.Schema({
    name :{
        type: String,
        required:[true,'Please add aname'],
        unique: true,
        trim:true,
        maxlenght:[50,'Name cannot more than 50 characters']
    },
    address:{
        type:String,
        required:[true ,'Please add an address']
    },
    website:{
        type: String,
        required: [true ,'Please add an website'],
    },
    tel:{
        type:String,
        required:[true,'Please add an telephone number'],
        length:10,
        validate: {
            validator: function (v) {
              return /^\d{10}$/.test(v); // Exactly 10 digits
            },
            message: props => `${props.value} is not a valid telephone number!`,
          },
    },
}, {toJSON:{virtuals:true},toObject:{virtuals:true}});

    CompanySchema.virtual('bookings',{
        ref:'Booking',
        localField:'_id',
        foreignField:'company',
        justOne:false
});
module.exports = mongoose.model('Company',CompanySchema);