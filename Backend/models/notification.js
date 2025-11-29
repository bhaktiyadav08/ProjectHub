const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  message: { type: String },
  type: { type: String },
  relatedTask: { type: mongoose.Schema.Types.ObjectId, ref: 'Task' },
  group: { type: mongoose.Schema.Types.ObjectId, ref: 'Group' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  isRead: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Notification', notificationSchema);
