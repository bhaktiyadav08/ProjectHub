const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  group: { type: mongoose.Schema.Types.ObjectId, ref: 'Group', required: true },
  sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  message: { type: String, required: true },
  messageType: { type: String, enum: ['text', 'file', 'system'], default: 'text' },
  fileUrl: { type: String }, // if messageType is 'file'
  isEdited: { type: Boolean, default: false },
  editedAt: { type: Date },
  reactions: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    emoji: { type: String }
  }]
}, { timestamps: true });

module.exports = mongoose.model('Message', messageSchema);