const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/database");

const Payment = sequelize.define(
  "Payment",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    transactionId: {
      type: DataTypes.STRING,
      unique: true,
      allowNull: false,
    },
    requestId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "Requests",
        key: "id",
      },
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "Users",
        key: "id",
      },
    },
    amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    paymentMethod: {
      type: DataTypes.ENUM(
        "credit_card",
        "debit_card",
        "bank_transfer",
        "cash",
        "mobile_wallet"
      ),
      defaultValue: "credit_card",
    },
    paymentStatus: {
      type: DataTypes.ENUM("pending", "completed", "failed", "refunded"),
      defaultValue: "pending",
      allowNull: false,
    },
    paymentDate: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    receiptNumber: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  },
  {
    tableName: "payments",
    timestamps: true,
  }
);

module.exports = Payment;
