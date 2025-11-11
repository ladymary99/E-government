const express = require("express");
const router = express.Router();
const {
  getAllUsers,
  getUserById,
  updateUser,
  deactivateUser,
  activateUser,
  getUserStats,
} = require("../controllers/userController");
const { authenticateToken, authorizeRoles } = require("../middleware/auth");

// Get user statistics
router.get("/stats", authenticateToken, authorizeRoles("admin"), getUserStats);

// Get all users
router.get(
  "/",
  authenticateToken,
  authorizeRoles("admin", "department_head"),
  getAllUsers
);

// Get user by ID
router.get(
  "/:id",
  authenticateToken,
  authorizeRoles("admin", "department_head"),
  getUserById
);

// Update user
router.put("/:id", authenticateToken, authorizeRoles("admin"), updateUser);

// Deactivate user
router.patch(
  "/:id/deactivate",
  authenticateToken,
  authorizeRoles("admin"),
  deactivateUser
);

// Activate user
router.patch(
  "/:id/activate",
  authenticateToken,
  authorizeRoles("admin"),
  activateUser
);

module.exports = router;
