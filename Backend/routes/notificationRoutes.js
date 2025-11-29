const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const { protect } = require("../middleware/authMiddleware");

router.get('/',protect, notificationController.getUserNotifications);
router.put('/:id/read',protect, notificationController.markAsRead);
router.put('/read-all',protect, notificationController.markAllAsRead);

module.exports = router;