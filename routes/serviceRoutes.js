const express = require("express");
const router = express.Router();
const {
  getAllServices,
  getServiceById,
  createService,
  updateService,
  deleteService,
} = require("../controllers/serviceController");
const { authenticateToken, authorizeRoles } = require("../middleware/auth");
const { validate, serviceSchema } = require("../middleware/validation");

// Public routes
router.get("/", getAllServices);
router.get("/:id", getServiceById);

// Admin only routes
router.post(
  "/",
  authenticateToken,
  authorizeRoles("admin"),
  validate(serviceSchema),
  createService
);
router.put(
  "/:id",
  authenticateToken,
  authorizeRoles("admin"),
  validate(serviceSchema),
  updateService
);
router.delete(
  "/:id",
  authenticateToken,
  authorizeRoles("admin"),
  deleteService
);

module.exports = router;
