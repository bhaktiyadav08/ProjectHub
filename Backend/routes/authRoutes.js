const express = require("express");
const router = express.Router();
const { registerUser, loginUser, getProfile,updateProfile,logoutUser  } = require("../controllers/authController");
const { protect,adminOnly } = require("../middleware/authMiddleware"); // ✅ THIS FIXES YOUR ERROR

// Register user
router.post("/register", registerUser);

// Login user
router.post("/login", loginUser);

// Protected route: Get user profile
router.get("/profile", protect,getProfile);
router.put("/update-profile", protect, updateProfile); 
// Logout user
router.post("/logout", protect,logoutUser); // ✅ restore logout
module.exports = router;
