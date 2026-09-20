import { useCallback, useEffect, useState } from "react";

import { useNavigate } from "react-router-dom";

function ProjectProgress() {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const groupId = localStorage.getItem("currentGroupId");
  const role = localStorage.getItem("groupRole");

  const [summary, setSummary] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [progressRes, tasksRes] = await Promise.all([
        fetch(`/api/tasks/progress/${groupId}`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`/api/tasks/group/${groupId}`, { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      setSummary(await progressRes.json());
      const taskData = await tasksRes.json();
      setTasks(Array.isArray(taskData) ? taskData : []);
    } catch (err) {
      console.error("Error loading progress:", err);
    } finally {
      setLoading(false);
    }
  }, [groupId, token]);

  useEffect(() => {
    if (!token || !groupId) { navigate("/dashboard"); return; }
    loadData(); // eslint-disable-line react-hooks/set-state-in-effect
  }, [token, groupId, navigate, loadData]);

  const handleLogout = () => { localStorage.clear(); navigate("/login"); };

  // Team workload: weighted completion per member
  const memberStats = {};
  tasks.forEach(t => {
    (t.assignedMembers || []).forEach(m => {
      const id = m._id;
      if (!memberStats[id]) memberStats[id] = { name: m.username, total: 0, done: 0 };
      memberStats[id].total += t.weight || 1;
      if (t.status === "Completed") memberStats[id].done += t.weight || 1;
    });
  });
  const workload = Object.values(memberStats).sort((a, b) => b.total - a.total);

  // Upcoming / overdue deadlines
  const now = new Date();
  const upcoming = tasks
    .filter(t => t.status !== "Completed")
    .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
    .slice(0, 5);

  const ringRadius = 52;
  const circumference = 2 * Math.PI * ringRadius;
  const progressPct = summary?.progress || 0;

  return (
    <div id="workspacepage">
      <nav>
        <div className="logo">🚀 {localStorage.getItem("currentGroupName")  || "ProjectHub"}</div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span className="group-category">{role === "leader" ? "Leader" : "Member"}</span>
          <button className="profile-btn" onClick={handleLogout} title="Log out">
            {(localStorage.getItem("username") || "U").charAt(0).toUpperCase()}
          </button>
        </div>
      </nav>

      <div className="layout">
        <div className="sidebar">
          <br />
          <a href="#" onClick={() => navigate(role === "leader" ? "/leader-group" : "/member-group")}>📂 Group Info</a><br /><br />
          <a href="#" onClick={() => navigate(role === "leader" ? "/leader-tasks" : "/member-tasks")}>📝 {role === "leader" ? "Task Management" : "Tasks Assigned"}</a><br /><br />
          <a href="#" className="active">📊 Project Progress</a><br /><br />
          <a href="#" onClick={() => navigate("/files")}>📁 File List</a><br /><br />
          <a href="#" onClick={() => navigate("/chat")}>💬 Group Chat</a><br /><br />
          <a href="#" onClick={handleLogout}>🚪 Log Out</a>
        </div>

        <div className="main">
          <div className="content" style={{ maxWidth: 820 }}>
            <h1>Project Progress</h1>

            {loading ? (
              <p>Loading...</p>
            ) : !summary || summary.totalTasks === 0 ? (
              <div className="groups-state"><h3>No tasks yet to track</h3></div>
            ) : (
              <>
                {/* Hero gauge + status bar */}
                <div className="progress-hero">
                  <div className="progress-ring-wrap">
                    <svg width="140" height="140" viewBox="0 0 120 120">
                      <defs>
                        <linearGradient id="gaugeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="#3B82F6" />
                          <stop offset="100%" stopColor="#8B5CF6" />
                        </linearGradient>
                      </defs>
                      <circle cx="60" cy="60" r={ringRadius} fill="none" stroke="var(--panel-2)" strokeWidth="10" />
                      <circle
                        cx="60" cy="60" r={ringRadius} fill="none"
                        stroke="url(#gaugeGrad)" strokeWidth="10" strokeLinecap="round"
                        strokeDasharray={circumference}
                        strokeDashoffset={circumference * (1 - progressPct / 100)}
                        transform="rotate(-90 60 60)"
                      />
                    </svg>
                    <div className="progress-ring-label">{progressPct}%</div>
                  </div>

                  <div className="progress-hero-side">
                    <p className="groups-header p">Weighted completion across {summary.totalTasks} task{summary.totalTasks !== 1 ? "s" : ""}</p>
                    <div className="status-bar">
                      <div className="status-seg" style={{ width: `${(summary.breakdown.completed / summary.totalTasks) * 100 || 0}%`, background: "#22C55E" }} />
                      <div className="status-seg" style={{ width: `${(summary.breakdown.inProgress / summary.totalTasks) * 100 || 0}%`, background: "#F5B942" }} />
                      <div className="status-seg" style={{ width: `${(summary.breakdown.notStarted / summary.totalTasks) * 100 || 0}%`, background: "#EF4444" }} />
                    </div>
                    <div className="status-legend">
                      <span><i style={{ background: "#22C55E" }} /> Completed</span>
                      <span><i style={{ background: "#F5B942" }} /> In Progress</span>
                      <span><i style={{ background: "#EF4444" }} /> Not Started</span>
                    </div>
                  </div>
                </div>

                {/* Team workload */}
                {workload.length > 0 && (
                  <div className="dashboard-card" style={{ marginTop: 24 }}>
                    <h2 style={{ fontSize: 15, marginBottom: 16 }}>Team workload</h2>
                    {workload.map(m => (
                      <div key={m.name} className="workload-row">
                        <span className="workload-name">{m.name}</span>
                        <div className="workload-track">
                          <div className="workload-fill" style={{ width: `${m.total ? (m.done / m.total) * 100 : 0}%` }} />
                        </div>
                        <span className="workload-pct">{m.total ? Math.round((m.done / m.total) * 100) : 0}%</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Deadlines */}
                <div className="dashboard-card" style={{ marginTop: 20 }}>
                  <h2 style={{ fontSize: 15, marginBottom: 14 }}>Upcoming & overdue</h2>
                  {upcoming.length === 0 ? (
                    <p className="groups-header p">Nothing pending — all caught up.</p>
                  ) : (
                    upcoming.map(t => {
                      const overdue = new Date(t.dueDate) < now;
                      return (
                        <div key={t._id} className="task-item">
                          <div className="task-status" style={{ background: overdue ? "#EF4444" : "#F5B942" }} />
                          <div className="task-info">
                            <strong>{t.title}</strong>
                            <span>{overdue ? "Overdue — " : "Due "}{new Date(t.dueDate).toLocaleDateString()}</span>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProjectProgress;