import { useCallback, useEffect, useState } from "react";

import API_URL from "../config/api";
import { useNavigate } from "react-router-dom";

function TaskBoard({ role }) {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const groupId = localStorage.getItem("currentGroupId");
  const userId = localStorage.getItem("userId");

  const [tasks, setTasks] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);

  const [form, setForm] = useState({
    title: "", description: "", weight: "3", dueDate: "", members: [],
  });
const loadTasks = useCallback(async () => {
    try {
      setLoading(true);
      // ASSUMED endpoint — confirm against taskRoutes.js
      const res = await fetch(`${API_URL}/api/tasks/group/${groupId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setTasks(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Error loading tasks:", err);
    } finally {
      setLoading(false);
    }
  }, [groupId, token]);

  const loadGroupMembers = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/api/groups`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      const found = Array.isArray(data) ? data.find(g => g._id === groupId) : null;
      setMembers(found?.members || []);
    } catch (err) {
      console.error("Error loading members:", err);
    }
  },[groupId,token]);
  useEffect(() => {
    if (!token || !groupId) { navigate("/dashboard"); return; }
    loadTasks();  // eslint-disable-line react-hooks/set-state-in-effect
    if (role === "leader") loadGroupMembers();
  }, [token, groupId, navigate, role,loadTasks,loadGroupMembers]);

  const handleMemberToggle = (id) => {
    setForm(prev => ({
      ...prev,
      members: prev.members.includes(id)
        ? prev.members.filter(m => m !== id)
        : [...prev.members, id],
    }));
  };

  const handleAssignTask = async (e) => {
    e.preventDefault();
    if (!form.title || !form.description || !form.dueDate || !form.members.length) {
      alert("Please fill all fields and select at least one member.");
      return;
    }
    try {
      // ASSUMED endpoint — confirm against taskRoutes.js
      const res = await fetch(`${API_URL}/api/tasks`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          title: form.title,
          description: form.description,
          weight: Number(form.weight),
          dueDate: form.dueDate,
          assignedMembers: form.members,
          group:groupId,
        }),
      });
      const data = await res.json();
      if (!res.ok) { alert(data.message || "Failed to create task."); return; }

      setModalOpen(false);
      setForm({ title: "", description: "", weight: "3", dueDate: "", members: [] });
      loadTasks();
    } catch (err) {
      console.error(err);
      alert("Server error. Try again.");
    }
  };

  const handleStatusChange = async (taskId, newStatus) => {
    try {
      // ASSUMED endpoint — confirm against taskRoutes.js
      const res = await fetch(`${API_URL}/api/tasks/${taskId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error("Failed to update status");
      loadTasks();
    } catch (err) {
      console.error(err);
      alert("Could not update task status.");
    }
  };

  const handleLogout = () => { localStorage.clear(); navigate("/login"); };

  const weightLabel = (w) => ({ 1: "⭐ Low", 3: "⭐⭐ Medium", 5: "⭐⭐⭐ High", 8: "⭐⭐⭐⭐ Critical" }[w] || w);

  // Members only see tasks assigned to them
  const visibleTasks = role === "member"
    ? tasks.filter(t => t.assignedMembers?.some(m => (m._id || m) === userId))
    : tasks;

  return (
    <div id="workspacepage">
      <nav>
        <div className="logo">🚀 {localStorage.getItem("currentGroupName")  || "ProjectHub"}</div>
        <button className="login-btn" onClick={handleLogout}>{role.toUpperCase()} LOGGED-IN</button>
      </nav>

      <div className="layout">
        <div className="sidebar">
  <br />
  <a href="#" onClick={() => navigate(role === "leader" ? "/leader-group" : "/member-group")}>📂 Group Info</a><br /><br />
  <a href="#" className="active">📝 {role === "leader" ? "Task Management" : "Tasks Assigned"}</a><br /><br />
  <a href="#" onClick={() => navigate("/progress")}>📊 Project Progress</a><br /><br />
  <a href="#"onClick={()=> navigate("/files")}>📁 File List</a><br /><br />
  <a href="#">💬 Group Chat</a><br /><br />
  <a href="#" onClick={handleLogout}>🚪 Log Out</a>
</div>

        <div className="main">
          <div className="task-header">
            <h2>{role === "leader" ? "Assigned Tasks" : "Tasks Assigned"}</h2>
            {role === "leader" && (
              <button onClick={() => setModalOpen(true)} className="dashboard-action-btn">+ Add Task</button>
            )}
          </div>

          {loading ? (
            <p>Loading tasks...</p>
          ) : visibleTasks.length === 0 ? (
            <div className="groups-state"><h3>No tasks yet</h3></div>
          ) : (
            <div className="tasks-container">
              {visibleTasks.map(task => (
                <div key={task._id} className="group-card">
                  <h3>{task.title}</h3>
                  <p className="group-leader">{task.description}</p>
                  <p className="group-leader">Priority: <strong>{weightLabel(task.weight)}</strong></p>
                  <p className="group-leader">Due: <strong>{new Date(task.dueDate).toLocaleDateString()}</strong></p>
                  <div className="form-group" style={{ marginTop: 12 }}>
                    <label>Status</label>
                    <select
                      value={task.status || "Not Started"}
                      onChange={(e) => handleStatusChange(task._id, e.target.value)}
                    >
                      <option value="Not Started">Pending</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Completed">Completed</option>
                    </select>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {modalOpen && (
        <div className="group-modal-overlay" onClick={() => setModalOpen(false)}>
          <div className="group-login-modal" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setModalOpen(false)}>×</button>
            <h2>Create New Task</h2>
            <form onSubmit={handleAssignTask}>
              <div className="form-group">
                <input
                  type="text" placeholder="Task Title" value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })} required
                />
              </div>
              <div className="form-group">
                <textarea
                  placeholder="Task Description" value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })} required
                />
              </div>
              <div className="form-group">
                <label>Task Weight/Priority</label>
                <select value={form.weight} onChange={(e) => setForm({ ...form, weight: e.target.value })}>
                  <option value="1">⭐ Low (Weight: 1)</option>
                  <option value="3">⭐⭐ Medium (Weight: 3)</option>
                  <option value="5">⭐⭐⭐ High (Weight: 5)</option>
                  <option value="8">⭐⭐⭐⭐ Critical (Weight: 8)</option>
                </select>
              </div>
              <div className="form-group">
                <input
                  type="date" value={form.dueDate}
                  onChange={(e) => setForm({ ...form, dueDate: e.target.value })} required
                />
              </div>
              <div className="form-group">
                <label>Assign Members</label>
                <div className="members-selection">
                  {members.map(m => (
                    <label key={m._id} className="member-option">
                      <input
                        type="checkbox"
                        checked={form.members.includes(m._id)}
                        onChange={() => handleMemberToggle(m._id)}
                      />
                      <span>{m.username}</span>
                    </label>
                  ))}
                </div>
              </div>
              <button type="submit" className="dashboard-action-btn">Save Task</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default TaskBoard;