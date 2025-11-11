const { User, Department } = require("../models");

// Get all users (Admin/Department Head)
const getAllUsers = async (req, res, next) => {
  try {
    const { role, departmentId, isActive, page = 1, limit = 10 } = req.query;

    const where = {};
    if (role) where.role = role;
    if (isActive !== undefined) where.isActive = isActive === "true";

    // Department heads can only see users in their department
    if (req.user.role === "department_head") {
      where.departmentId = req.user.departmentId;
    } else if (departmentId) {
      where.departmentId = departmentId;
    }

    const offset = (parseInt(page) - 1) * parseInt(limit);

    const { count, rows } = await User.findAndCountAll({
      where,
      include: [{ model: Department, as: "department" }],
      attributes: { exclude: ["password"] },
      order: [["name", "ASC"]],
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

// Get user by ID (Admin/Department Head)
const getUserById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const user = await User.findByPk(id, {
      include: [{ model: Department, as: "department" }],
      attributes: { exclude: ["password"] },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Department heads can only view users in their department
    if (
      req.user.role === "department_head" &&
      user.departmentId !== req.user.departmentId
    ) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

// Update user (Admin only)
const updateUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Don't allow email changes through this endpoint
    delete updates.email;

    await user.update(updates);

    const updatedUser = await User.findByPk(id, {
      include: [{ model: Department, as: "department" }],
      attributes: { exclude: ["password"] },
    });

    res.json({
      success: true,
      message: "User updated successfully",
      data: updatedUser,
    });
  } catch (error) {
    next(error);
  }
};

// Deactivate user (Admin only)
const deactivateUser = async (req, res, next) => {
  try {
    const { id } = req.params;

    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    await user.update({ isActive: false });

    res.json({
      success: true,
      message: "User deactivated successfully",
    });
  } catch (error) {
    next(error);
  }
};

// Activate user (Admin only)
const activateUser = async (req, res, next) => {
  try {
    const { id } = req.params;

    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    await user.update({ isActive: true });

    res.json({
      success: true,
      message: "User activated successfully",
    });
  } catch (error) {
    next(error);
  }
};

// Get user statistics (Admin only)
const getUserStats = async (req, res, next) => {
  try {
    const [
      totalUsers,
      citizenCount,
      officerCount,
      departmentHeadCount,
      adminCount,
      activeUsers,
    ] = await Promise.all([
      User.count(),
      User.count({ where: { role: "citizen" } }),
      User.count({ where: { role: "officer" } }),
      User.count({ where: { role: "department_head" } }),
      User.count({ where: { role: "admin" } }),
      User.count({ where: { isActive: true } }),
    ]);

    res.json({
      success: true,
      data: {
        total: totalUsers,
        byRole: {
          citizen: citizenCount,
          officer: officerCount,
          department_head: departmentHeadCount,
          admin: adminCount,
        },
        active: activeUsers,
        inactive: totalUsers - activeUsers,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllUsers,
  getUserById,
  updateUser,
  deactivateUser,
  activateUser,
  getUserStats,
};
