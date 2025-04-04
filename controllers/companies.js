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
            data: companies
        });

    } catch (err) {
        res.status(400).json({
            success: false,
        });
    }
};

exports.getCompany=async (req,res,next) => {
    try{
        const company = await Company.findById(req.params.id);
        if(!company){
            return res.status(400).json({success:false,message:`Company not found with companyID of ${req.params.id}`});
        }
        res.status(200).json({
            success:true, data:company
        });
    }catch(err){
        res.status(400).json({success:false});
    }
};

exports.addCompany=async (req,res,next) => {
    try{
        const company =await Company.create(req.body);
        res.status(201).json({
            success:true, 
            data:company
        });
    }catch(err){
        if(err.code === 11000) {
            return res.status(400).json({ success: false, msg: `Company already exists` });
        }
        res.status(400).json({ success: false });
        console.log(err.stack);
    }
};

exports.updateCompany=async (req,res,next) => {
    try{
        const company = await Company.findByIdAndUpdate(req.params.id,req.body,{
            new:true,
            runValidators:true
        });
        if(!company){
            return res.status(400).json({success:false});
        }
        res.status(200).json({
            success:true, data:company
        });
    }catch(err){
        res.status(400).json({success:false});
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
  
       // Delete all bookings related to this hospital
       await Booking.deleteMany({ company: req.params.id });
  
       // Delete the hospital itself
       await Company.deleteOne({ _id: req.params.id });
  
      res.status(200).json({
        success: true,
        data: {},
      });
    } catch (err) {
      res.status(400).json({
        success: false,
      });
    }
};