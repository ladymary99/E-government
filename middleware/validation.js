const Joi = require("joi");

const validate = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.body, { abortEarly: false });

    if (error) {
      const errors = error.details.map((detail) => detail.message);
      return res.status(400).json({
        success: false,
        message: "Validation error",
        errors,
      });
    }

    next();
  };
};

// Validation schemas
const registerSchema = Joi.object({
  name: Joi.string().min(2).max(100).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
  role: Joi.string()
    .valid("citizen", "officer", "department_head", "admin")
    .default("citizen"),
  nationalId: Joi.string().when("role", {
    is: "citizen",
    then: Joi.required(),
    otherwise: Joi.optional(),
  }),
  dateOfBirth: Joi.date().when("role", {
    is: "citizen",
    then: Joi.required(),
    otherwise: Joi.optional(),
  }),
  phone: Joi.string().optional(), // <-- updated from phoneNumber
  address: Joi.string().optional(),
  jobTitle: Joi.string().when("role", {
    is: Joi.string().valid("officer", "department_head"),
    then: Joi.required(),
    otherwise: Joi.optional(),
  }),
  departmentId: Joi.number().when("role", {
    is: Joi.string().valid("officer", "department_head"),
    then: Joi.required(),
    otherwise: Joi.optional(),
  }),
});

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
});

const departmentSchema = Joi.object({
  name: Joi.string().min(2).max(100).required(),
  description: Joi.string().max(500).optional(),
  code: Joi.string().min(2).max(20).required(),
});

const serviceSchema = Joi.object({
  name: Joi.string().min(2).max(200).required(),
  description: Joi.string().max(1000).optional(),
  departmentId: Joi.number().required(),
  fee: Joi.number().min(0).required(),
  processingTime: Joi.string().optional(),
  requiredDocuments: Joi.string().optional(),
});

const requestSchema = Joi.object({
  serviceId: Joi.number().required(),
  notes: Joi.string().max(1000).optional(),
  priority: Joi.string()
    .valid("low", "medium", "high", "urgent")
    .default("medium"),
});

const updateRequestStatusSchema = Joi.object({
  status: Joi.string()
    .valid("submitted", "under_review", "approved", "rejected", "completed")
    .required(),
  reviewComments: Joi.string().max(1000).optional(),
});

const paymentSchema = Joi.object({
  requestId: Joi.number().required(),
  paymentMethod: Joi.string()
    .valid(
      "credit_card",
      "debit_card",
      "bank_transfer",
      "cash",
      "mobile_wallet"
    )
    .required(),
});

module.exports = {
  validate,
  registerSchema,
  loginSchema,
  departmentSchema,
  serviceSchema,
  requestSchema,
  updateRequestStatusSchema,
  paymentSchema,
};
