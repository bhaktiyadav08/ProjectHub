import { useEffect, useState } from "react";

import API_URL from "../config/api";
import { useNavigate } from "react-router-dom";

function Dashboard() {
  const navigate = useNavigate();

  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);

  const role = localStorage.getItem("role") || "";

  const [profileOpen, setProfileOpen] = useState(false);

  const [groupModalOpen, setGroupModalOpen] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [groupPassword, setGroupPassword] = useState("");

  const [activeTab, setActiveTab] = useState("view");

  const [users, setUsers] = useState([]);
  const [groupForm, setGroupForm] = useState({
    name: "",
    leader: "",
    members: [],
    password: "",
    category: "",
  });

  const token = localStorage.getItem("token");

  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }

    const loadDashboard = async () => {
      try {
        setLoading(true);

        const response = await fetch(`${API_URL}/api/groups`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.status === 401) {
          localStorage.clear();
          navigate("/login");
          return;
        }

        if (!response.ok) {
          throw new Error("Failed to fetch groups");
        }

        const data = await response.json();

        setGroups(Array.isArray(data) ? data : []);
        if (role === "admin") {
          try {
            const usersResponse = await fetch(`${API_URL}/api/groups/users`, {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            });

            const usersData = await usersResponse.json();

            if (Array.isArray(usersData)) {
              setUsers(usersData);
            }
          } catch (error) {
            console.error("Error loading users:", error);
          }
        }
      } catch (error) {
        console.error("Error loading groups:", error);
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, [token, navigate]);// eslint-disable-line react-hooks/exhaustive-deps

  const fetchGroups = async () => {
    try {
      setLoading(true);

      const response = await fetch(`${API_URL}/api/groups`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.status === 401) {
        localStorage.clear();
        navigate("/login");
        return;
      }

      if (!response.ok) {
        throw new Error("Failed to fetch groups");
      }

      const data = await response.json();
      setGroups(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error loading groups:", error);
    } finally {
      setLoading(false);
    }
  };

  // eslint-disable-next-line no-unused-vars
  const fetchUsers = async () => {
    try {
      const response = await fetch(`${API_URL}/api/groups/users`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (Array.isArray(data)) {
        setUsers(data);
      }
    } catch (error) {
      console.error("Error loading users:", error);
    }
  };

  const handleProfileClick = () => {
    setProfileOpen(true);
  };

  const handleLogout = async () => {
    try {
      await fetch(`${API_URL}/api/auth/logout`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
    } catch (error) {
      console.error(error);
    }

    localStorage.clear();
    navigate("/");
  };

  const openGroup = (group) => {
    if (role === "admin") {
      localStorage.setItem("currentGroupId", group._id);
      localStorage.setItem("currentGroupName", group.name);

      // Workspace page will be connected when you give me that file.
      navigate("/admin-group");
      return;
    }

    setSelectedGroup(group);
    setGroupPassword("");
    setGroupModalOpen(true);
  };

  const handleGroupLogin = async (e) => {
    e.preventDefault();

    if (!selectedGroup || !groupPassword) return;

    try {
      const response = await fetch(`${API_URL}/api/groups/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: selectedGroup.name,
          password: groupPassword,
          userId: localStorage.getItem("userId"),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data.error || "Invalid password");
        return;
      }

      localStorage.setItem("currentGroupId", data.group._id);
      localStorage.setItem("currentGroupName", data.group.name);
      localStorage.setItem("groupRole", data.role);

      setGroupModalOpen(false);

      if (data.role === "leader") {
        navigate("/leader-group");
      } else {
        navigate("/member-group");
      }
    } catch (error) {
      console.error(error);
      alert("Server error. Try again later.");
    }
  };

  const handleGroupFormChange = (e) => {
    const { name, value } = e.target;

    setGroupForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handleMemberChange = (userId) => {
    setGroupForm((previous) => {
      const exists = previous.members.includes(userId);

      return {
        ...previous,
        members: exists
          ? previous.members.filter((id) => id !== userId)
          : [...previous.members, userId],
      };
    });
  };

  const createGroup = async (e) => {
    e.preventDefault();

    if (
      !groupForm.name ||
      !groupForm.leader ||
      !groupForm.members.length ||
      !groupForm.password ||
      !groupForm.category
    ) {
      alert("Please fill all fields.");
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/groups/create`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(groupForm),
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data.message || "Failed to create group.");
        return;
      }

      alert("Group created successfully!");

      setGroupForm({
        name: "",
        leader: "",
        members: [],
        password: "",
        category: "",
      });

      fetchGroups();
      setActiveTab("view");
    } catch (error) {
      console.error(error);
      alert("Server error. Please try again.");
    }
  };

  return (
    <div className="dashboard-page">
      {/* NAVBAR */}
      <nav className="dashboard-navbar">
        <div className="dashboard-logo">🚀 ProjectHub</div>

        <button className="profile-btn" onClick={handleProfileClick}>
          {(localStorage.getItem("username") || "U").charAt(0).toUpperCase()}
        </button>
      </nav>

      {/* PROFILE SIDEBAR */}
      {profileOpen && (
        <>
          <div
            className="profile-overlay"
            onClick={() => setProfileOpen(false)}
          />

          <aside className="profile-sidebar">
            <button
              className="sidebar-close"
              onClick={() => setProfileOpen(false)}
            >
              ×
            </button>

            <div className="sidebar-avatar">
              {(localStorage.getItem("username") || "U")
                .charAt(0)
                .toUpperCase()}
            </div>

            <h2>{localStorage.getItem("username") || "User"}</h2>

            <p>{localStorage.getItem("email") || ""}</p>

            <button
              className="sidebar-action"
              onClick={() => navigate("/edit-profile")}
            >
              Edit Profile
            </button>

            <button className="sidebar-logout" onClick={handleLogout}>
              Logout
            </button>
          </aside>
        </>
      )}

      {/* MAIN */}
      <main className="dashboard-content">
        <div className="dashboard-heading">
          <span className="dashboard-eyebrow">WORKSPACE</span>

          <h1>
            {role === "admin" ? "Manage your groups" : "Choose your group"}
          </h1>

          <p>
            {role === "admin"
              ? "Create and manage collaborative groups."
              : "Select a group to enter its workspace."}
          </p>
        </div>

        {/* ADMIN TABS */}
        {role === "admin" && (
          <div className="dashboard-tabs">
            <button
              className={activeTab === "view" ? "active-tab" : ""}
              onClick={() => {
                setActiveTab("view");
                fetchGroups();
              }}
            >
              VIEW GROUPS
            </button>

            <button
              className={activeTab === "create" ? "active-tab" : ""}
              onClick={() => setActiveTab("create")}
            >
              CREATE GROUP
            </button>
          </div>
        )}

        {/* CREATE GROUP */}
        {role === "admin" && activeTab === "create" && (
          <section className="dashboard-panel create-group-panel">
            <div className="panel-header">
              <div>
                <h2>Create a new group</h2>
                <p>Set up a team workspace and assign its members.</p>
              </div>
            </div>

            <form className="group-form" onSubmit={createGroup}>
              <div className="form-group">
                <label>Group Name</label>
                <input
                  name="name"
                  value={groupForm.name}
                  onChange={handleGroupFormChange}
                  placeholder="e.g. Development Team"
                />
              </div>

              <div className="form-group">
                <label>Leader</label>

                <select
                  name="leader"
                  value={groupForm.leader}
                  onChange={handleGroupFormChange}
                >
                  <option value="">Select leader</option>

                  {users.map((user) => (
                    <option key={user._id} value={user._id}>
                      {user.username} ({user.email})
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Members</label>

                <div className="members-selection">
                  {users.map((user) => (
                    <label key={user._id} className="member-option">
                      <input
                        type="checkbox"
                        checked={groupForm.members.includes(user._id)}
                        onChange={() => handleMemberChange(user._id)}
                      />

                      <span>{user.username}</span>

                      <small>{user.email}</small>
                    </label>
                  ))}
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Group Password</label>

                  <input
                    type="password"
                    name="password"
                    value={groupForm.password}
                    onChange={handleGroupFormChange}
                    placeholder="Enter group password"
                  />
                </div>

                <div className="form-group">
                  <label>Category</label>

                  <input
                    name="category"
                    value={groupForm.category}
                    onChange={handleGroupFormChange}
                    placeholder="e.g. Web Development"
                  />
                </div>
              </div>

              <button type="submit" className="dashboard-action-btn">
                Create Group
              </button>
            </form>
          </section>
        )}

        {/* GROUP LIST */}
        {(role !== "admin" || activeTab === "view") && (
          <section className="groups-section">
            <div className="groups-header">
              <div>
                <h2>Available Groups</h2>
                <p>
                  {groups.length} group
                  {groups.length !== 1 ? "s" : ""} available
                </p>
              </div>
            </div>

            {loading ? (
              <div className="groups-state">Loading groups...</div>
            ) : groups.length === 0 ? (
              <div className="groups-state">
                <div className="empty-group-icon">📂</div>

                <h3>No groups available</h3>

                <p>Groups will appear here once they are created.</p>
              </div>
            ) : (
              <div className="group-grid">
                {groups.map((group) => (
                  <article
                    className="group-card"
                    key={group._id}
                    onClick={() => openGroup(group)}
                  >
                    <div className="group-card-top">
                      <div className="group-icon">
                        {group.name?.charAt(0).toUpperCase()}
                      </div>

                      <span className="group-category">
                        {group.category || "General"}
                      </span>
                    </div>

                    <h3>{group.name}</h3>

                    <p className="group-leader">
                      Leader:{" "}
                      <strong>
                        {group.leader?.username || group.leader || "N/A"}
                      </strong>
                    </p>

                    <div className="group-card-footer">
                      <span>
                        👥{" "}
                        {Array.isArray(group.members)
                          ? group.members.length
                          : 0}{" "}
                        members
                      </span>

                      <span className="enter-group">Enter →</span>
                    </div>

                    {role === "admin" && (
                      <div className="admin-group-actions">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            localStorage.setItem("currentGroupId", group._id);
                            localStorage.setItem(
                              "currentGroupName",
                              group.name,
                            );
                            navigate("/admin-group");
                          }}
                        >
                          Manage
                        </button>
                      </div>
                    )}
                  </article>
                ))}
              </div>
            )}
          </section>
        )}
      </main>

      {/* GROUP LOGIN MODAL */}
      {groupModalOpen && (
        <div
          className="group-modal-overlay"
          onClick={() => setGroupModalOpen(false)}
        >
          <div
            className="group-login-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="modal-close"
              onClick={() => setGroupModalOpen(false)}
            >
              ×
            </button>

            <div className="modal-icon">🔐</div>

            <h2>Enter {selectedGroup?.name}</h2>

            <p>Enter the group password to continue.</p>

            <form onSubmit={handleGroupLogin}>
              <input
                type="password"
                value={groupPassword}
                onChange={(e) => setGroupPassword(e.target.value)}
                placeholder="Group password"
                autoFocus
                required
              />

              <button type="submit" className="dashboard-action-btn">
                Enter Group
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Dashboard;
