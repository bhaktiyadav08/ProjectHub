import { useCallback, useEffect, useState } from "react";

import API_URL from "../config/api";
import { useNavigate } from "react-router-dom";

function GroupFiles() {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const groupId = localStorage.getItem("currentGroupId");
  const role = localStorage.getItem("groupRole");

  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  const loadFiles = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/api/files/group/${groupId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setFiles(Array.isArray(data.files) ? data.files : []);
    } catch (err) {
      console.error("Error loading files:", err);
    } finally {
      setLoading(false);
    }
  }, [groupId, token]);

  useEffect(() => {
    if (!token || !groupId) { navigate("/dashboard"); return; }
    loadFiles(); // eslint-disable-line react-hooks/set-state-in-effect
  }, [token, groupId, navigate, loadFiles]);

  const handleLogout = () => { localStorage.clear(); navigate("/login"); };

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);
    formData.append("groupId", groupId);

    try {
      setUploading(true);
      const res = await fetch("${API_URL}/api/files/upload", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` }, // no Content-Type — browser sets multipart boundary
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) { alert(data.error || "Upload failed."); return; }
      loadFiles();
    } catch (err) {
      console.error(err);
      alert("Server error during upload.");
    } finally {
      setUploading(false);
      e.target.value = ""; // reset input so same file can be re-selected later
    }
  };

  const handleDownload = (fileId, fileName) => {
    // Direct navigation triggers res.download() from the browser; auth header can't be sent this way,
    // so this only works if your download route doesn't strictly require the header,
    // OR open in new tab and let cookies/session handle it. Since you're JWT-header-based, use fetch+blob instead:
    fetch(`${API_URL}/api/files/download/${fileId}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(res => res.blob())
      .then(blob => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = fileName;
        a.click();
        window.URL.revokeObjectURL(url);
      })
      .catch(err => {
        console.error(err);
        alert("Download failed.");
      });
  };

  const handleRename = async (fileId, currentName) => {
    const newName = prompt("Rename file:", currentName);
    if (!newName || newName === currentName) return;

    try {
      const res = await fetch(`${API_URL}/api/files/rename/${fileId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ newName }),
      });
      const data = await res.json();
      if (!res.ok) { alert(data.error || "Rename failed."); return; }
      loadFiles();
    } catch (err) {
      console.error(err);
      alert("Server error during rename.");
    }
  };

  const handleDelete = async (fileId) => {
    if (!window.confirm("Delete this file?")) return;
    try {
      const res = await fetch(`${API_URL}/api/files/delete/${fileId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) { alert(data.error || "Delete failed."); return; }
      loadFiles();
    } catch (err) {
      console.error(err);
      alert("Server error during delete.");
    }
  };

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
          <a href="#" onClick={() => navigate("/progress")}>📊 Project Progress</a><br /><br />
          <a href="#"onClick={()=> navigate("/files")}>📁 File List</a><br /><br />
          <a href="#" className="active" onClick={() => navigate("/chat")} >💬 Group Chat</a><br /><br />
          <a href="#" onClick={handleLogout}>🚪 Log Out</a>
        </div>

        <div className="main">
          <div className="content" style={{ maxWidth: 780 }}>
            <div className="task-header">
              <h1>Group Files</h1>
              <label className="dashboard-action-btn" style={{ cursor: "pointer" }}>
                {uploading ? "Uploading..." : "+ Upload File"}
                <input type="file" onChange={handleUpload} disabled={uploading} style={{ display: "none" }} />
              </label>
            </div>

            {loading ? (
              <p>Loading files...</p>
            ) : files.length === 0 ? (
              <div className="groups-state"><h3>No files uploaded yet</h3></div>
            ) : (
              <div className="group-info-list" style={{ marginTop: 16 }}>
                {files.map(f => (
                  <div key={f._id} className="file-row">
                    <div>
                      <strong>{f.name}</strong>
                      <span className="file-meta">{f.type?.toUpperCase()} · uploaded by {f.uploadedBy?.username || "unknown"}</span>
                    </div>
                    <div className="file-actions">
                      <button onClick={() => handleDownload(f._id, f.name)}>Download</button>
                      <button onClick={() => handleRename(f._id, f.name)}>Rename</button>
                      <button onClick={() => handleDelete(f._id)} className="file-delete">Delete</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default GroupFiles;