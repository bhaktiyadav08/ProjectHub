const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

// Register user
exports.registerUser = async (req, res) => {
  try {
    const { username, email, branch, userClass, phone, password} = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) return res.status(400).json({ message: "User already exists" });
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Save user in DB
    const newUser = await User.create({
      username,
      email,
      branch,
      userClass,
      phone,
      password: hashedPassword,
      
    });
   
    // Generate JWT token
    const token = jwt.sign({ id: newUser._id }, process.env.JWT_SECRET, { expiresIn: "1d" });

    res.status(201).json({ token,username: newUser.username,
      email: newUser.email,
      branch: newUser.branch,
      userClass: newUser.userClass,
      phone: newUser.phone,
   });
  } catch (err) {
    console.error("Register error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// Login user
exports.loginUser = async (req, res) => {
  try {
    const { username, password } = req.body;

    // Find user
    const user = await User.findOne({ username });
    if (!user) return res.status(400).json({ message: "Invalid credentials" });

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: "Invalid credentials" });

    // Generate JWT token
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "1d" });

    res.json({ token, _id: user._id,   
       username: user.username,
      email: user.email,
      branch: user.branch,
      userClass: user.userClass,
      phone: user.phone,
     role: user.role   });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ message: "Server error" });
  }
};
// Get profile of logged-in user
exports.getProfile = async (req, res) => {
  try {
    const user = req.user;
    if (!user) return res.status(404).json({ message: "User not found" });

    res.json({
      username: user.username,
      email: user.email,
      branch: user.branch,
      userClass: user.userClass,
      phone: user.phone, 
    });
  } catch (error) {
    console.error("Get profile error:", error);
    res.status(500).json({ message: "Server error" });
  }
};
// In authController.js

// Update profile
exports.updateProfile = async (req, res) => {
  try {
    const userId = req.user._id;  // from protect middleware, you set req.user

    // Get fields to update
    const { username, email, branch, userClass, phone } = req.body;

    // Build an object of updates, only for fields provided
    const updates = {};
    if (username) updates.username = username;
    if (email) updates.email = email;
    if (branch) updates.branch = branch;
    if (userClass) updates.userClass = userClass;
    if (phone) updates.phone = phone;

    const updatedUser = await User.findByIdAndUpdate(userId, updates, { new: true }).select("-password");
    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json({
      message: "Profile updated successfully",
      username: updatedUser.username,
      email: updatedUser.email,
      branch: updatedUser.branch,
      userClass: updatedUser.userClass,
      phone: updatedUser.phone
    });
  } catch (error) {
    console.error("Update profile error:", error);
    res.status(500).json({ message: "Server error" });
  }
};
// Logout user
exports.logoutUser = async (req, res) => {
  try {
    // On frontend you just clear token from localStorage, 
    // but we return a response here for consistency
    res.json({ message: "User logged out successfully" });
  } catch (error) {
    console.error("Logout error:", error);
    res.status(500).json({ message: "Server error" });
  }
};