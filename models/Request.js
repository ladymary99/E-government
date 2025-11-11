const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/database");

const Request = sequelize.define(
  "Request",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    requestNumber: {
      type: DataTypes.STRING,
      unique: true,
      allowNull: false,
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "Users",
        key: "id",
      },
    },
    serviceId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "Services",
        key: "id",
      },
    },
    status: {
      type: DataTypes.ENUM(
        "submitted",
        "under_review",
        "approved",
        "rejected",
        "completed"
      ),
      defaultValue: "submitted",
      allowNull: false,
    },
    priority: {
      type: DataTypes.ENUM("low", "medium", "high", "urgent"),
      defaultValue: "medium",
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    reviewedBy: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: "Users",
        key: "id",
      },
    },
    reviewComments: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    reviewedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    completedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    tableName: "requests",
    timestamps: true,
  }
);

module.exports = Request;
