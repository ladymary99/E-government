const express = require("express");
const router = express.Router();
const {
  createRequest,
  getAllRequests,
  getRequestById,
  updateRequestStatus,
  deleteRequest,
  getRequestStats,
} = require("../controllers/requestController");
const { authenticateToken, authorizeRoles } = require("../middleware/auth");
const {
  validate,
  requestSchema,
  updateRequestStatusSchema,
} = require("../middleware/validation");

// Get statistics
router.get("/stats", authenticateToken, getRequestStats);

// Get all requests
router.get("/", authenticateToken, getAllRequests);

// Get request by ID
router.get("/:id", authenticateToken, getRequestById);

// Create request (Citizens only)
router.post(
  "/",
  authenticateToken,
  authorizeRoles("citizen"),
  validate(requestSchema),
  createRequest
);

// Update request status (Officers, Department Heads, Admins)
router.patch(
  "/:id/status",
  authenticateToken,
  authorizeRoles("officer", "department_head", "admin"),
  validate(updateRequestStatusSchema),
  updateRequestStatus
);

// Delete/cancel request
router.delete("/:id", authenticateToken, deleteRequest);

module.exports = router;
