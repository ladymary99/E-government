const swaggerJsdoc = require("swagger-jsdoc");

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "E-Government Citizen Services Portal API",
      version: "1.0.0",
      description:
        "RESTful API for E-Government Citizen Services Portal with role-based access control",
      contact: {
        name: "API Support",
        email: "support@egovernment.gov",
      },
    },
    servers: [
      {
        url: "http://localhost:5000",
        description: "Development server",
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
      schemas: {
        User: {
          type: "object",
          properties: {
            id: { type: "integer" },
            name: { type: "string" },
            email: { type: "string" },
            role: {
              type: "string",
              enum: ["citizen", "officer", "department_head", "admin"],
            },
            nationalId: { type: "string" },
            dateOfBirth: { type: "string", format: "date" },
            phoneNumber: { type: "string" },
            address: { type: "string" },
            jobTitle: { type: "string" },
            departmentId: { type: "integer" },
            isActive: { type: "boolean" },
            createdAt: { type: "string", format: "date-time" },
            updatedAt: { type: "string", format: "date-time" },
          },
        },
        Department: {
          type: "object",
          properties: {
            id: { type: "integer" },
            name: { type: "string" },
            description: { type: "string" },
            code: { type: "string" },
            isActive: { type: "boolean" },
            createdAt: { type: "string", format: "date-time" },
            updatedAt: { type: "string", format: "date-time" },
          },
        },
        Service: {
          type: "object",
          properties: {
            id: { type: "integer" },
            name: { type: "string" },
            description: { type: "string" },
            departmentId: { type: "integer" },
            fee: { type: "number", format: "float" },
            processingTime: { type: "string" },
            requiredDocuments: { type: "string" },
            isActive: { type: "boolean" },
            createdAt: { type: "string", format: "date-time" },
            updatedAt: { type: "string", format: "date-time" },
          },
        },
        Request: {
          type: "object",
          properties: {
            id: { type: "integer" },
            requestNumber: { type: "string" },
            userId: { type: "integer" },
            serviceId: { type: "integer" },
            status: {
              type: "string",
              enum: [
                "submitted",
                "under_review",
                "approved",
                "rejected",
                "completed",
              ],
            },
            priority: {
              type: "string",
              enum: ["low", "medium", "high", "urgent"],
            },
            notes: { type: "string" },
            reviewedBy: { type: "integer" },
            reviewComments: { type: "string" },
            reviewedAt: { type: "string", format: "date-time" },
            completedAt: { type: "string", format: "date-time" },
            createdAt: { type: "string", format: "date-time" },
            updatedAt: { type: "string", format: "date-time" },
          },
        },
        Payment: {
          type: "object",
          properties: {
            id: { type: "integer" },
            transactionId: { type: "string" },
            requestId: { type: "integer" },
            userId: { type: "integer" },
            amount: { type: "number", format: "float" },
            paymentMethod: {
              type: "string",
              enum: [
                "credit_card",
                "debit_card",
                "bank_transfer",
                "cash",
                "mobile_wallet",
              ],
            },
            paymentStatus: {
              type: "string",
              enum: ["pending", "completed", "failed", "refunded"],
            },
            paymentDate: { type: "string", format: "date-time" },
            receiptNumber: { type: "string" },
            createdAt: { type: "string", format: "date-time" },
            updatedAt: { type: "string", format: "date-time" },
          },
        },
        Error: {
          type: "object",
          properties: {
            success: { type: "boolean", example: false },
            message: { type: "string" },
            errors: {
              type: "array",
              items: { type: "string" },
            },
          },
        },
      },
    },
    tags: [
      {
        name: "Authentication",
        description: "User authentication and profile management",
      },
      { name: "Departments", description: "Department management" },
      { name: "Services", description: "Government services management" },
      { name: "Requests", description: "Service requests management" },
      { name: "Documents", description: "Document upload and management" },
      { name: "Payments", description: "Payment processing" },
      { name: "Notifications", description: "User notifications" },
      { name: "Users", description: "User management" },
      { name: "Reports", description: "Analytics and reports" },
    ],
  },
  apis: ["./routes/*.js"],
};

const specs = swaggerJsdoc(options);

module.exports = specs;
