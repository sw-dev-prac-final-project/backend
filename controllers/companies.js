const Company = require("../models/Company");
const Booking = require("../models/Booking");

// @desc    Get all companies
// @route   GET /api/v1/companies
// @access  Private
exports.getCompanies = async (req, res) => {
  try {
    const reqQuery = { ...req.query };
    const removeFields = ["select", "sort", "page", "limit"];
    removeFields.forEach((param) => delete reqQuery[param]);

    let queryStr = JSON.stringify(reqQuery);
    queryStr = queryStr.replace(/\b(gt|gte|lt|lte|in)\b/g, (match) => `$${match}`);

    // let query = Company.find(JSON.parse(queryStr)).populate("bookings");
    let query = Company.find(JSON.parse(queryStr));

    if (req.query.select) {
      const fields = req.query.select.split(",").join(" ");
      query = query.select(fields);
    }

    if (req.query.sort) {
      const sortBy = req.query.sort.split(",").join(" ");
      query = query.sort(sortBy);
    } else {
      query = query.sort("-createdAt");
    }

    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 25;
    const startIndex = (page - 1) * limit;

    query = query.skip(startIndex).limit(limit);

    const companies = await query;

    res.status(200).json({
      success: true,
      count: companies.length,
      data: companies,
    });
  } catch (err) {
    res.status(500).json({ success: false, error: "Server Error" });
  }
};

// @desc    Get a single company
// @route   GET /api/v1/companies/:id
// @access  Private
exports.getCompany = async (req, res) => {
  try {
    const company = await Company.findById(req.params.id);

    if (!company) {
      return res.status(404).json({ success: false, error: "Company not found" });
    }

    res.status(200).json({ success: true, data: company });
  } catch (err) {
    res.status(500).json({ success: false, error: "Server Error" });
  }
};

// @desc    Add a company
// @route   POST /api/v1/companies
// @access  Private/Admin
exports.addCompany = async (req, res) => {
  try {
    const company = await Company.create(req.body);

    res.status(201).json({ success: true, data: company });
  } catch (err) {
    res.status(400).json({ success: false, error: "Invalid data" });
  }
};

// @desc    Update a company
// @route   PUT /api/v1/companies/:id
// @access  Private/Admin
exports.updateCompany = async (req, res) => {
  try {
    const company = await Company.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!company) {
      return res.status(404).json({ success: false, error: "Company not found" });
    }

    res.status(200).json({ success: true, data: company });
  } catch (err) {
    res.status(400).json({ success: false, error: "Invalid data" });
  }
};

// @desc    Delete a company
// @route   DELETE /api/v1/companies/:id
// @access  Private/Admin
exports.deleteCompany = async (req, res) => {
  try {
    const company = await Company.findById(req.params.id);

    if (!company) {
      return res.status(404).json({ success: false, error: "Company not found" });
    }

    // Delete all bookings related to this company
    await Booking.deleteMany({ company: req.params.id });

    // Delete the company itself
    await company.remove();

    res.status(200).json({ success: true, data: {} });
  } catch (err) {
    res.status(500).json({ success: false, error: "Server Error" });
  }
};