const express = require("express");
const router = express.Router();
const {
  simulatePayment,
  getPaymentByRequestId,
  getAllPayments,
  getPaymentStats,
  refundPayment,
} = require("../controllers/paymentController");
const { authenticateToken, authorizeRoles } = require("../middleware/auth");
const { validate, paymentSchema } = require("../middleware/validation");

// Simulate payment
router.post(
  "/simulate",
  authenticateToken,
  validate(paymentSchema),
  simulatePayment
);

// Get payment by request ID
router.get("/request/:requestId", authenticateToken, getPaymentByRequestId);

// Get all payments (Admin only)
router.get("/", authenticateToken, authorizeRoles("admin"), getAllPayments);

// Get payment statistics (Admin only)
router.get(
  "/stats",
  authenticateToken,
  authorizeRoles("admin"),
  getPaymentStats
);

// Refund payment (Admin only)
router.post(
  "/:id/refund",
  authenticateToken,
  authorizeRoles("admin"),
  refundPayment
);

module.exports = router;
