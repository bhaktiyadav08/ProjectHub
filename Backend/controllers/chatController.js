const Message = require('../models/Chat');

// Get chat messages for a group
exports.getGroupMessages = async (req, res) => {
  try {
    const { groupId } = req.params;
    
    const messages = await Message.find({ group: groupId })
      .populate('sender', 'username email')
      .sort({ createdAt: -1 })
      .limit(50);

    res.json({
      success: true,
      messages: messages.reverse(), // Return in chronological order
      total: messages.length
    });
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch messages' });
  }
};

// Send a message
exports.sendMessage = async (req, res) => {
  try {
    const { groupId } = req.params;
    const { message } = req.body;

    if (!message || message.trim() === '') {
      return res.status(400).json({ success: false, error: 'Message cannot be empty' });
    }

    const newMessage = new Message({
      group: groupId,
      sender: req.user.id,
      message: message.trim()
    });

    await newMessage.save();
    await newMessage.populate('sender', 'username email');

    // Emit socket event
    const io = req.app.get('io');
    io.to(groupId).emit('new_message', newMessage);

    res.status(201).json({ success: true, message: newMessage });
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ success: false, error: 'Failed to send message' });
  }
};

// Edit a message
exports.editMessage = async (req, res) => {
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
      return res.status(404).json({ success: false, error: 'Message not found or unauthorized' });
    }

    const io = req.app.get('io');
    io.to(updatedMessage.group.toString()).emit('message_updated', updatedMessage);

    res.json({ success: true, message: updatedMessage });
  } catch (error) {
    console.error('Error editing message:', error);
    res.status(500).json({ success: false, error: 'Failed to edit message' });
  }
};

// Delete a message
exports.deleteMessage = async (req, res) => {
  try {
    const { messageId } = req.params;

    const message = await Message.findOneAndDelete({
      _id: messageId,
      sender: req.user.id
    });

    if (!message) {
      return res.status(404).json({ success: false, error: 'Message not found or unauthorized' });
    }

    const io = req.app.get('io');
    io.to(message.group.toString()).emit('message_deleted', messageId);

    res.json({ success: true, message: 'Message deleted successfully' });
  } catch (error) {
    console.error('Error deleting message:', error);
    res.status(500).json({ success: false, error: 'Failed to delete message' });
  }
};
