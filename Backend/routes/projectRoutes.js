// Backend/routes/projectRoutes.js
const express = require("express");
const { createProject, getMyProjects } = require("../controllers/projectController");
const { protect } = require("../middleware/authMiddleware");
const router = express.Router();

router.post("/", protect, createProject);
router.get("/", protect, getMyProjects);

module.exports = router;
