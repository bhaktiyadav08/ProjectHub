const Task = require("../models/Task");
const Notification = require('../models/notification'); // ADD THIS AT TOP
// CREATE a new task - FIXED VERSION
exports.createTask = async (req, res) => {
  try {
    const { group, title, description, dueDate, assignedMembers, weight, status } = req.body;

    // Create the task
    const task = await Task.create({
      group,
      title,
      description,
      dueDate,
      assignedMembers,
      weight: weight || 1,
      createdBy: req.user.id,
      status: 'Not Started' // ✅ Fixed: 'Not Started' not 'Not started'
    });

    // Populate for response
    await task.populate('assignedMembers', 'username email');
    await task.populate('createdBy', 'username');

    // ✅ FIXED: Create database notifications for EACH assigned member
    if (assignedMembers && assignedMembers.length > 0) {
      const Notification = require('../models/notification'); // Make sure to import
      
      const notificationPromises = assignedMembers.map(async (userId) => {
        const notification = new Notification({
          recipient: userId, // ✅ FIXED: Use the current userId in loop, not assignedMembers[0]
          title: 'New Task Assigned',
          message: `You have been assigned a new task: "${title}" by ${req.user.username}`,
          type: 'task_assigned',
          relatedTask: task._id,
          group: group,
          createdBy: req.user.id // ✅ FIXED: Use req.user.id (not req.user._id)
        });
        return await notification.save();
      });

      await Promise.all(notificationPromises);
      console.log(`💾 Database notifications created for ${assignedMembers.length} users`);
    }

    // ✅ FIXED: Send real-time notifications via Socket.io
    const io = req.app.get('io');
    if (io) {
      io.emit('task_assigned', {
        assignedTo: assignedMembers, // Array of user IDs
        taskTitle: title,
        assignedBy: req.user.username,
        assignedById: req.user.id,
        taskId: task._id,
        groupId: group
      });
      console.log(`📢 Real-time notification event emitted for task: ${title}`);
    }

    res.status(201).json({ success: true, task });
  } catch (error) {
    console.error("Error creating task:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// GET all tasks of a group
exports.getTasksByGroup = async (req, res) => { // ✅ RENAME to match your route
  try {
    const { groupId } = req.params;
    const tasks = await Task.find({ group: groupId })
      .populate("group", "name")
      .populate("assignedMembers", "username email")
      .populate("createdBy", "username")
      .sort({ createdAt: -1 });

    res.json(tasks);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find();
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch users" });
  }
};

// PROGRESS CALCULATION
exports.getGroupProgress = async (req, res) => {
    try {
        const { groupId } = req.params;
        
        const tasks = await Task.find({ group: groupId })
            .populate("assignedMembers", "username")
            .populate("createdBy", "username");

        if (!tasks || tasks.length === 0) {
            return res.json({
                progress: 0,
                breakdown: { completed: 0, inProgress: 0, notStarted: 0 },
                totalTasks: 0,
                completedTasks: 0
            });
        }

        let totalWeight = 0;
        let completedWeight = 0;
        let statusCount = { completed: 0, inProgress: 0, notStarted: 0 };

        tasks.forEach(task => {
            const weight = task.weight || 1;
            totalWeight += weight;
            
            if (task.status === "Completed") {
                completedWeight += weight;
                statusCount.completed += weight;
            } else if (task.status === "In Progress") {
                statusCount.inProgress += weight;
            } else {
                statusCount.notStarted += weight;
            }
        });

        const progress = totalWeight > 0 ? Math.round((completedWeight / totalWeight) * 100) : 0;
        const completedTasks = tasks.filter(task => task.status === "Completed").length;

        res.json({
            progress,
            breakdown: statusCount,
            totalTasks: tasks.length,
            completedTasks
        });
    } catch (error) {
        console.error('Progress calculation error:', error);
        res.status(500).json({ error: 'Failed to calculate progress' });
    }
};

// ✅ FIXED UPDATE TASK FUNCTION
exports.updateTask = async (req, res) => {
    try {
        const { id } = req.params; // ✅ Using 'id' as parameter name
        const updates = req.body;
        
        
        const task = await Task.findByIdAndUpdate(
            id, // ✅ Fixed: use 'id' not 'taskId'
            updates, 
            { new: true, runValidators: true }
        )
        .populate('assignedMembers', 'username email')
        .populate('createdBy', 'username');

        if (!task) {
          
            return res.status(404).json({ error: "Task not found" });
        }
        
      
        res.json({ 
            task, 
            message: "Task updated successfully" 
        });
    } catch (error) {
        
        res.status(400).json({ error: error.message });
    }
};

// ✅ FIXED DELETE TASK FUNCTION
exports.deleteTask = async (req, res) => {
    try {
        const { id } = req.params;
        
        console.log('🗑️ Backend: Deleting task:', id);
        
        const task = await Task.findByIdAndDelete(id); // ✅ FIXED: was 'IDBCursor' - typo!
        
        if (!task) {
            
            return res.status(404).json({ error: "Task not found" });
        }
        res.json({ 
            message: "Task deleted successfully" 
        });
    } catch (error) {
        
        res.status(400).json({ error: error.message });
    }
};
exports.getMyTasks = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    console.log("🔄 Loading tasks for user:", userId);
    const { groupId } = req.query; // Get groupId from query params
    let query = { assignedMembers: userId };
    
    // ✅ ADD GROUP FILTER if groupId is provided
    if (groupId) {
      query.group = groupId;
    }
    // ✅ FIX: Use 'group' instead of 'groupId' - match your Task model
    const tasks = await Task.find({ 
      assignedMembers: userId 
    })
    .populate("group", "name")           // ✅ CORRECT: 'group' not 'groupId'
    .populate("assignedMembers", "username email")
    .populate("createdBy", "username")
    .sort({ createdAt: -1 });

    console.log(`✅ Found ${tasks.length} tasks for user ${userId} in group ${groupId}`);
    
    res.json(tasks);
  } catch (err) {
    console.error("❌ Error fetching user tasks:", err);
    res.status(500).json({ 
      message: "Server error while fetching user tasks",
      error: err.message 
    });
  }
};