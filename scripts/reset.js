require("dotenv").config();
const { sequelize } = require("../config/database");
const models = require("../models");

const reset = async () => {
  try {
    console.log("⚠️  WARNING: This will delete all data!");
    console.log("🔄 Starting database reset...");

    // Test connection
    await sequelize.authenticate();
    console.log("✅ Database connection established");

    // Drop all tables and recreate
    await sequelize.sync({ force: true });
    console.log("✅ Database reset completed");

    console.log('💡 Run "npm run db:seed" to populate with sample data');
    process.exit(0);
  } catch (error) {
    console.error("❌ Reset failed:", error);
    process.exit(1);
  }
};

reset();
