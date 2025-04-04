const Booking = require('../models/Booking');
const Company = require('../models/Company');
const sendConfirmationEmail = require("../utils/email");

exports.getBookings = async (req, res,next) => {
    let query;

    if(req.user.role!='admin'){
        query = Booking.find({user:req.user.id}).populate({
            path:'company',
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
        const companyID = req.body.company;

        const company = await Company.findById(companyID);
        if(!company){
            return res.status(404).json({
                success: false,
                error: 'No company found',
            });
        }

        // Extract apptDate from req.body
        const apptDate = req.body.apptDate;

        // Check if the appointment date already exists in the company's bookedTime
        if (company.bookedTime.includes(apptDate)) {
            return res.status(400).json({
                success: false,
                message: `The appointment date ${apptDate} is already booked for this company.`,
            });
        }

        const userId = req.user.id;
        const existedBooking = await Booking.find({user:userId});

        if(existedBooking.length >= 3 && req.user.role != 'admin'){
            return res.status(400).json({
                success: false,
                message: `The user with ID ${req.user.id} has already made 3 bookings.`,
            });
        }

        const allowedFields = ['apptDate', 'company'];
        const sanitizedBody = {"user": userId};
        allowedFields.forEach(field => {
            if (req.body[field] !== undefined) {
                sanitizedBody[field] = req.body[field];
            }
        });
        const booking = await Booking.create(sanitizedBody);

        company.bookedTime.push(booking.apptDate);
        await company.save();

        //send confirmation email
        await sendConfirmationEmail(req.user.email, req.user.name, booking, company);

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

        // Store the old appointment date and company before making any changes
        const oldApptDate = booking.apptDate;
        const oldCompany = await Company.findById(booking.company);

        // Check if a new apptDate is provided and if the new apptDate is already booked for the new company
        const newApptDate = req.body.apptDate;
        let newCompany = null;

        if (newApptDate) {
            newCompany = await Company.findById(req.body.company);

            if (newCompany) {
                // Check if the new apptDate is already taken by the new company
                if (newCompany.bookedTime.includes(newApptDate)) {
                    return res.status(400).json({
                        success: false,
                        message: `The appointment date ${newApptDate} is already booked for this company.`,
                    });
                }
            }
        }

        // If the apptDate is being updated or if the company is being changed, remove the old apptDate from the old company
        if (oldCompany && oldApptDate) {
            oldCompany.bookedTime = oldCompany.bookedTime.filter(
                date => date.toISOString() !== oldApptDate.toISOString()
            );
            await oldCompany.save();
        }

        // Update the booking with the new data
        const updatedData = req.body;
        booking = await Booking.findByIdAndUpdate(req.params.id, updatedData, {
            new: true,
            runValidators: true,
        });

        // If the appointment date or company was changed, add the new apptDate to the new company's bookedTime
        if (newCompany && newApptDate) {
            newCompany.bookedTime.push(newApptDate);
            await newCompany.save();
        }

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
};

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
        await Booking.deleteOne({ _id: req.params.id });
        
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

