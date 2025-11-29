// Helper function to detect current page
function getCurrentPageType() {
    const path = window.location.pathname;
    if (path.includes('Group_Info')) return 'group-info';
    if (path.includes('Task_Assigned') || path.includes('Task_Management')) return 'tasks';
    if (path.includes('Project_Progress')) return 'progress';
    if (path.includes('Files_List')) return 'files';
    return 'other';
}

const pageType = getCurrentPageType();
console.log('📍 Page type:', pageType);
// ===== SOCKET.IO CLIENT SETUP =====
let socket = null;
// ===== CHAT FUNCTIONALITY =====
let chatSocket = null;
let isTyping = false;
let typingTimeout = null;
let onlineUsers = []; // Store online user
// Initialize chat
function initChat() {
    const groupId = localStorage.getItem('currentGroupId');
    const token = localStorage.getItem('token');
    const currentUserId = localStorage.getItem('userId');
    
    if (!groupId || !token) {
        console.error('Cannot initialize chat: Missing groupId or token');
        return;
    }

    console.log('💬 Initializing chat for group:', groupId);
    
    // Connect to Socket.io if not already connected
    if (!chatSocket) {
        chatSocket = io('http://localhost:5000');
        
        // Join group room
        chatSocket.emit('join_group', groupId);
        
        // Setup chat event listeners
        setupChatEvents();
    }
    
    // Load existing messages
    loadChatMessages();
    
    // Update group name in header
    updateChatGroupName();
}

// Setup chat socket events
function setupChatEvents() {
    if (!chatSocket) return;
    
    chatSocket.on('new_message', (message) => {
        console.log('📨 New message received:', message);
        addChatMessage(message);
        scrollChatToBottom();
    });
      // ✅ ADD THIS: Online users update
    chatSocket.on('online_users_update', (data) => {
        console.log('👥 Online users updated:', data);
        onlineUsers = data.onlineUsers || [];
        updateOnlineUsersDisplay(data);
    });
    chatSocket.on('message_updated', (message) => {
        updateChatMessage(message);
    });
    
    chatSocket.on('message_deleted', (messageId) => {
        removeChatMessage(messageId);
    });
    
    chatSocket.on('user_typing', (data) => {
        showTypingIndicator(data);
    });
    
    chatSocket.on('user_stop_typing', (data) => {
        hideTypingIndicator(data);
    });
}
// ✅ ADD THIS FUNCTION: Update online users display
function updateOnlineUsersDisplay(data) {
    const onlineCountElement = document.getElementById('onlineCount');
    const onlineUsersContainer = document.getElementById('onlineUsersList');
    
    if (onlineCountElement) {
        const count = data.onlineCount || 0;
        onlineCountElement.textContent = `${count} user${count !== 1 ? 's' : ''} online`;
    }
    
    // Create online users list if container exists
    if (onlineUsersContainer) {
        if (onlineUsers.length > 0) {
            onlineUsersContainer.innerHTML = onlineUsers.map(user => 
                `<div class="online-user-item">
                    <span class="online-dot"></span>
                    ${user.username}
                </div>`
            ).join('');
        } else {
            onlineUsersContainer.innerHTML = '<div class="no-users">No users online</div>';
        }
    }
}

// Load chat messages from API
async function loadChatMessages() {
    const groupId = localStorage.getItem('currentGroupId');
    const token = localStorage.getItem('token');
    
    try {
        const response = await fetch(`/api/chat/${groupId}`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (response.ok) {
            const data = await response.json();
            renderChatMessages(data.messages);
            scrollChatToBottom();
        }
    } catch (error) {
        console.error('Error loading chat messages:', error);
    }
}

// Render chat messages
function renderChatMessages(messages) {
    const container = document.getElementById('chatMessages');
    if (!container) return;
    
    if (messages.length === 0) {
        container.innerHTML = `
            <div class="no-messages">
                <i class="fas fa-comments" style="font-size: 3rem; color: #ccc; margin-bottom: 15px;"></i>
                <h3 style="color: #666;">No messages yet</h3>
                <p style="color: #888;">Start a conversation with your group!</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = messages.map(message => createChatMessageHTML(message)).join('');
}

// Create HTML for a message
function createChatMessageHTML(message) {
    const currentUserId = localStorage.getItem('userId');
    const isOwnMessage = message.sender._id === currentUserId;
    
    const messageTime = new Date(message.createdAt).toLocaleTimeString([], { 
        hour: '2-digit', 
        minute: '2-digit' 
    });
    
    return `
        <div class="message ${isOwnMessage ? 'own' : 'other'}" data-message-id="${message._id}">
            <div class="message-sender">${message.sender.username}</div>
            <div class="message-text">${message.message}</div>
            <div class="message-time">
                ${messageTime}
                ${message.isEdited ? ' (edited)' : ''}
            </div>
        </div>
    `;
}

// Add new message to chat
function addChatMessage(message) {
    const container = document.getElementById('chatMessages');
    if (!container) return;
    
    if (container.querySelector('.no-messages')) {
        container.innerHTML = '';
    }
    
    container.innerHTML += createChatMessageHTML(message);
}

// Send chat message
async function sendChatMessage() {
    const messageInput = document.getElementById('messageInput');
    const groupId = localStorage.getItem('currentGroupId');
    const token = localStorage.getItem('token');
    
    if (!messageInput || !messageInput.value.trim()) return;
    
    const messageText = messageInput.value.trim();
    
    try {
        const response = await fetch(`/api/chat/${groupId}`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ message: messageText })
        });
        
        if (response.ok) {
            messageInput.value = '';
            stopTyping();
        }
    } catch (error) {
        console.error('Error sending message:', error);
        alert('Error sending message. Please check your connection.');
    }
}

// Handle enter key in chat
function handleChatKeyPress(event) {
    if (event.key === 'Enter') {
        sendChatMessage();
    } else {
        handleChatTyping();
    }
}

// Handle typing indicator
function handleChatTyping() {
    const groupId = localStorage.getItem('currentGroupId');
    const currentUserId = localStorage.getItem('userId');
    const username = localStorage.getItem('username') || 'User';
    
    if (!isTyping) {
        isTyping = true;
        chatSocket.emit('typing_start', {
            groupId: groupId,
            userId: currentUserId,
            username: username
        });
    }
    
    clearTimeout(typingTimeout);
    typingTimeout = setTimeout(() => {
        stopTyping();
    }, 1000);
}

// Stop typing indicator
function stopTyping() {
    const groupId = localStorage.getItem('currentGroupId');
    const currentUserId = localStorage.getItem('userId');
    
    isTyping = false;
    chatSocket.emit('typing_stop', {
        groupId: groupId,
        userId: currentUserId
    });
}

// Show typing indicator
function showTypingIndicator(data) {
    const indicator = document.getElementById('typingIndicator');
    if (indicator && data.userId !== localStorage.getItem('userId')) {
        indicator.textContent = `${data.username} is typing...`;
    }
}

// Hide typing indicator
function hideTypingIndicator(data) {
    const indicator = document.getElementById('typingIndicator');
    if (indicator) {
        indicator.textContent = '';
    }
}

// Scroll chat to bottom
function scrollChatToBottom() {
    const container = document.getElementById('chatMessages');
    if (container) {
        container.scrollTop = container.scrollHeight;
    }
}

// Update group name in chat header
async function updateChatGroupName() {
    const logoElem = document.getElementById('groupLogo');
    const groupId = localStorage.getItem('currentGroupId');
    const token = localStorage.getItem('token');
    
    if (!logoElem) return;
    
    try {
        const response = await fetch(`/api/groups/${groupId}`, {
            headers: { "Authorization": `Bearer ${token}` }
        });
        
        if (response.ok) {
            const data = await response.json();
            const group = data.group || data;
            logoElem.textContent = `🚀 ${group.name} - Chat`;
        }
    } catch (error) {
        console.error('Error loading group name for chat:', error);
         logoElem.textContent = `🚀 Group Chat`;
    }
}

// Initialize chat when page loads (for chat page)
function initChatPage() {
    console.log('💬 Initializing Chat Page...');
    initChat();
    
    // Update user status button
    const userStatusBtn = document.getElementById('userStatusBtn');
    const role = localStorage.getItem('role');
    if (userStatusBtn && role) {
        userStatusBtn.textContent = `${role.toUpperCase()} LOGGED-IN`;
    }
}

function initializeSocket() {
    // Only initialize if not already connected
    if (!socket) {
        socket = io('http://localhost:5000');
        
        const userId = localStorage.getItem("userId");
        const token = localStorage.getItem("token");
        
        if (userId && token) {
            socket.emit('user_join', userId);
            console.log('🔌 Socket.io connected for user:', userId);
        }
        
        // Listen for real-time notifications
        socket.on('new_task_notification', function(data) {
            console.log('📬 Real-time notification received:', data);
            showMessage(data.message, 'success');
            loadNotifications(); // Refresh notifications list
        });
        
        socket.on('connect', () => {
            console.log('✅ Connected to server via Socket.io');
        });
        
        socket.on('disconnect', () => {
            console.log('❌ Disconnected from server');
        });
    }
}

  // === LOGOUT SECTION ===
  if (groupLogoutBtn) {
    groupLogoutBtn.addEventListener("click", () => {
      console.log('🔍 Before group logout - localStorage:', {
            token: localStorage.getItem("token"),
            role: localStorage.getItem("role"), 
            userId: localStorage.getItem("userId"),
            currentGroupId: localStorage.getItem("currentGroupId")
        });
        // ✅ ONLY CLEAR GROUP-SPECIFIC DATA, KEEP USER LOGIN
        localStorage.removeItem("currentGroupId");
        localStorage.removeItem("currentGroupName");
        // Keep: token, role, userId, etc.
        
        const role = localStorage.getItem("role");
        if (role === "admin") {
            window.location.href = "/Admin_Home_Page.html";
        } else {
            window.location.href = "/User_Home_Page.html";
        }
        // Optional: Show a different message
        alert("Left group workspace successfully!");
    });
}


// ===== PROGRESS MANAGER CLASS ===== 
// ADD THIS ENTIRE CLASS AT THE VERY BEGINNING OF THE FILE
class ProgressManager {
    constructor(groupId, token) {
        this.groupId = groupId;
        this.token = token;
        this.progressChart = null;
        this.taskStatusChart = null;
        this.progressData = {
            percentage: 0,
            breakdown: { completed: 0, inProgress: 0, notStarted: 0 },
            totalTasks: 0,
            completedTasks: 0,
            recentTasks: []
        };
    }

    // Fetch progress data from backend
    async fetchProgress() {
        try {
            const response = await fetch(`/api/tasks/progress/${this.groupId}`, {
                headers: { 
                    "Authorization": `Bearer ${this.token}`,
                    "Content-Type": "application/json" 
                }
            });
            
            if (!response.ok) throw new Error('Failed to fetch progress');
            
            const data = await response.json();
            this.progressData = {
                percentage: data.progress || 0,
                breakdown: data.breakdown || { completed: 0, inProgress: 0, notStarted: 0 },
                totalTasks: data.totalTasks || 0,
                completedTasks: data.completedTasks || 0
            };
            
            return this.progressData;
        } catch (error) {
            console.error('Error fetching progress:', error);
            return this.progressData;
        }
    }

    // Update progress statistics
    updateProgressStats() {
        const progressPercentage = document.getElementById('progress-percentage');
        const totalTasks = document.getElementById('total-tasks');
        const completedTasks = document.getElementById('completed-tasks');
        
        if (progressPercentage) progressPercentage.textContent = `${this.progressData.percentage}%`;
        if (totalTasks) totalTasks.textContent = this.progressData.totalTasks;
        if (completedTasks) completedTasks.textContent = this.progressData.completedTasks;
    }

    // Render progress chart
    renderProgressChart() {
        const ctx = document.getElementById('progressChart');
        if (!ctx) return;

        if (this.progressChart) {
            this.progressChart.destroy();
        }

        this.progressChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Completed', 'In Progress', 'Not Started'],
                datasets: [{
                    data: [
                        this.progressData.breakdown.completed,
                        this.progressData.breakdown.inProgress,
                        this.progressData.breakdown.notStarted
                    ],
                    backgroundColor: ['#4CAF50', '#FFC107', '#F44336'],
                    borderWidth: 2,
                    borderColor: '#fff'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return `${context.label}: ${context.raw}`;
                            }
                        }
                    }
                },
                cutout: '70%'
            }
        });
    }

    // Render task status chart
    renderTaskStatusChart() {
        const ctx = document.getElementById('taskStatusChart');
        if (!ctx) return;

        if (this.taskStatusChart) {
            this.taskStatusChart.destroy();
        }

        this.taskStatusChart = new Chart(ctx, {
            type: 'pie',
            data: {
                labels: ['Completed', 'In Progress', 'Not Started'],
                datasets: [{
                    data: [
                        this.progressData.breakdown.completed,
                        this.progressData.breakdown.inProgress,
                        this.progressData.breakdown.notStarted
                    ],
                    backgroundColor: ['#4CAF50', '#FFC107', '#F44336']
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: 'bottom'
                    }
                }
            }
        });
    }

    // Refresh all progress displays
    async refreshAll() {
        await this.fetchProgress();
        this.updateProgressStats();
        this.renderProgressChart();
        this.renderTaskStatusChart();
    }
}
// ===== MEMBER-SPECIFIC FUNCTIONS =====

// Load tasks for current user (Member view)
async function loadMyTasks() {
  const token = localStorage.getItem("token");
  const currentUserId = localStorage.getItem("userId");
  const groupId = localStorage.getItem("currentGroupId");

  console.log("🔄 Loading tasks for user:", currentUserId);
  console.log("GroupId:", groupId);
  console.log("Token:", token);

  if (!token) {
    console.error("No token found in localStorage!");
    return;
  }

  try {
    const response = await fetch(`/api/tasks/my-tasks?groupId=${groupId}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Server returned:", response.status, errorText);
      throw new Error(`Server returned ${response.status}: ${errorText}`);
    }

    const tasks = await response.json();
    console.log("✅ Loaded tasks for current group:",tasks.length, tasks);
    renderMyTasks(tasks);
  } catch (error) {
    console.error("❌ Error loading tasks:", error);
    document.getElementById("tasksContainer").innerHTML = `
      <div class="no-tasks">
        <i class="fas fa-exclamation-triangle" style="font-size:3rem;color:red"></i>
        <h3>Error loading tasks</h3>
        <p>${error.message}</p>
        <button onclick="location.reload()">Try Again</button>
      </div>`;
  }
}

// Render tasks for member view
function renderMyTasks(tasks) {
    const container = document.getElementById('tasksContainer');
    if (!container) {
        console.error('Tasks container not found!');
        return;
    }

    container.innerHTML = '';

    if (!tasks || tasks.length === 0) {
        container.innerHTML = `
            <div class="no-tasks">
                <i class="fas fa-clipboard-list" style="font-size: 3rem; color: #ccc; margin-bottom: 20px;"></i>
                <h3 style="color: #666;">No tasks assigned to you yet</h3>
                <p style="color: #888;">Tasks assigned by your leader will appear here</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = tasks.map(task => {
        // Convert backend status to frontend format
        const getStatusClass = (status) => {
            switch(status) {
                case 'Completed': return 'completed';
                case 'In Progress': return 'in-progress';
                default: return 'pending';
            }
        };

        const statusClass = getStatusClass(task.status);
        const groupName = task.group ? task.group.name : 'Unknown Group';
        return `
        <div class="task-card priority-${task.priority || 'medium'}">
            <div class="task-header">
                <h3 class="task-title">${task.title}</h3>
                <span class="task-status status-${statusClass}">${task.status}</span>
            </div>
            
            ${task.description ? `<p class="task-description">${task.description}</p>` : ''}
            
            <div class="task-meta">
                <div>
                    <div><strong>Due:</strong> <span class="task-due-date">${task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'No due date'}</span></div>
                   <div><strong>Group:</strong> ${groupName}</div>
                    <div><strong>Assigned to:</strong> ${task.assignedMembers ? task.assignedMembers.map(m => m.username).join(', ') : 'Not assigned'}</div>
                </div>
                <div class="task-priority priority-${task.priority}">
                    ${task.priority ? `Priority: ${task.priority}` : ''}
                </div>
            </div>
            
            <div class="task-actions">
                ${task.status === 'Not Started' ? 
                    `<button class="task-btn btn-start" onclick="updateMyTaskStatus('${task._id}', 'in-progress')">
                        <i class="fas fa-play"></i> Start Task
                    </button>` : ''}
                
                ${task.status === 'In Progress' ? 
                    `<button class="task-btn btn-complete" onclick="updateMyTaskStatus('${task._id}', 'completed')">
                        <i class="fas fa-check"></i> Mark Complete
                    </button>` : ''}
                
                ${task.status === 'Completed' ? 
                    `<button class="task-btn btn-completed" disabled>
                        <i class="fas fa-check-circle"></i> Completed
                    </button>` : ''}
            </div>
        </div>
        `;
    }).join('');
}

// Update task status for member
async function updateMyTaskStatus(taskId, status) {
    try {
       const token = localStorage.getItem("token"); // ADD THIS
        // Convert status to match your backend format
        let backendStatus;
        switch(status) {
            case 'in-progress': backendStatus = 'In Progress'; break;
            case 'completed': backendStatus = 'Completed'; break;
            default: backendStatus = 'Not Started';
        }

        const response = await fetch(`/api/tasks/${taskId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({ status: backendStatus })
        });

        if (response.ok) {
            showMessage('Task status updated successfully!', 'success');
            // If socket is available, notify about status change
            if (socket) {
                const taskData = await response.json().catch(() => ({}));
                socket.emit('task_status_updated', {
                    taskId: taskId,
                    newStatus: backendStatus,
                    updatedBy: localStorage.getItem("userId")
                });
            }
            loadMyTasks(); // Reload tasks
        } else {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to update task');
        }
    } catch (error) {
        console.error('Error updating task:', error);
        showMessage('Error updating task status: ' + error.message, 'error');
    }
}
// Load notifications
async function loadNotifications() {
    try {
      const token = localStorage.getItem("token"); // ADD THIS
       console.log('🔄 Loading notifications...', { token: token ? 'exists' : 'missing' });
        // Add timeout to prevent hanging
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
      const response = await fetch('/api/notifications', { // REMOVE fetchWithAuth
            headers: { 
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json" 
            },
             signal: controller.signal
        });
        clearTimeout(timeoutId);
        
        console.log('📡 Notifications API response:', response.status, response.ok);
        if (!response.ok) throw new Error('Failed to fetch notifications');
        
        const notifications = await response.json();
        renderNotifications(notifications);
    } catch (error) {
        console.error('Error loading notifications:', error);
    }
}

// Render notifications
// Render notifications - FIXED VERSION
function renderNotifications(notifications) {
    const list = document.getElementById('notificationsList');
    const count = document.getElementById('notificationCount');
    
    if (!list || !count) {
        console.error('Notification elements not found');
        return;
    }
    
    // Count unread notifications
    const unreadCount = notifications.filter(n => !n.isRead).length;
    count.textContent = unreadCount;
    count.style.display = unreadCount > 0 ? 'block' : 'none';
    
    // Render notifications list
    if (notifications.length === 0) {
        list.innerHTML = '<div class="notification-item">No notifications</div>';
        return;
    }
    
    list.innerHTML = notifications.map(notification => `
        <div class="notification-item ${notification.isRead ? '' : 'unread'}" 
             onclick="markAsRead('${notification._id}')">
            <strong>${notification.title || 'Notification'}</strong>
            <p style="margin: 5px 0; font-size: 0.9rem; color: #666;">
                ${notification.message || 'No message'}
            </p>
            <small style="color: #888;">
                ${new Date(notification.createdAt).toLocaleString()}
            </small>
        </div>
    `).join('');
}

// Mark notification as read
async function markAsRead(notificationId) {
    try {
       const token = localStorage.getItem("token"); // ADD THIS LINE
      await fetch(`/api/notifications/${notificationId}/read`, {
            method: 'PUT',
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json"
            }
        });
        loadNotifications();
    } catch (error) {
        console.error('Error marking notification as read:', error);
    }
}
// Mark all notifications as read
async function markAllAsRead() {
    try {
      const token = localStorage.getItem("token"); // ADD THIS
        const response = await fetch('/api/notifications/read-all', {
            method: 'PUT',
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json"
            }
        });
        
        if (response.ok) {
            loadNotifications();
            showMessage('All notifications marked as read', 'success');
        } else {
            throw new Error('Failed to mark all as read');
        }
    } catch (error) {
        console.error('Error marking all notifications as read:', error);
         showMessage('Error marking notifications as read', 'error');
    }
}
// Show message toast
function showMessage(message, type) {
    // Create toast if it doesn't exist
    let toast = document.getElementById('toastMessage');
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'toastMessage';
        toast.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 15px 20px;
            background: ${type === 'success' ? '#28a745' : '#dc3545'};
            color: white;
            border-radius: 5px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            z-index: 1001;
            font-weight: bold;
        `;
        document.body.appendChild(toast);
    }
    
    toast.textContent = message;
    toast.style.background = type === 'success' ? '#28a745' : '#dc3545';
    toast.style.display = 'block';
    
    setTimeout(() => {
        toast.style.display = 'none';
    }, 3000);
}

// Initialize task assigned page
function initTaskAssignedPage() {
  let refreshInterval;
  console.log('🚀 Initializing Member Task Page...');
  initializeSocket();
  // ✅ ADD THIS ONE LINE:
  loadGroupName(); // ← Now group name will load!
    loadMyTasks();
    loadNotifications();
    const notificationBell = document.getElementById('notificationBell');
const notificationsDropdown = document.getElementById('notificationsDropdown');
    if (notificationBell && notificationsDropdown) {
        notificationBell.addEventListener('click', function(e) {
            e.stopPropagation();
            const isVisible = notificationsDropdown.style.display === 'block';
            notificationsDropdown.style.display = isVisible ? 'none' : 'block';
            
            if (!isVisible) {
                loadNotifications(); // Refresh when opening
            }
        });
    }
    // Close dropdown when clicking outside
    document.addEventListener('click', function(e) {
        if (notificationsDropdown && 
            !notificationBell.contains(e.target) && 
            !notificationsDropdown.contains(e.target)) {
            notificationsDropdown.style.display = 'none';
        }
    });
// ✅ Add this function (or use existing one):
async function loadGroupName() {
  const groupId = localStorage.getItem("currentGroupId");
  const token = localStorage.getItem("token");
  const logoElem = document.querySelector(".logo");

  if (!logoElem) return;

  try {
    const res = await fetch(`/api/groups/${groupId}`, {
      headers: { "Authorization": `Bearer ${token}` }
    });
    
    if (res.ok) {
      const data = await res.json();
      const group = data.group || data;
      logoElem.textContent = `🚀 ${group.name}`;
    }
  } catch (err) {
    console.error('Error loading group name:', err);
  }
}
    // Close dropdown when clicking outside
    document.addEventListener('click', function() {
        const dropdown = document.getElementById('notificationsDropdown');
        if (dropdown) {
            dropdown.style.display = 'none';
        }
    });
    
    // Mark all as read button
    const markAllReadBtn = document.getElementById('markAllReadBtn');
    if (markAllReadBtn) {
        markAllReadBtn.addEventListener('click', markAllAsRead);
    }
    
    // ✅ FIXED: Auto refresh with token validation
    refreshInterval = setInterval(() => {
        const token = localStorage.getItem("token");
        
        // Only refresh if we have a valid token
        if (token && token !== 'undefined' && token !== 'null') {
            console.log('🔄 Auto-refreshing tasks and notifications...');
            loadMyTasks();
            loadNotifications();
        } else {
            console.warn('⚠️ Token invalid, stopping auto-refresh');
            clearInterval(refreshInterval); // Stop the interval
            showMessage('Session expired. Please log in again.', 'error');
            setTimeout(() => {
                window.location.href = "login_page.html";
            }, 2000);
        }
    }, 30000); 
    // Clean up interval when leaving page
    window.addEventListener('beforeunload', () => {
        if (refreshInterval) {
            clearInterval(refreshInterval);
        }
    });
// 30 seconds
    
    // Clean up interval when leaving page
    window.addEventListener('beforeunload', () => {
        if (refreshInterval) {
            clearInterval(refreshInterval);
        }
    });
}
// === LEADER-SPECIFIC INITIALIZATION ===
async function initLeaderPages() {
    console.log('👑 Initializing Leader Pages');
    // Get variables from localStorage
    const token = localStorage.getItem("token");
    const groupId = localStorage.getItem("currentGroupId");
    const currentUserId = localStorage.getItem("userId");
    const userRole = localStorage.getItem("role");
    // Only run leader code if elements exist
    const taskModal = document.getElementById("taskModal");
    const tasksContainer = document.getElementById("tasksContainer");
    
    if (!taskModal || !tasksContainer) {
        console.log('⏭️ Skipping leader initialization - not on leader page');
        return;
    }
    
    // Your existing leader task management code here
    const openTaskBtn = document.getElementById("addTaskBtn");
    const closeTaskBtn = document.getElementById("closeModal");
    const saveTaskBtn = document.getElementById("saveTaskBtn");
    const taskMembers = document.getElementById("taskMembers");
    const taskTitle = document.getElementById("taskTitle");
    const taskDescription = document.getElementById("taskDescription");
    const taskDueDate = document.getElementById("taskDueDate");

    if (openTaskBtn && taskModal) {
        openTaskBtn.addEventListener("click", () => (taskModal.style.display = "flex"));
    }
    if (closeTaskBtn) {
    closeTaskBtn.addEventListener("click", () => (taskModal.style.display = "none"));
  }    

  window.addEventListener("click", (e) => {
    if (e.target === taskModal) taskModal.style.display = "none";
    });
    if (saveTaskBtn) {
        saveTaskBtn.addEventListener("click", async () => {
            const members = Array.from(taskMembers.selectedOptions).map((opt) => opt.value);
            const body = {
                title: taskTitle.value,
                description: taskDescription.value,
                dueDate: taskDueDate.value,
                assignedMembers: members,
                group: groupId
            };

            try {
                const res = await fetch("/api/tasks", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${token}`
                    },
                    body: JSON.stringify(body)
                });
                const data = await res.json();

                if (res.ok) {
                    alert("Task created successfully!");
                    // ✅ FIX: Reload tasks after creation
                    await loadTasks(token, groupId, currentUserId, userRole, tasksContainer);
                    
                    taskModal.style.display = "none";
                    taskTitle.value = "";
                    taskDescription.value = "";
                    taskDueDate.value = "";
                } else {
                    alert(data.error || "Task creation failed");
                }
            } catch (err) {
                console.error(err);
                alert("Error creating task");
            }
        });
    }
    
    // Load leader data
    await loadGroupMembers(token, groupId, taskMembers);
    await loadTasks(token, groupId, currentUserId, userRole, tasksContainer);
}
    
    async function loadGroupMembers(token, groupId, taskMembers) {
    try {
      const res = await fetch(`/api/groups/${groupId}`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      const data = await res.json();
      taskMembers.innerHTML = "";
      // Add leader first
      const leaderOpt = document.createElement("option");
      leaderOpt.value = data.group.leader._id;
      leaderOpt.textContent = data.group.leader.username + " (Leader)";
       taskMembers.appendChild(leaderOpt);
      data.group.members.forEach((member) => {
        const opt = document.createElement("option");
        opt.value = member._id;
        opt.textContent = member.username;
        taskMembers.appendChild(opt);
      });
    } catch (err) {
      console.error("Error loading members:", err);
    }
  }
  

// ===== TASK MANAGEMENT FUNCTIONS =====
async function updateTaskStatus(taskId, newStatus, token, groupId) {
        try {
        console.log('🔄 Updating task status:', taskId, newStatus);
        
        const res = await fetch(`/api/tasks/${taskId}`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({ status: newStatus })
        });

        console.log('📡 Response status:', res.status);
        
        if (res.ok) {
            alert(`✅ Task status updated to: ${newStatus}`);
            await loadTasks(token, groupId); // Reload tasks
        } else {
            const errorText = await res.text();
            console.error('❌ API Error:', errorText);
            alert(`❌ Failed to update task status: ${res.status}`);
        }
    } catch (err) {
        console.error("💥 Error updating task status:", err);
        alert("💥 Error updating task status");
    }
}



async function reassignTask(taskId, token, groupId) {
    try {
        console.log('🔄 Reassigning task:', taskId);
        
        const membersRes = await fetch(`/api/groups/${groupId}`, {
            headers: { "Authorization": `Bearer ${token}` }
        });
        
        if (!membersRes.ok) {
            throw new Error('Failed to fetch group members');
        }
        
        const groupData = await membersRes.json();
        const members = groupData.group.members;
        
        let memberOptions = "Select a member to assign:\n\n";
        members.forEach((member, index) => {
            memberOptions += `${index + 1}. ${member.username}\n`;
        });
        
        const selected = prompt(memberOptions + "\nEnter the number:");
        if (selected === null) return;
        
        const selectedIndex = parseInt(selected) - 1;
        if (isNaN(selectedIndex) || selectedIndex < 0 || selectedIndex >= members.length) {
            alert("Invalid selection!");
            return;
        }
        
        const selectedMember = members[selectedIndex];
        
        console.log('📡 Making PUT request to reassign task');
        const res = await fetch(`/api/tasks/${taskId}`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({ 
                assignedMembers: [selectedMember._id] 
            })
        });

        console.log('📡 Response status:', res.status);
        
        if (res.ok) {
            alert(`✅ Task reassigned to ${selectedMember.username}!`);
            // ✅ FIX: Get current elements and reload tasks
            const tasksContainer = document.getElementById("tasksContainer");
            const currentUserId = localStorage.getItem("userId");
            const userRole = localStorage.getItem("role");
            await loadTasks(token, groupId, currentUserId, userRole, tasksContainer);
        } else {
            const errorText = await res.text();
            console.error('❌ API Error:', errorText);
            alert(`❌ Failed to reassign task: ${res.status}`);
        }
    } catch (err) {
        console.error("💥 Error reassigning task:", err);
        alert("💥 Error: " + err.message);
    }
}

async function deleteTask(taskId, token, groupId) {
    try {
        console.log('🗑️ Deleting task:', taskId);
        
        const confirmDelete = confirm("Are you sure you want to delete this task?");
        if (!confirmDelete) return;

        console.log('📡 Making DELETE request');
        const res = await fetch(`/api/tasks/${taskId}`, {
            method: "DELETE",
            headers: {
                "Authorization": `Bearer ${token}`
            }
        });

        console.log('📡 Response status:', res.status);
        
        if (res.ok) {
            alert("✅ Task deleted successfully!");
            // ✅ FIX: Get current elements and reload tasks
            const tasksContainer = document.getElementById("tasksContainer");
            const currentUserId = localStorage.getItem("userId");
            const userRole = localStorage.getItem("role");
            await loadTasks(token, groupId, currentUserId, userRole, tasksContainer);
        } else {
            const errorText = await res.text();
            console.error('❌ API Error:', errorText);
            alert(`❌ Failed to delete: ${res.status}`);
        }
    } catch (err) {
        console.error("💥 Error deleting task:", err);
        alert("💥 Error: " + err.message);
    }
}

function addStatusUpdateListeners(token, groupId) {
    console.log('🔧 Setting up event listeners...');
    
    // Remove duplicate listeners
    document.querySelectorAll('.update-status-btn, .reassign-btn, .delete-task-btn').forEach(btn => {
        btn.replaceWith(btn.cloneNode(true));
    });

    // Status update buttons
    document.querySelectorAll('.update-status-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const taskId = e.target.dataset.taskId;
            const statusSelect = document.querySelector(`.status-select[data-task-id="${taskId}"]`);
            const newStatus = statusSelect.value;
            await updateTaskStatus(taskId, newStatus, token, groupId);
        });
    });

    // Reassign buttons
    document.querySelectorAll('.reassign-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const taskId = e.target.dataset.taskId;
            await reassignTask(taskId, token, groupId);
        });
    });

    // Delete buttons
    document.querySelectorAll('.delete-task-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const taskId = e.target.dataset.taskId;
            await deleteTask(taskId, token, groupId);
        });
    });

    console.log('✅ Event listeners setup complete');
}

 async function loadTasks(token, groupId, currentUserId, userRole, tasksContainer) {
    try {
      const res = await fetch(`/api/tasks/group/${groupId}`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      
      const data = await res.json();
      tasksContainer.innerHTML = "";

      data.forEach((task) => {
        // ✅ MOVE these INSIDE the forEach loop (after task is defined)
        const isAssignedToMe = task.assignedMembers && task.assignedMembers.some(member => 
          member._id === currentUserId || member === currentUserId
        );
        
        const canEditStatus = userRole === "leader" || isAssignedToMe;

        const card = document.createElement("div");
        card.className = "task-card";
        card.innerHTML = `
          <h3>${task.title}</h3>
          <p>${task.description}</p>
          <p><strong>Due:</strong> ${new Date(task.dueDate).toLocaleDateString()}</p>
          <p><strong>Assigned to:</strong> ${task.assignedMembers.map(m => m.username || m).join(", ")}</p>
          <p><strong>Weight:</strong> ${task.weight || 1}</p>
        
          <!-- ✅ STATUS DROPDOWN -->
          <div class="status-update">
            <label><strong>Status:</strong></label>
            ${canEditStatus ? `
              <select class="status-select" data-task-id="${task._id}">
                <option value="Not Started" ${task.status === "Not Started" ? "selected" : ""}>Not Started</option>
                <option value="In Progress" ${task.status === "In Progress" ? "selected" : ""}>In Progress</option>
                <option value="Completed" ${task.status === "Completed" ? "selected" : ""}>Completed</option>
              </select>
              <button class="update-status-btn" data-task-id="${task._id}">Update</button>
            ` : `
              <span class="current-status">${task.status}</span>
            `}
          </div>
          
          ${userRole === "leader" ? `
            <!-- Leader-only actions -->
            <div class="leader-actions">
              <button class="reassign-btn" data-task-id="${task._id}">Reassign</button>
              <button class="delete-task-btn" data-task-id="${task._id}">Delete</button>
            </div>
          ` : ''}
        `;
        tasksContainer.appendChild(card);
      });

      // ✅ FIX: Remove "this." - call the function directly
      addStatusUpdateListeners(token, groupId);
      
    } catch (err) {
      console.error("Error loading tasks:", err);
    }
}
// Token management function
// Token management function - FIXED VERSION
async function fetchWithAuth(url, options = {}) {
    const token = localStorage.getItem("token");
    
    // Validate token
    if (!token || token === 'undefined' || token === 'null') {
        console.error('No valid token found');
        showMessage('Session expired. Please log in again.', 'error');
        setTimeout(() => {
            window.location.href = "login_page.html";
        }, 2000);
        throw new Error('No authentication token');
    }
    
    const config = {
        ...options,
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            ...options.headers
        }
    };
    
    try {
        const response = await fetch(url, config);
        
        // If token is invalid, redirect to login
        if (response.status === 400 || response.status === 401) {
            const errorData = await response.json().catch(() => ({}));
            if (errorData.error && errorData.error.includes('token')) {
                console.error('Token invalid, redirecting to login');
                showMessage('Session expired. Please log in again.', 'error');
                setTimeout(() => {
                    localStorage.clear();
                    window.location.href = "login_page.html";
                }, 1500);
                return response;
            }
        }
        
        return response;
    } catch (error) {
        console.error('Network error in fetchWithAuth:', error);
        throw error;
    }
}

    
document.addEventListener("DOMContentLoaded", async () => {
  // === GLOBAL SETUP ===
  const groupId = localStorage.getItem("currentGroupId");
  const token = localStorage.getItem("token");
  console.log('🔍 Debug - Group Info Elements:', {
    groupId: groupId,
    tokenExists: !!token,
    logoElem: document.querySelector(".logo"),
    groupNameElem: document.querySelector(".group-info-list li:nth-child(1)"),
    groupLeaderElem: document.querySelector(".group-info-list li:nth-child(2)"),
    groupMembersElem: document.querySelector(".group-info-list li:nth-child(3)"),
    groupCreatedElem: document.querySelector(".group-info-list li:nth-child(4)")
  });

  const userRole = localStorage.getItem("role"); // "leader" or "member"
const currentUserId = localStorage.getItem("userId"); // Logged-in user's ID
  const groupLogoutBtn = document.getElementById("groupLogoutBtn");
   const currentPage = window.location.pathname.split('/').pop();
  console.log('📄 Current page:', currentPage);
  // === PAGE DETECTION ===
  const isMemberTaskAssignedPage = window.location.pathname.includes('Member_Task_Assigned');
  const isMemberProgressPage = currentPage.includes('Member_Project_Progress');
  const isLeaderProgressPage = currentPage.includes('Leader_Project_Progress');
  const isProgressPage = isMemberProgressPage || isLeaderProgressPage;
  const isChatPage = window.location.pathname.includes('Group_Chat'); 
  if (!groupId || !token) {
    alert("Session expired. Please log in again.");
    window.location.href = "login.html";
    return;
  }

  // If on member task assigned page, ONLY run member-specific code
  if (isMemberTaskAssignedPage) {
    initTaskAssignedPage();
    return; // STOP here - don't run leader code
  }// If not member page, initialize leader pages
    await initLeaderPages();
    
 // ✅ ADD THIS: If on chat page, ONLY run chat code
if (isChatPage) {
  initChatPage();
  return; // STOP here - don't run other code
}

 // === PROGRESS MANAGER INITIALIZATION ===
  let progressManager;
  
  if (isProgressPage) {
      progressManager = new ProgressManager(groupId, token);
      
      // Load initial progress
      await progressManager.refreshAll();
      
      // Setup refresh button
      const refreshBtn = document.getElementById('refresh-progress-btn');
      if (refreshBtn) {
          refreshBtn.addEventListener('click', async () => {
              refreshBtn.innerHTML = '<i class="fas fa-sync fa-spin"></i> Refreshing...';
              await progressManager.refreshAll();
              setTimeout(() => {
                  refreshBtn.innerHTML = '<i class="fas fa-sync"></i> Refresh Progress';
              }, 1000);
          });
      }
      
      // ✅ FIXED: Auto-refresh with token check
    let progressInterval = setInterval(async () => {
        const currentToken = localStorage.getItem("token");
        if (currentToken && currentToken !== 'undefined' && currentToken !== 'null') {
            await progressManager.refreshAll();
        } else {
            console.warn('⚠️ Token invalid, stopping progress auto-refresh');
            clearInterval(progressInterval);
        }
    }, 30000);
}
   // === GROUP INFO SECTION ===
  try {
    const res = await fetch(`/api/groups/${groupId}`, {
      headers: { "Authorization": `Bearer ${token}` }
    });
    const data = await res.json();

    if (res.ok) {
      const group = data.group;
      
      // ✅ Always update logo if it exists
      const logoElem = document.querySelector(".logo");
      if (logoElem) {
        logoElem.textContent = `🚀 ${group.name}`;
      } else {
        console.log('ℹ️ Logo element not found on this page');
      }
      
      // ✅ Only update detailed group info on group info pages
      if (currentPage.includes('Group_Info')) {
        const groupNameElem = document.querySelector(".group-info-list li:nth-child(1)");
        const groupLeaderElem = document.querySelector(".group-info-list li:nth-child(2)");
        const groupMembersElem = document.querySelector(".group-info-list li:nth-child(3)");
        const groupCreatedElem = document.querySelector(".group-info-list li:nth-child(4)");
        
        if (groupNameElem && groupLeaderElem && groupMembersElem && groupCreatedElem) {
          groupNameElem.innerHTML = `<i class="fa-solid fa-people-group"></i> <strong>Group Name :</strong> ${group.name}`;
          groupLeaderElem.innerHTML = `<i class="fa-solid fa-user-tie"></i> <strong>Group Leader :</strong> ${group.leader.username}`;
          
          let membersHtml = `<i class="fa-solid fa-users"></i> <strong>Group Members :</strong><br>`;
          group.members.forEach((m, i) => {
            membersHtml += `${i + 1}. ${m.username}<br>`;
          });
          groupMembersElem.innerHTML = membersHtml;

          const createdDate = new Date(group.createdAt).toLocaleDateString();
          groupCreatedElem.innerHTML = `<i class="fa-solid fa-calendar-days"></i> <strong>Group Created On :</strong> ${createdDate}`;
        } else {
          console.log('ℹ️ Group info elements not found on this page');
        }
      } else {
        console.log('ℹ️ Not on group info page - skipping detailed group info');
      }
    } else {
      console.error('Failed to load group data:', data.error);
    }
  } catch (err) {
    console.error("Error fetching group info:", err);
  }
  // === FILE UPLOAD SECTION ===
  const uploadForm = document.getElementById("uploadFileForm");
  if (uploadForm) {
    uploadForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      const fileInput = document.getElementById("fileInput");
      const file = fileInput.files[0];
      if (!file) return alert("Please select a file to upload");

      const formData = new FormData();
      formData.append("file", file);
      formData.append("groupId", groupId);

      try {
        const res = await fetch("/api/files/upload", {
          method: "POST",
          headers: { "Authorization": `Bearer ${token}` },
          body: formData
        });
        const data = await res.json();

        if (res.ok) {
          alert("File uploaded successfully!");
          fileInput.value = "";
          loadFiles(); // refresh file list
        } else {
          alert(data.error || "Upload failed");
        }
      } catch (err) {
        console.error(err);
        alert("Server error while uploading file");
      }
    });
  }

  // === TASK MANAGEMENT SECTION ===
  
   // ===== ASSIGN TASK FUNCTION =====
async function assignTask(event) {
  event.preventDefault();

  const title = document.getElementById("taskTitle").value.trim();
  const description = document.getElementById("taskDescription").value.trim();
  const assignedMembers = Array.from(document.querySelectorAll("#taskMembers option:checked")).map(opt => opt.value);
  const dueDate = document.getElementById("taskDueDate").value; // ✅ ADD THIS
  const weight = document.getElementById("taskWeight") ? document.getElementById("taskWeight").value : 3; // ✅ ADD THIS
  const groupId = localStorage.getItem("currentGroupId");
  const token = localStorage.getItem("token");

  if (!title || !description || assignedMembers.length === 0) {
    alert("Please fill all fields and select at least one member.");
    return;
  }

  try {
    console.log({ title, description, dueDate, weight, groupId, assignedMembers }); // debug log

    const response = await fetch("/api/tasks", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ title, description,  dueDate,
        assignedMembers,weight: parseInt(weight),
        group: groupId,  })
    });

    const data = await response.json();

    if (response.ok) {
      alert("Task assigned successfully!");
      document.getElementById("assignTaskForm").reset();
      await loadTasks(); // refresh task list
    } else {
      console.error("Task creation failed:", data.message);
      alert("Task creation failed: " + data.message);
    }
  } catch (error) {
    console.error("Error creating task:", error);
    alert("Something went wrong while assigning the task!");
  }
}



  // === LOGOUT SECTION ===
  if (groupLogoutBtn) {
    groupLogoutBtn.addEventListener("click", () => {
      console.log('🔍 Before group logout - localStorage:', {
            token: localStorage.getItem("token"),
            role: localStorage.getItem("role"), 
            userId: localStorage.getItem("userId"),
            currentGroupId: localStorage.getItem("currentGroupId")
        });
        // ✅ ONLY CLEAR GROUP-SPECIFIC DATA, KEEP USER LOGIN
        localStorage.removeItem("currentGroupId");
        localStorage.removeItem("currentGroupName");
        // Keep: token, role, userId, etc.
        
        const role = localStorage.getItem("role");
        if (role === "admin") {
            window.location.href = "/Admin_Home_Page.html";
        } else {
            window.location.href = "/User_Home_Page.html";
        }
        // Optional: Show a different message
        alert("Left group workspace successfully!");
    });
}


  // === FILE MANAGEMENT SECTION ===
  const fileListContainer = document.getElementById("fileListContainer");
  if (fileListContainer) {
    let selectedFileId = null;
    let selectedFileName = null;

    async function loadFiles() {
      try {
        const res = await fetch(`/api/files/group/${groupId}`, {
          headers: { "Authorization": `Bearer ${token}` }
        });
        const data = await res.json();

        fileListContainer.innerHTML = "";

        data.files.forEach((file) => {
          const div = document.createElement("div");
          div.classList.add("file-item");
          div.dataset.fileId = file._id;
          div.dataset.fileName = file.name;
          div.innerHTML = `<span>${file.name}</span>`;
          fileListContainer.appendChild(div);

          div.addEventListener("click", () => {
            document.querySelectorAll(".file-item").forEach((el) => el.classList.remove("selected"));
            div.classList.add("selected");
            selectedFileId = file._id;
            selectedFileName = file.name;
          });
        });
      } catch (err) {
        console.error("Error loading files:", err);
        alert("Could not load files");
      }
    }

    await loadFiles();

    // OPEN FILE
    const openBtn = document.getElementById("open-file-btn");
    if (openBtn) {
      openBtn.addEventListener("click", async () => {
        if (!selectedFileId) return alert("Please select a file first!");
        try {
          const res = await fetch(`/api/files/open/${selectedFileId}`, {
            headers: { "Authorization": `Bearer ${token}` }
          });
          const data = await res.json();
          if (!res.ok) throw new Error(data.error || "Cannot open file");
          alert(`File: ${data.name}\n\nContent:\n${data.content}`);
        } catch (err) {
          console.error(err);
          alert(err.message);
        }
      });
    }

    // RENAME FILE
    const renameBtn = document.getElementById("rename-file-btn");
    if (renameBtn) {
      renameBtn.addEventListener("click", async () => {
        if (!selectedFileId) return alert("Select a file first!");
        const newName = prompt("Enter new file name:");
        if (!newName) return;

        try {
          const res = await fetch(`/api/files/rename/${selectedFileId}`, {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({ newName })
          });

          const text = await res.text();
          const data = text ? JSON.parse(text) : {};

          if (!res.ok) throw new Error(data.error || "Rename failed");
          alert(data.message || "File renamed successfully!");
          await loadFiles();
        } catch (err) {
          console.error(err);
          alert(err.message);
        }
      });
    }

    // DELETE FILE
    const deleteBtn = document.getElementById("delete-file-btn");
    if (deleteBtn) {
      deleteBtn.addEventListener("click", async (e) => {
        e.preventDefault();
        if (!selectedFileId) return alert("Select a file first!");

        const confirmDelete = confirm("Are you sure you want to delete this file?");
        if (!confirmDelete) return;

        try {
          const res = await fetch(`/api/files/delete/${selectedFileId}`, {
            method: "DELETE",
            headers: { "Authorization": `Bearer ${token}` }
          });
          const text = await res.text();
          const data = text ? JSON.parse(text) : {};
          if (!res.ok) throw new Error(data.error || "Delete failed");

          alert(data.message || "File deleted successfully!");
          await loadFiles();
          selectedFileId = null;
        } catch (err) {
          console.error(err);
          alert(err.message);
        }
      });
    }
  }

});
    