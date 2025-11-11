const { sequelize } = require("../config/database");
const { Request, Service, Department, Payment, User } = require("../models");
const { Op } = require("sequelize");

// Get comprehensive dashboard statistics
const getDashboardStats = async (req, res, next) => {
  try {
    const where = {};

    // Filter by department for officers and department heads
    if (req.user.role === "officer" || req.user.role === "department_head") {
      const departmentServices = await Service.findAll({
        where: { departmentId: req.user.departmentId },
        attributes: ["id"],
      });
      where.serviceId = { [Op.in]: departmentServices.map((s) => s.id) };
    }

    // Get request statistics
    const [
      totalRequests,
      submittedRequests,
      underReviewRequests,
      approvedRequests,
      rejectedRequests,
      completedRequests,
    ] = await Promise.all([
      Request.count({ where }),
      Request.count({ where: { ...where, status: "submitted" } }),
      Request.count({ where: { ...where, status: "under_review" } }),
      Request.count({ where: { ...where, status: "approved" } }),
      Request.count({ where: { ...where, status: "rejected" } }),
      Request.count({ where: { ...where, status: "completed" } }),
    ]);

    // Get payment statistics (admin only)
    let paymentStats = null;
    if (req.user.role === "admin") {
      const payments = await Payment.findOne({
        attributes: [
          [sequelize.fn("COUNT", sequelize.col("id")), "totalTransactions"],
          [sequelize.fn("SUM", sequelize.col("amount")), "totalRevenue"],
          [
            sequelize.fn(
              "COUNT",
              sequelize.literal(
                "CASE WHEN payment_status = 'completed' THEN 1 END"
              )
            ),
            "completedPayments",
          ],
        ],
        raw: true,
      });

      paymentStats = {
        totalTransactions: parseInt(payments.totalTransactions) || 0,
        totalRevenue: parseFloat(payments.totalRevenue) || 0,
        completedPayments: parseInt(payments.completedPayments) || 0,
      };
    }

    res.json({
      success: true,
      data: {
        requests: {
          total: totalRequests,
          submitted: submittedRequests,
          underReview: underReviewRequests,
          approved: approvedRequests,
          rejected: rejectedRequests,
          completed: completedRequests,
          approvalRate:
            totalRequests > 0
              ? ((approvedRequests / totalRequests) * 100).toFixed(2)
              : 0,
          rejectionRate:
            totalRequests > 0
              ? ((rejectedRequests / totalRequests) * 100).toFixed(2)
              : 0,
        },
        ...(paymentStats && { payments: paymentStats }),
      },
    });
  } catch (error) {
    next(error);
  }
};

// Get requests by department
const getRequestsByDepartment = async (req, res, next) => {
  try {
    const results = await Request.findAll({
      attributes: [
        [sequelize.fn("COUNT", sequelize.col("Request.id")), "count"],
        [sequelize.col("service.department.name"), "departmentName"],
        [sequelize.col("service.department.id"), "departmentId"],
      ],
      include: [
        {
          model: Service,
          as: "service",
          attributes: [],
          include: [
            {
              model: Department,
              as: "department",
              attributes: [],
            },
          ],
        },
      ],
      group: ["service.department.id", "service.department.name"],
      raw: true,
    });

    res.json({
      success: true,
      data: results.map((r) => ({
        departmentId: r.departmentId,
        departmentName: r.departmentName,
        requestCount: parseInt(r.count),
      })),
    });
  } catch (error) {
    next(error);
  }
};

// Get requests by service
const getRequestsByService = async (req, res, next) => {
  try {
    const { departmentId } = req.query;

    const serviceWhere = {};
    if (departmentId) {
      serviceWhere.departmentId = departmentId;
    }
    const results = await Request.findAll({
      attributes: [
        [sequelize.fn("COUNT", sequelize.col("Request.id")), "count"],
        [sequelize.col("service.name"), "serviceName"],
        [sequelize.col("service.id"), "serviceId"],
      ],
      include: [
        {
          model: Service,
          as: "service",
          attributes: [],
          where: serviceWhere,
        },
      ],
      group: ["service.id", "service.name"],
      raw: true,
    });

    res.json({
      success: true,
      data: results.map((r) => ({
        serviceId: r.serviceId,
        serviceName: r.serviceName,
        requestCount: parseInt(r.count),
      })),
    });
  } catch (error) {
    next(error);
  }
};

// Get requests over time (monthly)
const getRequestsTrend = async (req, res, next) => {
  try {
    const { months = 6 } = req.query;

    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - parseInt(months));

    const results = await Request.findAll({
      attributes: [
        [
          sequelize.fn("DATE_TRUNC", "month", sequelize.col("createdAt")),
          "month",
        ],
        [sequelize.fn("COUNT", sequelize.col("id")), "count"],
      ],
      where: {
        createdAt: {
          [Op.gte]: startDate,
        },
      },
      group: [sequelize.fn("DATE_TRUNC", "month", sequelize.col("createdAt"))],
      order: [
        [
          sequelize.fn("DATE_TRUNC", "month", sequelize.col("createdAt")),
          "ASC",
        ],
      ],
      raw: true,
    });

    res.json({
      success: true,
      data: results.map((r) => ({
        month: r.month,
        count: parseInt(r.count),
      })),
    });
  } catch (error) {
    next(error);
  }
};

// Get revenue statistics (Admin only)
const getRevenueStats = async (req, res, next) => {
  try {
    // Total revenue
    const totalRevenue = await Payment.sum("amount", {
      where: { paymentStatus: "completed" },
    });

    // Revenue by department
    const revenueByDept = await Payment.findAll({
      attributes: [
        [sequelize.fn("SUM", sequelize.col("amount")), "revenue"],
        [sequelize.col("request.service.department.name"), "departmentName"],
        [sequelize.col("request.service.department.id"), "departmentId"],
      ],
      include: [
        {
          model: Request,
          as: "request",
          attributes: [],
          include: [
            {
              model: Service,
              as: "service",
              attributes: [],
              include: [
                {
                  model: Department,
                  as: "department",
                  attributes: [],
                },
              ],
            },
          ],
        },
      ],
      where: { paymentStatus: "completed" },
      group: [
        "request.service.department.id",
        "request.service.department.name",
      ],
      raw: true,
    });

    res.json({
      success: true,
      data: {
        totalRevenue: parseFloat(totalRevenue) || 0,
        byDepartment: revenueByDept.map((r) => ({
          departmentId: r.departmentId,
          departmentName: r.departmentName,
          revenue: parseFloat(r.revenue),
        })),
      },
    });
  } catch (error) {
    next(error);
  }
};

// Get performance metrics
const getPerformanceMetrics = async (req, res, next) => {
  try {
    const { departmentId } = req.query;

    const where = {};
    if (departmentId) {
      const services = await Service.findAll({
        where: { departmentId },
        attributes: ["id"],
      });
      where.serviceId = { [Op.in]: services.map((s) => s.id) };
    }

    // Average processing time
    const processedRequests = await Request.findAll({
      where: {
        ...where,
        status: { [Op.in]: ["approved", "rejected", "completed"] },
        reviewedAt: { [Op.ne]: null },
      },
      attributes: ["createdAt", "reviewedAt"],
      raw: true,
    });
    let avgProcessingDays = 0;
    if (processedRequests.length > 0) {
      const totalDays = processedRequests.reduce((sum, req) => {
        const days = Math.ceil(
          (new Date(req.reviewedAt) - new Date(req.createdAt)) /
            (1000 * 60 * 60 * 24)
        );
        return sum + days;
      }, 0);
      avgProcessingDays = (totalDays / processedRequests.length).toFixed(1);
    }

    // Approval rate
    const totalProcessed = await Request.count({
      where: {
        ...where,
        status: { [Op.in]: ["approved", "rejected"] },
      },
    });

    const approved = await Request.count({
      where: {
        ...where,
        status: "approved",
      },
    });

    const approvalRate =
      totalProcessed > 0 ? ((approved / totalProcessed) * 100).toFixed(2) : 0;

    res.json({
      success: true,
      data: {
        averageProcessingDays: parseFloat(avgProcessingDays),
        approvalRate: parseFloat(approvalRate),
        totalProcessed,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDashboardStats,
  getRequestsByDepartment,
  getRequestsByService,
  getRequestsTrend,
  getRevenueStats,
  getPerformanceMetrics,
};
