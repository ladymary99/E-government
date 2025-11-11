const {
  Request,
  Service,
  User,
  Department,
  Document,
  Payment,
  Notification,
} = require("../models");
const { generateRequestNumber } = require("../utils/helpers");
const { sendEmail, emailTemplates } = require("../utils/emailService");
const { Op } = require("sequelize");

// Create new service request (Citizen only)
const createRequest = async (req, res, next) => {
  try {
    const { serviceId, notes, priority } = req.body;
    const userId = req.user.id;

    // Verify service exists
    const service = await Service.findByPk(serviceId);
    if (!service || !service.isActive) {
      return res.status(404).json({
        success: false,
        message: "Service not found or inactive",
      });
    }

    // Generate unique request number
    const requestNumber = generateRequestNumber();

    // Create request
    const request = await Request.create({
      requestNumber,
      userId,
      serviceId,
      notes,
      priority: priority || "medium",
      status: "submitted",
    });

    // Load full request with relations
    const fullRequest = await Request.findByPk(request.id, {
      include: [
        { model: User, as: "citizen", attributes: { exclude: ["password"] } },
        {
          model: Service,
          as: "service",
          include: [{ model: Department, as: "department" }],
        },
      ],
    });

    // Create notification
    await Notification.create({
      userId,
      requestId: request.id,
      title: "Request Submitted",
      message: `Your service request #${requestNumber} has been submitted successfully.`,
      type: "success",
    });

    // Send email notification
    const emailContent = emailTemplates.requestSubmitted(
      req.user.name,
      requestNumber
    );
    await sendEmail({
      to: req.user.email,
      ...emailContent,
    });

    res.status(201).json({
      success: true,
      message: "Service request created successfully",
      data: fullRequest,
    });
  } catch (error) {
    next(error);
  }
};

// Get all requests with filters
const getAllRequests = async (req, res, next) => {
  try {
    const {
      status,
      departmentId,
      serviceId,
      userId,
      priority,
      search,
      page = 1,
      limit = 10,
      sortBy = "createdAt",
      sortOrder = "DESC",
    } = req.query;

    const where = {};

    // Apply filters
    if (status) where.status = status;
    if (serviceId) where.serviceId = serviceId;
    if (priority) where.priority = priority;

    // For officers, filter by their department
    if (req.user.role === "officer" || req.user.role === "department_head") {
      const departmentServices = await Service.findAll({
        where: { departmentId: req.user.departmentId },
        attributes: ["id"],
      });
      where.serviceId = { [Op.in]: departmentServices.map((s) => s.id) };
    }

    // For citizens, only show their own requests
    if (req.user.role === "citizen") {
      where.userId = req.user.id;
    }

    // Admin can filter by userId
    if (userId && req.user.role === "admin") {
      where.userId = userId;
    }

    // Search functionality
    if (search) {
      where[Op.or] = [
        { requestNumber: { [Op.iLike]: `%${search}%` } },
        { notes: { [Op.iLike]: `%${search}%` } },
      ];
    }

    // Pagination
    const offset = (parseInt(page) - 1) * parseInt(limit);

    const { count, rows } = await Request.findAndCountAll({
      where,
      include: [
        { model: User, as: "citizen", attributes: { exclude: ["password"] } },
        {
          model: Service,
          as: "service",
          include: [{ model: Department, as: "department" }],
          ...(departmentId && { where: { departmentId } }),
        },
        {
          model: User,
          as: "reviewer",
          attributes: { exclude: ["password"] },
          required: false,
        },
        { model: Payment, as: "payment", required: false },
      ],
      order: [[sortBy, sortOrder]],
      limit: parseInt(limit),
      offset,
    });

    res.json({
      success: true,
      count,
      totalPages: Math.ceil(count / parseInt(limit)),
      currentPage: parseInt(page),
      data: rows,
    });
  } catch (error) {
    next(error);
  }
};

// Get request by ID
const getRequestById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const request = await Request.findByPk(id, {
      include: [
        { model: User, as: "citizen", attributes: { exclude: ["password"] } },
        {
          model: Service,
          as: "service",
          include: [{ model: Department, as: "department" }],
        },
        {
          model: User,
          as: "reviewer",
          attributes: { exclude: ["password"] },
          required: false,
        },
        { model: Document, as: "documents" },
        { model: Payment, as: "payment", required: false },
      ],
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

    // Officers can only view requests in their department
    if (req.user.role === "officer" || req.user.role === "department_head") {
      if (request.service.departmentId !== req.user.departmentId) {
        return res.status(403).json({
          success: false,
          message: "Access denied",
        });
      }
    }

    res.json({
      success: true,
      data: request,
    });
  } catch (error) {
    next(error);
  }
};

// Update request status
const updateRequestStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, reviewComments } = req.body;

    const request = await Request.findByPk(id, {
      include: [
        { model: User, as: "citizen" },
        { model: Service, as: "service" },
      ],
    });

    if (!request) {
      return res.status(404).json({
        success: false,
        message: "Request not found",
      });
    }

    // Authorization
    if (req.user.role === "officer" || req.user.role === "department_head") {
      if (request.service.departmentId !== req.user.departmentId) {
        return res.status(403).json({
          success: false,
          message: "Access denied",
        });
      }
    }

    const updates = {
      status,
      reviewedBy: req.user.id,
      reviewedAt: new Date(),
    };

    if (reviewComments) updates.reviewComments = reviewComments;
    if (status === "completed") updates.completedAt = new Date();

    await request.update(updates);

    // Create notification
    await Notification.create({
      userId: request.userId,
      requestId: request.id,
      title: "Request Status Updated",
      message: `Your request #${request.requestNumber} status has been updated to ${status}.`,
      type:
        status === "approved"
          ? "success"
          : status === "rejected"
          ? "error"
          : "info",
    });

    // Send email notification
    const emailContent = emailTemplates.requestStatusUpdated(
      request.citizen.name,
      request.requestNumber,
      status,
      reviewComments
    );
    await sendEmail({
      to: request.citizen.email,
      ...emailContent,
    });

    const updatedRequest = await Request.findByPk(id, {
      include: [
        { model: User, as: "citizen", attributes: { exclude: ["password"] } },
        { model: Service, as: "service" },
        { model: User, as: "reviewer", attributes: { exclude: ["password"] } },
      ],
    });

    res.json({
      success: true,
      message: "Request status updated successfully",
      data: updatedRequest,
    });
  } catch (error) {
    next(error);
  }
};

// Delete/Cancel request
const deleteRequest = async (req, res, next) => {
  try {
    const { id } = req.params;
    const request = await Request.findByPk(id);
    if (!request) {
      return res.status(404).json({
        success: false,
        message: "Request not found",
      });
    }

    if (req.user.role === "citizen") {
      if (request.userId !== req.user.id || request.status !== "submitted") {
        return res.status(403).json({
          success: false,
          message: "Cannot cancel request at this stage",
        });
      }
    }

    await request.destroy();

    res.json({
      success: true,
      message: "Request cancelled successfully",
    });
  } catch (error) {
    next(error);
  }
};

// Get request statistics
const getRequestStats = async (req, res, next) => {
  try {
    const where = {};

    if (req.user.role === "officer" || req.user.role === "department_head") {
      const departmentServices = await Service.findAll({
        where: { departmentId: req.user.departmentId },
        attributes: ["id"],
      });
      where.serviceId = { [Op.in]: departmentServices.map((s) => s.id) };
    }

    if (req.user.role === "citizen") {
      where.userId = req.user.id;
    }

    const [
      totalRequests,
      submittedCount,
      underReviewCount,
      approvedCount,
      rejectedCount,
      completedCount,
    ] = await Promise.all([
      Request.count({ where }),
      Request.count({ where: { ...where, status: "submitted" } }),
      Request.count({ where: { ...where, status: "under_review" } }),
      Request.count({ where: { ...where, status: "approved" } }),
      Request.count({ where: { ...where, status: "rejected" } }),
      Request.count({ where: { ...where, status: "completed" } }),
    ]);

    res.json({
      success: true,
      data: {
        total: totalRequests,
        byStatus: {
          submitted: submittedCount,
          under_review: underReviewCount,
          approved: approvedCount,
          rejected: rejectedCount,
          completed: completedCount,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createRequest,
  getAllRequests,
  getRequestById,
  updateRequestStatus,
  deleteRequest,
  getRequestStats,
};
