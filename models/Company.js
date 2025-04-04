const mongoose = require('mongoose');

const CompanySchema = new mongoose.Schema({
    name :{
        type: String,
        require:[true,'Please add aname'],
        unique: true,
        trim:true,
        maxlenght:[50,'Name cannot more than 50 characters']
    },
    address:{
        type:String,
        require:[true ,'Please add an address']
    },
    website:{
        type: String,
        required: [true ,'Please add an website'],
    },
    tel:{
        type:String
    },
})
module.exports = mongoose.model('Company',CompanySchema);