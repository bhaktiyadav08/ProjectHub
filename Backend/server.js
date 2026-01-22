// server.js
const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const path = require("path");
const Notification=require('./models/notification');
dotenv.config();
const http = require('http');
const socketIo = require('socket.io');
const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "http://localhost:3000", // Your frontend URL
    methods: ["GET", "POST"]
  }
});
// Store connected users
const connectedUsers = new Map();
const onlineUsers = new Map();
io.on('connection', (socket) => {
  console.log('🔌 User connected:', socket.id);

  // User joins with their userId
  socket.on('user_join', (data) => {
     let userId, groupId, username;
     if (typeof data === 'object') {
    // New format: { userId, groupId, username }
    userId = data.userId;
    groupId = data.groupId;
    username = data.username;
  } else {
    // Old format: just userId string
    userId = data;
    groupId = null; // Will be set when user joins a specific group
    username = 'User';
  }
    connectedUsers.set(userId, socket.id);
    console.log(`👤 User ${userId} connected with socket ${socket.id}`);
    // Add user to online users for this group
  if (groupId) {
    if (!onlineUsers.has(groupId)) {
      onlineUsers.set(groupId, new Set());
    }
      const userInfo = { userId, username, socketId: socket.id };
    onlineUsers.get(groupId).add(userInfo);
    io.to(groupId).emit('online_users_update', {
      onlineCount: onlineUsers.get(groupId).size,
      onlineUsers: Array.from(onlineUsers.get(groupId)).map(u => ({ 
        userId: u.userId, 
        username: u.username 
      }))
    });}
    else {
    console.log(`👤 User ${userId} connected with socket ${socket.id}`);
  }
  });
 // Join group room for chat
  socket.on('join_group', (groupId) => {
    socket.join(groupId);
    console.log(`👥 User joined group room: ${groupId}`);
      // Send current online users to this user only
    if (onlineUsers.has(groupId)) {
      const groupOnlineUsers = onlineUsers.get(groupId);
      socket.emit('online_users_update', {
        onlineCount: groupOnlineUsers.size,
        onlineUsers: Array.from(groupOnlineUsers).map(u => ({ 
          userId: u.userId, 
          username: u.username 
        }))
      });}
  });

  // Leave group room
  socket.on('leave_group', (groupId) => {
    socket.leave(groupId);
    console.log(`👋 User left group room: ${groupId}`);
  });

  // Handle typing indicators
  socket.on('typing_start', (data) => {
    socket.to(data.groupId).emit('user_typing', {
      userId: data.userId,
      username: data.username
    });
  });

  socket.on('typing_stop', (data) => {
    socket.to(data.groupId).emit('user_stop_typing', {
      userId: data.userId
    });
  });
// Handle disconnect
  socket.on('disconnect', () => {
    console.log('❌ User disconnected:', socket.id);
    
    // Remove user from all groups
    for (let [groupId, users] of onlineUsers.entries()) {
      let userToRemove = null;
      
      for (let user of users) {
        if (user.socketId === socket.id) {
          userToRemove = user;
          break;
        }
      }
      
      if (userToRemove) {
        users.delete(userToRemove);
        console.log(`👋 User ${userToRemove.username} left group: ${groupId}`);
        
        // Notify group about updated online count
        io.to(groupId).emit('online_users_update', {
          onlineCount: users.size,
          onlineUsers: Array.from(users).map(u => ({ 
            userId: u.userId, 
            username: u.username 
          }))
        });
        
        // Remove group if empty
        if (users.size === 0) {
          onlineUsers.delete(groupId);
        }
      }
    }
    
    // Remove from connected users
    for (let [userId, socketId] of connectedUsers.entries()) {
      if (socketId === socket.id) {
        connectedUsers.delete(userId);
        break;
      }
    }
  });
  // Handle task assignment notifications - FIXED VERSION
socket.on('task_assigned', async (data) => {
    try {
        const { assignedTo, taskTitle, assignedBy, taskId, groupId } = data;
        
        console.log('📝 Processing task assignment notifications:', {
            assignedTo, taskTitle, assignedBy, taskId, groupId
        });

        // Import Notification model (make sure you have this at the top of server.js)
        const Notification = require('./models/notification');
        
        // Process each assigned user
        const notificationPromises = assignedTo.map(async (userId) => {
            try {
                // 1. CREATE NOTIFICATION IN DATABASE
                const notification = new Notification({
                    recipient: userId, // The user who should receive the notification
                    title: 'New Task Assigned',
                    message: `You have been assigned to task: "${taskTitle}" by ${assignedBy}`,
                    type: 'task_assigned',
                    relatedTask: taskId,
                    group: groupId,
                    createdBy: assignedBy, // This should be the user ID of the assigner
                    isRead: false
                });
                
                await notification.save();
                console.log(`✅ Notification saved to database for user ${userId}`);
                
                // 2. SEND REAL-TIME NOTIFICATION VIA SOCKET
                const userSocketId = connectedUsers.get(userId.toString());
                if (userSocketId) {
                    io.to(userSocketId).emit('new_task_notification', {
                        taskTitle,
                        assignedBy,
                        message: `New task assigned: "${taskTitle}" by ${assignedBy}`,
                        notificationId: notification._id // Include the saved notification ID
                    });
                    console.log(`📬 Real-time notification sent to user ${userId}`);
                }
                
                return notification;
            } catch (error) {
                console.error(`❌ Error creating notification for user ${userId}:`, error);
                return null;
            }
        });
        
        // Wait for all notifications to be processed
        const results = await Promise.all(notificationPromises);
        const successfulNotifications = results.filter(n => n !== null);
        
        console.log(`🎉 Successfully created ${successfulNotifications.length} notifications`);
        
    } catch (error) {
        console.error('💥 Error in task_assigned handler:', error);
    }
});
  socket.on('disconnect', () => {
    // Remove user from connected users
    for (let [userId, socketId] of connectedUsers.entries()) {
      if (socketId === socket.id) {
        connectedUsers.delete(userId);
        console.log(`👤 User ${userId} disconnected`);
        break;
      }
    }
  });
});

// Make io available to other files
app.set('io', io);

server.listen(5000, () => {
  console.log('Server running with Socket.io on port 5000');
});
// Middleware
app.use(express.json());

// 👉 Serve static frontend files (HTML, CSS, JS)
app.use(express.static(path.join(__dirname, "../Frontend")));

// Import Routes
const authRoutes = require("./routes/authRoutes");
const groupRoutes = require("./routes/groupRoutes");
const projectRoutes = require("./routes/projectRoutes");
const taskRoutes = require("./routes/taskRoutes");
const fileRoutes = require("./routes/fileRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const chatRoutes = require('./routes/chatRoutes');

// Use Routes
app.use("/api/auth", authRoutes);
app.use("/api/groups", groupRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/files", fileRoutes);
app.use("/api/notifications",notificationRoutes);
app.use("/api/chat", chatRoutes);
// Error Middleware (if you made one)
const errorMiddleware = require("./middleware/errorMiddleware");
app.use(errorMiddleware);

// Add this authentication middleware before your routes
const authenticate = (req, res, next) => {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
        return res.status(401).json({ error: 'Access denied. No token provided.' });
    }
    
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        res.status(400).json({ error: 'Invalid token.' });
    }
};
// Fallback (for frontend routing)
app.get('/', (req, res) => {
  // If the request is API‑route, maybe respond with JSON 404
  if (req.originalUrl.startsWith('/api/')) {
    res.status(404).json({ message: "API route not found" });
  } else {
    res.sendFile(path.join(__dirname, "../Frontend/Home_page.html"));
  }
});

// ✅ Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI,)
  .then(() => {
    console.log("✅ MongoDB connected successfully");
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () =>
      console.log(`🚀 Server running on http://localhost:${PORT}`)
    );
  })
  .catch((err) => {
    console.error("❌ MongoDB connection error:", err.message);
    process.exit(1);
  });
// Get tasks for current user
// Get tasks for current user - FIXED VERSION
app.get('/api/my-tasks', authenticate, async (req, res) => {
    try {
        const tasks = await Task.find({ 
            assignedMembers: req.user.userId  // Only tasks assigned to current user
        })
        .populate('assignedMembers', 'username email')
        .sort({ createdAt: -1 });
        
        res.json(tasks);
    } catch (error) {
        console.error('Error fetching user tasks:', error);
        res.status(500).json({ error: 'Failed to fetch tasks' });
    }
});

// Get notifications for current user
app.get('/api/notifications', authenticate, async (req, res) => {
    try {
        const notifications = await Notification.find({ 
            userId: req.user.userId,
            isRead: false 
        }).sort({ createdAt: -1 }).limit(10);
        res.json(notifications);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch notifications' });
    }
});

// Mark all notifications as read
app.put('/api/notifications/read-all', authenticate, async (req, res) => {
    try {
        await Notification.updateMany(
            { userId: req.user.userId, isRead: false },
            { $set: { isRead: true } }
        );
        res.json({ message: 'All notifications marked as read' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to update notifications' });
    }
});
