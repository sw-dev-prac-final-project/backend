const Booking = require('../models/Booking');
const Company = require('../models/Company');
const sendConfirmationEmail = require("../utils/email");

// Helper function to format a date to YYYY-MM-DD
const formatDateToYYYYMMDD = (date) => {
  const d = new Date(date);
  return d.toISOString().split('T')[0];
};

// Helper function to check if a slot is booked
const isSlotBooked = (bookedSlots, date, timeSlot) => {
  const formattedDate = formatDateToYYYYMMDD(date);
  return bookedSlots.some(slot => 
    formatDateToYYYYMMDD(slot.date) === formattedDate && 
    slot.timeSlot === timeSlot
  );
};

exports.getBookings = async (req, res, next) => {
  let query;

  if(req.user.role != 'admin') {
    query = Booking.find({user: req.user.id}).populate({
      path: 'company',
      select: 'name address tel website',
    }); 
  } else {
    if(req.params.companyID) {
      query = Booking.find({company: req.params.companyID}).populate({
        path: 'company',
        select: 'name address tel website',
      });
    } else {
      query = Booking.find().populate({
        path: 'company',
        select: 'name address tel website',
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
};

exports.getBooking = async (req, res, next) => {
  try {
    const booking = await Booking.findById(req.params.id).populate({
      path: 'company',
      select: 'name address tel website',
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
};

exports.getAvailableTimeSlots = async (req, res, next) => {
  try {
    // Get the company ID and date from the request
    const { companyId, date } = req.query;
    if (!companyId || !date) {
      return res.status(400).json({
        success: false,
        error: 'Please provide companyId and date',
      });
    }

    // Find the company
    const company = await Company.findById(companyId);
    if (!company) {
      return res.status(404).json({
        success: false,
        error: 'Company not found',
      });
    }

    // Get all available time slots
    const allTimeSlots = Company.getAvailableTimeSlots();
    
    // Find booked slots for the given date
    const formattedDate = formatDateToYYYYMMDD(date);
    const bookedSlots = company.bookedSlots
      .filter(slot => formatDateToYYYYMMDD(slot.date) === formattedDate)
      .map(slot => slot.timeSlot);
    
    // Get available slots
    const availableSlots = allTimeSlots.filter(slot => !bookedSlots.includes(slot));
    
    return res.status(200).json({
      success: true,
      data: availableSlots,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      error: 'Server Error',
    });
  }
};

exports.addBooking = async (req, res, next) => {
  try {
    const companyID = req.body.company;
    const apptDate = new Date(req.body.apptDate);
    const timeSlot = req.body.timeSlot;

    // Input validation
    if (!companyID || !apptDate || !timeSlot) {
      return res.status(400).json({
        success: false,
        error: 'Please provide company, apptDate and timeSlot',
      });
    }

    const selectedDateStr = formatDateToYYYYMMDD(apptDate);
    if (selectedDateStr < '2022-05-10' || selectedDateStr > '2022-05-13') {
      return res.status(400).json({
        success: false,
        error: 'Bookings are only allowed between May 10th and May 13th, 2022'
      });
    }

    // Check if timeSlot is valid
    const availableTimeSlots = Company.getAvailableTimeSlots();
    if (!availableTimeSlots.includes(timeSlot)) {
      return res.status(400).json({
        success: false,
        error: `Invalid time slot. Available slots are: ${availableTimeSlots.join(', ')}`,
      });
    }

    // Find the company
    let company;
    try {
      company = await Company.findById(companyID);
    } catch (error) {
      return res.status(400).json({
        success: false,
        error: 'Invalid company ID',
      });
    }

    if (!company) {
      return res.status(404).json({
        success: false,
        error: 'No company found',
      });
    }

    // Check if the time slot is already booked
    if (isSlotBooked(company.bookedSlots, apptDate, timeSlot)) {
      return res.status(400).json({
        success: false,
        message: `The time slot ${timeSlot} on ${formatDateToYYYYMMDD(apptDate)} is already booked for this company.`,
      });
    }

    // Check if user has exceeded booking limit
    const userId = req.user.id;
    const existedBooking = await Booking.find({ user: userId });

    if (existedBooking.length >= 3 && req.user.role != 'admin') {
      return res.status(400).json({
        success: false,
        message: `The user with ID ${req.user.id} has already made 3 bookings.`,
      });
    }

    // Create booking
    const booking = await Booking.create({
      apptDate,
      timeSlot,
      company: companyID,
      user: userId
    });

    // Update company's bookedSlots
    company.bookedSlots.push({ 
      date: apptDate, 
      timeSlot 
    });
    await company.save();

    // Send confirmation email
    await sendConfirmationEmail(req.user.email, req.user.name, booking, company);

    return res.status(201).json({
      success: true,
      data: booking,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      error: 'Cannot Create Booking',
    });
  }
};

exports.updateBooking = async (req, res, next) => {
  try {
    let booking = await Booking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({
        success: false,
        error: 'No booking found',
      });
    }

    // Check authorization
    if (booking.user.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(401).json({
        success: false,
        error: 'Not authorized to update this booking',
      });
    }

    // Extract update data
    const newApptDate = req.body.apptDate ? new Date(req.body.apptDate) : booking.apptDate;
    const newTimeSlot = req.body.timeSlot || booking.timeSlot;
    const newCompanyId = req.body.company || booking.company.toString();

    const selectedDateStr = formatDateToYYYYMMDD(newApptDate);
    if (selectedDateStr < '2022-05-10' || selectedDateStr > '2022-05-13') {
      return res.status(400).json({
        success: false,
        error: 'Bookings are only allowed between May 10th and May 13th, 2022'
      });
    }

    // Check if timeSlot is valid
    const availableTimeSlots = Company.getAvailableTimeSlots();
    if (!availableTimeSlots.includes(newTimeSlot)) {
      return res.status(400).json({
        success: false,
        error: `Invalid time slot. Available slots are: ${availableTimeSlots.join(', ')}`,
      });
    }

    // Determine if company or slot is changing
    const isCompanyChanging = newCompanyId !== booking.company.toString();
    const isDateChanging = formatDateToYYYYMMDD(newApptDate) !== formatDateToYYYYMMDD(booking.apptDate);
    const isTimeSlotChanging = newTimeSlot !== booking.timeSlot;
    
    // Get old and new company
    let oldCompany;
    try {
      oldCompany = await Company.findById(booking.company);
      if (!oldCompany) {
      return res.status(404).json({
        success: false,
        error: 'Original company not found',
      });
      }
    } catch (error) {
      return res.status(400).json({
      success: false,
      error: 'Invalid original company ID',
      });
    }
    
    let newCompany = oldCompany;
    if (isCompanyChanging) {
      try {
      newCompany = await Company.findById(newCompanyId);
      if (!newCompany) {
        return res.status(404).json({
        success: false,
        error: 'New company not found',
        });
      }
      } catch (error) {
      return res.status(400).json({
        success: false,
        error: 'Invalid new company ID',
      });
      }
    }
    
    // If date, time slot or company is changing, check availability
    if (isDateChanging || isTimeSlotChanging || isCompanyChanging) {
      // Check if new slot is available
      if (isSlotBooked(newCompany.bookedSlots, newApptDate, newTimeSlot)) {
        return res.status(400).json({
          success: false,
          message: `The time slot ${newTimeSlot} on ${formatDateToYYYYMMDD(newApptDate)} is already booked for this company.`,
        });
      }
      
      // Remove old booking from old company
      oldCompany.bookedSlots = oldCompany.bookedSlots.filter(slot => 
        !(formatDateToYYYYMMDD(slot.date) === formatDateToYYYYMMDD(booking.apptDate) && 
          slot.timeSlot === booking.timeSlot)
      );
      await oldCompany.save();
      
      // Add new booking to new company
      newCompany.bookedSlots.push({
        date: newApptDate,
        timeSlot: newTimeSlot
      });
      await newCompany.save();
    }

    // Update the booking
    const updatedData = {
      apptDate: newApptDate,
      timeSlot: newTimeSlot,
      company: newCompanyId
    };
    
    booking = await Booking.findByIdAndUpdate(req.params.id, updatedData, {
      new: true,
      runValidators: true,
    });

    await sendConfirmationEmail(req.user.email, req.user.name, booking, newCompany);

    return res.status(200).json({
      success: true,
      data: booking,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: 'Cannot update booking',
      error: error.message
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
    
    // Check authorization
    if (booking.user.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(401).json({
        success: false,
        error: 'Not authorized to delete this booking',
      });
    }
    
    // Remove booking slot from company
    const company = await Company.findById(booking.company);
    if (company) {
      company.bookedSlots = company.bookedSlots.filter(slot => 
        !(formatDateToYYYYMMDD(slot.date) === formatDateToYYYYMMDD(booking.apptDate) && 
          slot.timeSlot === booking.timeSlot)
      );
      await company.save();
    }
    
    // Delete the booking
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
};