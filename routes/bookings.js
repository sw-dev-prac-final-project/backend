const express = require("express");
const  {getBookings, getBooking, addBooking, updateBooking, deleteBooking, getAvailableTimeSlots} = require("../controllers/bookings");

const router = express.Router({mergeParams: true});

const {protect, authorize} = require("../middleware/auth");

router.route("/")
    .get(protect, authorize("admin", "user"), getBookings)
    .post(protect, authorize("admin", "user"), addBooking);

router.route("/available-slots")
    .get(protect, authorize("admin", "user"), getAvailableTimeSlots);

router.route("/:id")
    .get(protect, authorize("admin", "user"), getBooking)
    .put(protect, authorize("admin", "user"), updateBooking)
    .delete(protect, authorize("admin", "user"), deleteBooking);

module.exports = router;   