const User = require("./User");
const Department = require("./Department");
const Service = require("./Service");
const Request = require("./Request");
const Document = require("./Document");
const Payment = require("./Payment");
const Notification = require("./Notification");

// Define associations

// User - Department (Many-to-One)
User.belongsTo(Department, { foreignKey: "departmentId", as: "department" });
Department.hasMany(User, { foreignKey: "departmentId", as: "users" });

// Service - Department (Many-to-One)
Service.belongsTo(Department, { foreignKey: "departmentId", as: "department" });
Department.hasMany(Service, { foreignKey: "departmentId", as: "services" });

// Request - User (Many-to-One)
Request.belongsTo(User, { foreignKey: "userId", as: "citizen" });
User.hasMany(Request, { foreignKey: "userId", as: "requests" });

// Request - Service (Many-to-One)
Request.belongsTo(Service, { foreignKey: "serviceId", as: "service" });
Service.hasMany(Request, { foreignKey: "serviceId", as: "requests" });

// Request - Reviewer (Officer) (Many-to-One)
Request.belongsTo(User, { foreignKey: "reviewedBy", as: "reviewer" });

// Document - Request (Many-to-One)
Document.belongsTo(Request, { foreignKey: "requestId", as: "request" });
Request.hasMany(Document, { foreignKey: "requestId", as: "documents" });

// Document - User (Many-to-One)
Document.belongsTo(User, { foreignKey: "uploadedBy", as: "uploader" });

// Payment - Request (Many-to-One)
Payment.belongsTo(Request, { foreignKey: "requestId", as: "request" });
Request.hasOne(Payment, { foreignKey: "requestId", as: "payment" });

// Payment - User (Many-to-One)
Payment.belongsTo(User, { foreignKey: "userId", as: "user" });

// Notification - User (Many-to-One)
Notification.belongsTo(User, { foreignKey: "userId", as: "user" });
User.hasMany(Notification, { foreignKey: "userId", as: "notifications" });

// Notification - Request (Many-to-One)
Notification.belongsTo(Request, { foreignKey: "requestId", as: "request" });

module.exports = {
  User,
  Department,
  Service,
  Request,
  Document,
  Payment,
  Notification,
};
