const { Payment, Request, Service, User, Notification } = require("../models");
const {
  generateTransactionId,
  generateReceiptNumber,
} = require("../utils/helpers");
const { sendEmail, emailTemplates } = require("../utils/emailService");

// Simulate payment for a request
const simulatePayment = async (req, res, next) => {
  try {
    const { requestId, paymentMethod } = req.body;
    const userId = req.user.id;

    // Verify request exists
    const request = await Request.findByPk(requestId, {
      include: [
        { model: Service, as: "service" },
        { model: User, as: "citizen" },
      ],
    });

    if (!request) {
      return res.status(404).json({
        success: false,
        message: "Request not found",
      });
    }

    // Check authorization
    if (req.user.role === "citizen" && request.userId !== userId) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    // Check if payment already exists
    const existingPayment = await Payment.findOne({ where: { requestId } });
    if (existingPayment) {
      return res.status(400).json({
        success: false,
        message: "Payment already processed for this request",
      });
    }

    // Generate transaction details
    const transactionId = generateTransactionId();
    const receiptNumber = generateReceiptNumber();
    const amount = request.service.fee;

    // Simulate payment processing (random success/failure for demo)
    const paymentSuccess = Math.random() > 0.1; // 90% success rate

    const payment = await Payment.create({
      transactionId,
      requestId,
      userId,
      amount,
      paymentMethod,
      paymentStatus: paymentSuccess ? "completed" : "failed",
      paymentDate: paymentSuccess ? new Date() : null,
      receiptNumber: paymentSuccess ? receiptNumber : null,
    });

    if (paymentSuccess) {
      // Create notification
      await Notification.create({
        userId,
        requestId,
        title: "Payment Successful",
        message: `Payment of $${amount} completed successfully. Transaction ID: ${transactionId}`,
        type: "success",
      });

      // Send email
      const emailContent = emailTemplates.paymentConfirmation(
        request.citizen.name,
        request.requestNumber,
        amount,
        transactionId
      );
      await sendEmail({
        to: request.citizen.email,
        ...emailContent,
      });

      res.status(201).json({
        success: true,
        message: "Payment processed successfully",
        data: payment,
      });
    } else {
      // Create notification for failed payment
      await Notification.create({
        userId,
        requestId,
        title: "Payment Failed",
        message: `Payment of $${amount} failed. Please try again.`,
        type: "error",
      });

      res.status(400).json({
        success: false,
        message: "Payment processing failed. Please try again.",
        data: payment,
      });
    }
  } catch (error) {
    next(error);
  }
};

// Get payment by request ID
const getPaymentByRequestId = async (req, res, next) => {
  try {
    const { requestId } = req.params;

    const payment = await Payment.findOne({
      where: { requestId },
      include: [
        {
          model: Request,
          as: "request",
          include: [{ model: Service, as: "service" }],
        },
        { model: User, as: "user", attributes: { exclude: ["password"] } },
      ],
    });

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: "Payment not found",
      });
    }

    // Check authorization
    if (req.user.role === "citizen" && payment.userId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    res.json({
      success: true,
      data: payment,
    });
  } catch (error) {
    next(error);
  }
};
// Get all payments (Admin only)
const getAllPayments = async (req, res, next) => {
  try {
    const { status, paymentMethod, page = 1, limit = 10 } = req.query;

    const where = {};
    if (status) where.paymentStatus = status;
    if (paymentMethod) where.paymentMethod = paymentMethod;

    const offset = (parseInt(page) - 1) * parseInt(limit);

    const { count, rows } = await Payment.findAndCountAll({
      where,
      include: [
        {
          model: Request,
          as: "request",
          include: [{ model: Service, as: "service" }],
        },
        { model: User, as: "user", attributes: { exclude: ["password"] } },
      ],
      order: [["createdAt", "DESC"]],
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

// Get payment statistics
const getPaymentStats = async (req, res, next) => {
  try {
    const { sequelize } = require("../config/database");

    const stats = await Payment.findOne({
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
        [
          sequelize.fn(
            "COUNT",
            sequelize.literal("CASE WHEN payment_status = 'failed' THEN 1 END")
          ),
          "failedPayments",
        ],
      ],
      raw: true,
    });

    res.json({
      success: true,
      data: {
        totalTransactions: parseInt(stats.totalTransactions) || 0,
        totalRevenue: parseFloat(stats.totalRevenue) || 0,
        completedPayments: parseInt(stats.completedPayments) || 0,
        failedPayments: parseInt(stats.failedPayments) || 0,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Refund payment (Admin only)
const refundPayment = async (req, res, next) => {
  try {
    const { id } = req.params;

    const payment = await Payment.findByPk(id);
    if (!payment) {
      return res.status(404).json({
        success: false,
        message: "Payment not found",
      });
    }

    if (payment.paymentStatus !== "completed") {
      return res.status(400).json({
        success: false,
        message: "Only completed payments can be refunded",
      });
    }

    await payment.update({ paymentStatus: "refunded" });

    res.json({
      success: true,
      message: "Payment refunded successfully",
      data: payment,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  simulatePayment,
  getPaymentByRequestId,
  getAllPayments,
  getPaymentStats,
  refundPayment,
};
