const Notification = require('../models/notification');

// GET /api/notifications - Get all notifications for current user
exports.getUserNotifications = async (req, res) => {
    try {
        const userId = req.user.id; // From auth middleware
        console.log('🔍 Fetching notifications for user:', userId);
        const notifications = await Notification.find({ recipient: userId })
            .sort({ createdAt: -1 })
            .populate('relatedTask', 'title')
            .populate('group', 'name');

        res.json(notifications);
    } catch (error) {
        console.error('Error fetching notifications:', error);
        res.status(500).json({ error: 'Failed to fetch notifications' });
    }
};

// PUT /api/notifications/:id/read - Mark single notification as read
exports.markAsRead = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;
        
        const notification = await Notification.findOneAndUpdate(
            { _id: id, recipient: userId },
            { isRead: true },
            { new: true }
        );
        
        if (!notification) {
            return res.status(404).json({ error: 'Notification not found' });
        }
        
        res.json({ message: 'Notification marked as read', notification });
    } catch (error) {
        console.error('Error marking notification as read:', error);
        res.status(500).json({ error: 'Failed to mark notification as read' });
    }
};

// PUT /api/notifications/read-all - Mark all notifications as read
exports.markAllAsRead = async (req, res) => {
    try {
        const userId = req.user.id;
        
        await Notification.updateMany(
            { recipient: userId, isRead: false },
            { isRead: true }
        );
        
        res.json({ message: 'All notifications marked as read' });
    } catch (error) {
        console.error('Error marking all notifications as read:', error);
        res.status(500).json({ error: 'Failed to mark all notifications as read' });
    }
};