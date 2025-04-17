const mongoose = require('mongoose');
const { stringify } = require('qs');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const UserSchema = new mongoose.Schema({
    name:{
        type:String,
        required:[true,'Please add a name']
    },
    email:{
        type:String,
        required:[true,'Please add an email'],
        unique : true,
        match: [
            /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
            'Please add a valid email'
        ]
    },
    role :{
        type : String,
        enum:['user','admin'],
        default: 'user'
    },
    password:{
        type:String,
        required:[true,'please add a password'],
        minlenght : 6,
        select: false
    },
    tel:{
        type:String,
        required:[true,'Please add an telephone number'],
        minlength:9,
        maxlength:10,
        unique : true
    },
    resetPasswordToken : String,
    resetPasswordExpire : Date,
    createdAt:{
        type: Date,
        default:Date.now
    }
});

//Encrypt password using bcrypt
UserSchema.pre('save',async function (next) {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password,salt);
});

UserSchema.methods.getSignedJwtToken = function(){
    return jwt.sign({id:this.id},process.env.JWT_SECRET,{
        expiresIn : process.env.JWT_EXPIRE
    });
}

UserSchema.methods.matchPassword = async function(enteredPassword){
    return await bcrypt.compare(enteredPassword,this.password);
}

module.exports = mongoose.model('User',UserSchema);