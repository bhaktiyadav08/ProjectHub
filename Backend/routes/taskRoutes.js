const express = require("express");
const router = express.Router();
const taskController = require("../controllers/taskController");
const groupController=require("../controllers/groupController");
const { protect } = require("../middleware/authMiddleware");

// Leader adds, views, updates, deletes
router.post("/", protect, taskController.createTask);
router.get("/group/:groupId", protect, taskController.getTasksByGroup);
router.get("/progress/:groupId", taskController.getGroupProgress);
router.put("/:id", protect, taskController.updateTask);
router.delete("/:id", protect, taskController.deleteTask);
router.get("/users", groupController.listUsers);
router.get("/my-tasks", protect, taskController.getMyTasks);
module.exports = router;
