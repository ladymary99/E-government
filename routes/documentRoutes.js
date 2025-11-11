const express = require("express");
const router = express.Router();
const {
  uploadDocument,
  getRequestDocuments,
  downloadDocument,
  deleteDocument,
} = require("../controllers/documentController");
const { authenticateToken } = require("../middleware/auth");
const upload = require("../middleware/upload");

// Upload document
router.post(
  "/upload",
  authenticateToken,
  upload.single("document"),
  uploadDocument
);

// Get documents for a request
router.get("/request/:requestId", authenticateToken, getRequestDocuments);

// Download document
router.get("/:id/download", authenticateToken, downloadDocument);

// Delete document
router.delete("/:id", authenticateToken, deleteDocument);

module.exports = router;
