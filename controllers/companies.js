const Company = require('../models/Company');
const Booking = require('../models/Booking');

exports.getCompanies = async (req, res) => {
    try {
        let query;

        const reqQuery = { ...req.query };
        const removeFields = ['select', 'sort', 'page', 'limit'];

        removeFields.forEach((param) => delete reqQuery[param]);
        console.log(reqQuery);

        let queryStr = JSON.stringify(reqQuery);
        queryStr = queryStr.replace(/\b(gt|gte|lt|lte|in)\b/g, match => `$${match}`);

        query = Company.find(JSON.parse(queryStr)).populate('bookings');

        if (req.query.select) {
            const fields = req.query.select.split(',').join(' ');
            query = query.select(fields);
        }

        if (req.query.sort) {
            const sortBy = req.query.sort.split(',').join(' ');
            query = query.sort(sortBy);
        } else {
            query = query.sort('-createdAt');
        }

        const page = parseInt(req.query.page, 10) || 1;
        const limit = parseInt(req.query.limit, 10) || 25;
        const startIndex = (page - 1) * limit;
        const endIndex = page * limit;
        const total = await Company.countDocuments();

        query = query.skip(startIndex).limit(limit);

        const companies = await query;
        const pagination = {};

        if (endIndex < total) {
            pagination.next = {
                page: page + 1,
                limit
            };
        }

        if (startIndex > 0) {
            pagination.prev = {
                page: page - 1,
                limit
            };
        }

        res.status(200).json({
            success: true,
            count: companies.length,
            pagination,
            data: companies
        });

    } catch (err) {
        console.error(err);
        res.status(400).json({
            success: false,
            message: err.message
        });
    }
};

exports.getCompany = async (req, res, next) => {
    try {
        const company = await Company.findById(req.params.id);
        if (!company) {
            return res.status(404).json({
                success: false,
                message: `Company not found with companyID of ${req.params.id}`
            });
        }
        res.status(200).json({
            success: true,
            data: company
        });
    } catch (err) {
        console.error(err);
        res.status(400).json({
            success: false,
            message: err.message
        });
    }
};

exports.addCompany = async (req, res, next) => {
    try {
        // Initialize empty bookedSlots array if not provided
        if (!req.body.bookedSlots) {
            req.body.bookedSlots = [];
        }
        
        const company = await Company.create(req.body);
        res.status(201).json({
            success: true,
            data: company
        });
    } catch (err) {
        if (err.code === 11000) {
            return res.status(400).json({ 
                success: false, 
                message: `Company already exists` 
            });
        }
        console.error(err);
        res.status(400).json({ 
            success: false,
            message: err.message
        });
    }
};

exports.updateCompany = async (req, res, next) => {
    try {
        const company = await Company.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true
        });
        
        if (!company) {
            return res.status(404).json({
                success: false,
                message: `Company not found with id of ${req.params.id}`
            });
        }
        
        res.status(200).json({
            success: true, 
            data: company
        });
    } catch (err) {
        console.error(err);
        res.status(400).json({
            success: false,
            message: err.message
        });
    }
};

exports.deleteCompany = async (req, res, next) => {
    try {
        const company = await Company.findById(req.params.id);
  
        if (!company) {
            return res.status(404).json({
                success: false,
                message: `Company not found with id of ${req.params.id}`
            });
        }
  
        // Delete all bookings related to this company
        await Booking.deleteMany({ company: req.params.id });
  
        // Delete the company itself
        await Company.deleteOne({ _id: req.params.id });
  
        res.status(200).json({
            success: true,
            data: {}
        });
    } catch (err) {
        console.error(err);
        res.status(400).json({
            success: false,
            message: err.message
        });
    }
};

// Get all available time slots
exports.getCompanyTimeSlots = async (req, res) => {
    try {
        const { id } = req.params;
        const { date } = req.query;
        if (!date) {
            return res.status(400).json({
                success: false,
                message: 'Please provide a date parameter'
            });
        }
        const company = await Company.findById(id);
        if (!company) {
            return res.status(404).json({
                success: false,
                message: `Company not found with id of ${id}`
            });
        }
        // Format the date for comparison
        const formattedQueryDate = new Date(date).toISOString().split('T')[0];
        // Get all available time slots
        const allTimeSlots = Company.getAvailableTimeSlots();
        // Find booked slots for the given date
        const bookedSlots = company.bookedSlots
            .filter(slot => new Date(slot.date).toISOString().split('T')[0] === formattedQueryDate)
            .map(slot => slot.timeSlot);
        // Get available slots (all slots minus booked slots)
        const availableSlots = allTimeSlots.filter(slot => !bookedSlots.includes(slot));
        res.status(200).json({
            success: true,
            data: {
                company: company.name,
                date: formattedQueryDate,
                availableSlots: availableSlots,
                bookedSlots: bookedSlots,
                allTimeSlots: allTimeSlots
            }
        });
    } catch (err) {
        console.error(err);
        res.status(400).json({
            success: false,
            message: err.message
        });
    }
};