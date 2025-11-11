const { User, Department } = require("../models");
const { generateToken } = require("../middleware/auth");

// ========================
// REGISTER NEW USER
// ========================
const register = async (req, res, next) => {
  try {
    const { name, email, password, role, nationalId, phone, address } =
      req.body;

    // Validate required fields
    if (!name || !email || !password || !role) {
      return res.status(400).json({
        success: false,
        message: "Name, email, password, and role are required",
      });
    }

    // Check if email already exists
    const existingUser = await User.findOne({
      where: { email: email.toLowerCase() },
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "User with this email already exists",
      });
    }

    // Check national ID for citizens
    if (role === "citizen" && nationalId) {
      const existingNationalId = await User.findOne({
        where: { nationalId },
      });
      if (existingNationalId) {
        return res.status(400).json({
          success: false,
          message: "User with this National ID already exists",
        });
      }
    }

    // Create new user
    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password,
      role,
      nationalId: nationalId || null,
      phone: phone || null,
      address: address || null,
    });

    // Generate token
    const token = generateToken(user.id);

    res.status(201).json({
      success: true,
      message: "User registered successfully",
      data: { user, token },
    });
  } catch (error) {
    next(error);
  }
};

// ========================
// LOGIN USER
// ========================
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    const user = await User.findOne({
      where: { email: email.toLowerCase() },
      include: [{ model: Department, as: "department" }],
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: "Account is deactivated. Please contact support.",
      });
    }

    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    const token = generateToken(user.id);
    const userResponse = user.toJSON();
    delete userResponse.password;

    res.json({
      success: true,
      message: "Login successful",
      data: { user: userResponse, token },
    });
  } catch (error) {
    next(error);
  }
};

// ========================
// GET CURRENT USER PROFILE
// ========================
const getProfile = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.user.id, {
      include: [{ model: Department, as: "department" }],
      attributes: { exclude: ["password"] },
    });

    res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

// ========================
// UPDATE USER PROFILE
// ========================
const updateProfile = async (req, res, next) => {
  try {
    const { id } = req.user;
    const updates = req.body;

    // Prevent updating sensitive fields
    delete updates.password;
    delete updates.role;
    delete updates.email;

    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    await user.update(updates);

    res.json({
      success: true,
      message: "Profile updated successfully",
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

// ========================
// CHANGE PASSWORD
// ========================
const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const { id } = req.user;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Current and new password are required",
      });
    }

    const user = await User.findByPk(id);
    const isPasswordValid = await user.comparePassword(currentPassword);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: "Current password is incorrect",
      });
    }

    user.password = newPassword;
    await user.save();

    res.json({
      success: true,
      message: "Password changed successfully",
    });
  } catch (error) {
    next(error);
  }
};

// ========================
// EXPORT CONTROLLER
// ========================
module.exports = {
  register,
  login,
  getProfile,
  updateProfile,
  changePassword,
};
