const express = require("express");
const router = express.Router();
const {
  getMyNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  getUnreadCount,
} = require("../controllers/notificationController");
const { authenticateToken } = require("../middleware/auth");

// Get unread count
router.get("/unread-count", authenticateToken, getUnreadCount);

// Get my notifications
router.get("/", authenticateToken, getMyNotifications);

// Mark all as read
router.patch("/mark-all-read", authenticateToken, markAllAsRead);

// Mark notification as read
router.patch("/:id/read", authenticateToken, markAsRead);

// Delete notification
router.delete("/:id", authenticateToken, deleteNotification);

module.exports = router;
