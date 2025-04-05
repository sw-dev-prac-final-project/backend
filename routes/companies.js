const express = require("express");
const { getCompanies, getCompany, addCompany, updateCompany, deleteCompany, getCompanyTimeSlots } = require("../controllers/companies");

const { protect, authorize } = require("../middleware/auth");

const router = express.Router();

router.route("/")
  .get(protect, authorize("admin", "user"), getCompanies)
  .post(protect, authorize("admin"), addCompany);

router.route("/:id")
  .get(protect, authorize("admin", "user"), getCompany)
  .put(protect, authorize("admin"), updateCompany)
  .delete(protect, authorize("admin"), deleteCompany);

router.route("/:id/timeslots")
  .get(protect, authorize("admin", "user"), getCompanyTimeSlots);

module.exports = router;