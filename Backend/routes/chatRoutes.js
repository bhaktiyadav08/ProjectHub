const express = require('express');
const router = express.Router();
const Message = require('../models/Chat');
const { protect } = require('../middleware/authMiddleware');

// Get chat messages for a group
router.get('/:groupId', protect, async (req, res) => {
  try {
    const { groupId } = req.params;
    const { page = 1, limit = 50 } = req.query;

    const messages = await Message.find({ group: groupId })
      .populate('sender', 'username email')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    res.json({
      messages: messages.reverse(), // Return in chronological order
      totalPages: Math.ceil(await Message.countDocuments({ group: groupId }) / limit),
      currentPage: page
    });
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

// Send a message
router.post('/:groupId', protect, async (req, res) => {
  try {
    const { groupId } = req.params;
    const { message, messageType = 'text' } = req.body;

    const newMessage = new Message({
      group: groupId,
      sender: req.user.id,
      message,
      messageType
    });

    await newMessage.save();
    await newMessage.populate('sender', 'username email');

    // Emit socket event
    const io = req.app.get('io');
    io.to(groupId).emit('new_message', newMessage);

    res.status(201).json(newMessage);
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ error: 'Failed to send message' });
  }
});

// Edit a message
router.put('/:messageId', protect, async (req, res) => {
  try {
    const { messageId } = req.params;
    const { message } = req.body;

    const updatedMessage = await Message.findOneAndUpdate(
      { _id: messageId, sender: req.user.id },
      { 
        message, 
        isEdited: true, 
        editedAt: new Date() 
      },
      { new: true }
    ).populate('sender', 'username email');

    if (!updatedMessage) {
      return res.status(404).json({ error: 'Message not found or unauthorized' });
    }

    const io = req.app.get('io');
    io.to(updatedMessage.group.toString()).emit('message_updated', updatedMessage);

    res.json(updatedMessage);
  } catch (error) {
    console.error('Error editing message:', error);
    res.status(500).json({ error: 'Failed to edit message' });
  }
});

// Delete a message
router.delete('/:messageId', protect, async (req, res) => {
  try {
    const { messageId } = req.params;

    const message = await Message.findOneAndDelete({
      _id: messageId,
      sender: req.user.id
    });

    if (!message) {
      return res.status(404).json({ error: 'Message not found or unauthorized' });
    }

    const io = req.app.get('io');
    io.to(message.group.toString()).emit('message_deleted', messageId);

    res.json({ message: 'Message deleted successfully' });
  } catch (error) {
    console.error('Error deleting message:', error);
    res.status(500).json({ error: 'Failed to delete message' });
  }
});

module.exports = router;