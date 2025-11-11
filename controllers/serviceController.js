const { Service, Department } = require("../models");

// Get all services
const getAllServices = async (req, res, next) => {
  try {
    const { departmentId, isActive } = req.query;

    const where = {};
    if (departmentId) where.departmentId = departmentId;
    if (isActive !== undefined) where.isActive = isActive === "true";

    const services = await Service.findAll({
      where,
      include: [{ model: Department, as: "department" }],
      order: [["name", "ASC"]],
    });

    res.json({
      success: true,
      count: services.length,
      data: services,
    });
  } catch (error) {
    next(error);
  }
};

// Get service by ID
const getServiceById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const service = await Service.findByPk(id, {
      include: [{ model: Department, as: "department" }],
    });

    if (!service) {
      return res.status(404).json({
        success: false,
        message: "Service not found",
      });
    }

    res.json({
      success: true,
      data: service,
    });
  } catch (error) {
    next(error);
  }
};

// Create service (Admin only)
const createService = async (req, res, next) => {
  try {
    const serviceData = req.body;

    // Verify department exists
    const department = await Department.findByPk(serviceData.departmentId);
    if (!department) {
      return res.status(404).json({
        success: false,
        message: "Department not found",
      });
    }

    const service = await Service.create(serviceData);

    const serviceWithDept = await Service.findByPk(service.id, {
      include: [{ model: Department, as: "department" }],
    });

    res.status(201).json({
      success: true,
      message: "Service created successfully",
      data: serviceWithDept,
    });
  } catch (error) {
    next(error);
  }
};

// Update service (Admin only)
const updateService = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const service = await Service.findByPk(id);
    if (!service) {
      return res.status(404).json({
        success: false,
        message: "Service not found",
      });
    }

    // If department is being changed, verify it exists
    if (updates.departmentId) {
      const department = await Department.findByPk(updates.departmentId);
      if (!department) {
        return res.status(404).json({
          success: false,
          message: "Department not found",
        });
      }
    }

    await service.update(updates);

    const updatedService = await Service.findByPk(id, {
      include: [{ model: Department, as: "department" }],
    });

    res.json({
      success: true,
      message: "Service updated successfully",
      data: updatedService,
    });
  } catch (error) {
    next(error);
  }
};

// Delete service (Admin only)
const deleteService = async (req, res, next) => {
  try {
    const { id } = req.params;

    const service = await Service.findByPk(id);
    if (!service) {
      return res.status(404).json({
        success: false,
        message: "Service not found",
      });
    }

    // Soft delete
    await service.update({ isActive: false });

    res.json({
      success: true,
      message: "Service deactivated successfully",
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllServices,
  getServiceById,
  createService,
  updateService,
  deleteService,
};
