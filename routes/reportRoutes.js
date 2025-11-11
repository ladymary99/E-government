const express = require("express");
const router = express.Router();
const {
  getDashboardStats,
  getRequestsByDepartment,
  getRequestsByService,
  getRequestsTrend,
  getRevenueStats,
  getPerformanceMetrics,
} = require("../controllers/reportController");
const { authenticateToken, authorizeRoles } = require("../middleware/auth");

// Dashboard statistics
router.get("/dashboard", authenticateToken, getDashboardStats);

// Requests by department
router.get(
  "/requests-by-department",
  authenticateToken,
  authorizeRoles("admin", "department_head"),
  getRequestsByDepartment
);

// Requests by service
router.get(
  "/requests-by-service",
  authenticateToken,
  authorizeRoles("admin", "department_head"),
  getRequestsByService
);

// Requests trend
router.get(
  "/requests-trend",
  authenticateToken,
  authorizeRoles("admin", "department_head"),
  getRequestsTrend
);

// Revenue statistics (Admin only)
router.get(
  "/revenue",
  authenticateToken,
  authorizeRoles("admin"),
  getRevenueStats
);

// Performance metrics
router.get(
  "/performance",
  authenticateToken,
  authorizeRoles("admin", "department_head"),
  getPerformanceMetrics
);

module.exports = router;
