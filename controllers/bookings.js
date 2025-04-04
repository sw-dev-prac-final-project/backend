const Booking = require('../models/Booking');
const Company = require('../models/Company');

exports.getBookings = async (req, res,next) => {
    let query;

    if(req.user.role!='admin'){
        query = Company.find({user:req.user.id}).populate({
            path:'bookings',
            select:'name address tel website',
        }); 
    }else{
        if(req.params.companyID){
            console.log(req.params.companyID);
            query = Booking.find({company:req.params.companyID}).populate({
                path:'company',
                select:'name address tel website',
            });
        }else{
            query = Booking.find().populate({
                path:'company',
                select:'name address tel website',
            });
        }
    }

    try {
        const bookings = await query;
        return res.status(200).json({
            success: true,
            count: bookings.length,
            data: bookings,
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            error: 'Server Error',
        });
    }
}

exports.getBooking = async (req, res, next) => {
    try {
        const booking = await Booking.findById(req.params.id).populate({
            path:'company',
            select:'name address tel website',
        });
        if (!booking) {
            return res.status(404).json({
                success: false,
                error: 'No booking found',
            });
        }
        return res.status(200).json({
            success: true,
            data: booking,
        });
    }
    catch (error) {
        console.error(error);
        return res.status(500).json({
            success: false,
            error: 'Server Error',
        });
    }
}

exports.addBooking = async (req, res, next) => {
    try{
        req.body.company = req.params.companyID;

        const company = await Company.findById(req.params.companyID);
        if(!company){
            return res.status(404).json({
                success: false,
                error: 'No company found',
            });
        }
        req.body.user = req.user.id;
        const existedBooking = await Booking.findOne({user:req.user.id});

        if(existedBooking >= 3 && req.user.role != 'admin'){
            return res.status(400).json({
                success: false,
                message: `The user with ID ${req.user.id} has already made 3 bookings.`,
            });
        }

        const booking = await Booking.create(req.body);
        return res.status(201).json({
            success: true,
            data: booking,
        });
    }catch (error) {
        console.error(error);
        return res.status(500).json({
            success: false,
            error: 'Cannot Create Booking',
        });
    }
}

exports.updateBooking = async (req, res, next) => {
    try {
        let booking = await Booking.findById(req.params.id);
        if (!booking) {
            return res.status(404).json({
                success: false,
                error: 'No booking found',
            });
        }
        if (booking.user.toString() !== req.user.id && req.user.role !== 'admin') {
            return res.status(401).json({
                success: false,
                error: 'Not authorized to update this booking',
            });
        }
        booking = await Booking.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true,
        });
        return res.status(200).json({
            success: true,
            data: booking,
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            success: false,
            message: 'Cannot update booking',
        });
    }
}

exports.deleteBooking = async (req, res, next) => {
    try {
        const booking = await Booking.findById(req.params.id);
        if (!booking) {
            return res.status(404).json({
                success: false,
                error: 'No booking found',
            });
        }
        if (booking.user.toString() !== req.user.id && req.user.role !== 'admin') {
            return res.status(401).json({
                success: false,
                error: 'Not authorized to delete this booking',
            });
        }
        await booking.remove();
        return res.status(200).json({
            success: true,
            data: {},
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            success: false,
            message: 'Cannot delete booking',
        });
    }
}

