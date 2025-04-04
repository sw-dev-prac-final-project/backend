const express = require("express");
const { getCompanies, getCompany, addCompany, updateCompany, deleteCompany } = require("../controllers/companies");

const { protect, authorize } = require("../middleware/auth");      

const router = express.Router({ mergeParams: true });

router.route("/")
  .get(protect, authorize("admin", "user"), getCompanies)
  .post(protect, authorize("admin"), addCompany);
router.route("/:id")
  .get(protect, authorize("admin", "user"), getCompany)
  .put(protect, authorize("admin"), updateCompany)
  .delete(protect, authorize("admin"), deleteCompany);
module.exports = router;