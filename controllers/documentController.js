const { Document, Request, Service } = require("../models");
const fs = require("fs");
const path = require("path");

// Upload document to request
const uploadDocument = async (req, res, next) => {
  try {
    const { requestId } = req.body;

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No file uploaded",
      });
    }

    // Verify request exists
    const request = await Request.findByPk(requestId, {
      include: [{ model: Service, as: "service" }],
    });

    if (!request) {
      // Delete uploaded file if request not found
      fs.unlinkSync(req.file.path);
      return res.status(404).json({
        success: false,
        message: "Request not found",
      });
    }

    // Check authorization
    if (req.user.role === "citizen" && request.userId !== req.user.id) {
      fs.unlinkSync(req.file.path);
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    // Officers can upload to requests in their department
    if (req.user.role === "officer" || req.user.role === "department_head") {
      if (request.service.departmentId !== req.user.departmentId) {
        fs.unlinkSync(req.file.path);
        return res.status(403).json({
          success: false,
          message: "Access denied",
        });
      }
    }

    // Create document record
    const document = await Document.create({
      requestId,
      fileName: req.file.filename,
      originalName: req.file.originalname,
      filePath: req.file.path,
      fileType: req.file.mimetype,
      fileSize: req.file.size,
      uploadedBy: req.user.id,
    });

    res.status(201).json({
      success: true,
      message: "Document uploaded successfully",
      data: document,
    });
  } catch (error) {
    // Delete uploaded file on error
    if (req.file) {
      fs.unlinkSync(req.file.path);
    }
    next(error);
  }
};

// Get documents for a request
const getRequestDocuments = async (req, res, next) => {
  try {
    const { requestId } = req.params;

    const request = await Request.findByPk(requestId, {
      include: [{ model: Service, as: "service" }],
    });

    if (!request) {
      return res.status(404).json({
        success: false,
        message: "Request not found",
      });
    }

    // Check authorization
    if (req.user.role === "citizen" && request.userId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    if (req.user.role === "officer" || req.user.role === "department_head") {
      if (request.service.departmentId !== req.user.departmentId) {
        return res.status(403).json({
          success: false,
          message: "Access denied",
        });
      }
    }

    const documents = await Document.findAll({
      where: { requestId },
      order: [["createdAt", "DESC"]],
    });

    res.json({
      success: true,
      count: documents.length,
      data: documents,
    });
  } catch (error) {
    next(error);
  }
};

// Download document
const downloadDocument = async (req, res, next) => {
  try {
    const { id } = req.params;

    const document = await Document.findByPk(id, {
      include: [
        {
          model: Request,
          as: "request",
          include: [{ model: Service, as: "service" }],
        },
      ],
    });

    if (!document) {
      return res.status(404).json({
        success: false,
        message: "Document not found",
      });
    }

    // Check authorization
    if (
      req.user.role === "citizen" &&
      document.request.userId !== req.user.id
    ) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    if (req.user.role === "officer" || req.user.role === "department_head") {
      if (document.request.service.departmentId !== req.user.departmentId) {
        return res.status(403).json({
          success: false,
          message: "Access denied",
        });
      }
    }
    // Check if file exists
    if (!fs.existsSync(document.filePath)) {
      return res.status(404).json({
        success: false,
        message: "File not found on server",
      });
    }

    // Send file
    res.download(document.filePath, document.originalName);
  } catch (error) {
    next(error);
  }
};

// Delete document
const deleteDocument = async (req, res, next) => {
  try {
    const { id } = req.params;

    const document = await Document.findByPk(id, {
      include: [
        {
          model: Request,
          as: "request",
          include: [{ model: Service, as: "service" }],
        },
      ],
    });

    if (!document) {
      return res.status(404).json({
        success: false,
        message: "Document not found",
      });
    }

    // Check authorization (only uploader or admin can delete)
    if (req.user.role !== "admin" && document.uploadedBy !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    // Delete file from filesystem
    if (fs.existsSync(document.filePath)) {
      fs.unlinkSync(document.filePath);
    }

    // Delete database record
    await document.destroy();

    res.json({
      success: true,
      message: "Document deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  uploadDocument,
  getRequestDocuments,
  downloadDocument,
  deleteDocument,
};
