import { useEffect, useState } from "react";

import { useNavigate } from "react-router-dom";

function GroupInfo({ role }) {
  const navigate = useNavigate();
  const [group, setGroup] = useState(null);
  const [loading, setLoading] = useState(true);
  const token = localStorage.getItem("token");
  const groupId = localStorage.getItem("currentGroupId");

  useEffect(() => {
    if (!token || !groupId) {
      navigate("/dashboard");
      return;
    }

    fetch("/api/groups", { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => res.json())
      .then((data) => {
        const found = Array.isArray(data)
          ? data.find((g) => g._id === groupId)
          : null;
        setGroup(found);
      })
      .catch((err) => console.error("Error loading group:", err))
      .finally(() => setLoading(false));
  }, [token, groupId, navigate]);

  const handleLogout = () => {
    localStorage.clear();
    navigate("/login");
  };

  if (loading) return <p>Loading...</p>;
  if (!group) return <p>Group not found.</p>;

  return (
    <div id="workspacepage">
      <nav>
        <div className="logo">🚀 {group?.name || "ProjectHub"}</div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span className="group-category">
            {role === "leader" ? "Leader" : "Member"}
          </span>
          <button
            className="profile-btn"
            onClick={handleLogout}
            title="Log out"
          >
            {(localStorage.getItem("username") || "U").charAt(0).toUpperCase()}
          </button>
        </div>
      </nav>

      <div className="layout">
        <div className="sidebar">
          <br />
          <a href="#" className="active">
            📂 Group Info
          </a>
          <br />
          <br />
          <a
            href="#"
            onClick={() =>
              navigate(role === "leader" ? "/leader-tasks" : "/member-tasks")
            }
          >
            📝 {role === "leader" ? "Task Management" : "Tasks Assigned"}
          </a>
          <br />
          <br />
          <a href="#" onClick={() => navigate("/progress")}>
            📊 Project Progress
          </a>
          <br />
          <br />
          <a href="#"onClick={()=> navigate("/files")}>📁 File List</a>
          <br />
          <br />
          <a href="#" onClick={()=> navigate("/chat")}>💬 Group Chat</a>
          <br />
          <br />
          <a href="#" onClick={handleLogout}>
            🚪 Log Out
          </a>
        </div>

        <div className="main">
          <div className="content">
            <ul id="groupInfoList" className="group-info-list">
              <li>
                <i className="fa-solid fa-people-group" />{" "}
                <strong>Group Name :</strong> {group.name}
              </li>
              <li>
                <i className="fa-solid fa-user-tie" />{" "}
                <strong>Group Leader :</strong>{" "}
                {group.leader?.username || "N/A"}
              </li>
              <li>
                <i className="fa-solid fa-users" />{" "}
                <strong>Group Members :</strong>
                <br />
                {Array.isArray(group.members) && group.members.length > 0
                  ? group.members.map((m) => (
                      <span key={m._id}>
                        {m.username}
                        <br />
                      </span>
                    ))
                  : "No members"}
              </li>
              <li>
                <i className="fa-solid fa-calendar-days" />{" "}
                <strong>Group Created On :</strong>{" "}
                {group.createdAt
                  ? new Date(group.createdAt).toLocaleDateString()
                  : "N/A"}
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

export default GroupInfo;
