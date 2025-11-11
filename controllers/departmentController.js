const { Department, Service, User } = require("../models");

// Get all departments
const getAllDepartments = async (req, res, next) => {
  try {
    const { isActive } = req.query;

    const where = {};
    if (isActive !== undefined) {
      where.isActive = isActive === "true";
    }

    const departments = await Department.findAll({
      where,
      include: [
        {
          model: Service,
          as: "services",
          where: { isActive: true },
          required: false,
        },
      ],
      order: [["name", "ASC"]],
    });

    res.json({
      success: true,
      count: departments.length,
      data: departments,
    });
  } catch (error) {
    next(error);
  }
};

// Get department by ID
const getDepartmentById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const department = await Department.findByPk(id, {
      include: [
        { model: Service, as: "services" },
        { model: User, as: "users", attributes: { exclude: ["password"] } },
      ],
    });

    if (!department) {
      return res.status(404).json({
        success: false,
        message: "Department not found",
      });
    }

    res.json({
      success: true,
      data: department,
    });
  } catch (error) {
    next(error);
  }
};

// Create department (Admin only)
const createDepartment = async (req, res, next) => {
  try {
    const departmentData = req.body;

    const department = await Department.create(departmentData);

    res.status(201).json({
      success: true,
      message: "Department created successfully",
      data: department,
    });
  } catch (error) {
    next(error);
  }
};

// Update department (Admin only)
const updateDepartment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const department = await Department.findByPk(id);
    if (!department) {
      return res.status(404).json({
        success: false,
        message: "Department not found",
      });
    }

    await department.update(updates);

    res.json({
      success: true,
      message: "Department updated successfully",
      data: department,
    });
  } catch (error) {
    next(error);
  }
};

// Delete department (Admin only)
const deleteDepartment = async (req, res, next) => {
  try {
    const { id } = req.params;

    const department = await Department.findByPk(id);
    if (!department) {
      return res.status(404).json({
        success: false,
        message: "Department not found",
      });
    }

    // Soft delete by setting isActive to false
    await department.update({ isActive: false });

    res.json({
      success: true,
      message: "Department deactivated successfully",
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllDepartments,
  getDepartmentById,
  createDepartment,
  updateDepartment,
  deleteDepartment,
};
