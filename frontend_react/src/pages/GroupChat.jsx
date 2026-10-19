import { useCallback, useEffect, useRef, useState } from "react";

import API_URL from "../config/api";
import { socket } from "../socket";
import { useNavigate } from "react-router-dom";

function GroupChat() {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const groupId = localStorage.getItem("currentGroupId");
  const role = localStorage.getItem("groupRole");
  const userId = localStorage.getItem("userId");
  const username = localStorage.getItem("username");

  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const bottomRef = useRef(null);

  const loadMessages = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/api/chat/${groupId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setMessages(Array.isArray(data.messages) ? data.messages : []);
    } catch (err) {
      console.error("Error loading messages:", err);
    } finally {
      setLoading(false);
    }
  }, [groupId, token]);

  useEffect(() => {
    if (!token || !groupId) { navigate("/dashboard"); return; }
    loadMessages(); // eslint-disable-line react-hooks/set-state-in-effect

    socket.connect();
    socket.emit("user_join", { userId, groupId, username });
    socket.emit("join_group", groupId);

    const onNewMessage = (msg) => {
      if (msg.group === groupId || msg.group?._id === groupId) {
        setMessages((prev) => [...prev, msg]);
      }
    };
    const onUpdated = (msg) => {
      setMessages((prev) => prev.map(m => m._id === msg._id ? msg : m));
    };
    const onDeleted = (id) => {
      setMessages((prev) => prev.filter(m => m._id !== id));
    };

    socket.on("new_message", onNewMessage);
    socket.on("message_updated", onUpdated);
    socket.on("message_deleted", onDeleted);

    return () => {
      socket.emit("leave_group", groupId);
      socket.off("new_message", onNewMessage);
      socket.off("message_updated", onUpdated);
      socket.off("message_deleted", onDeleted);
      socket.disconnect();
    };
  }, [token, groupId, navigate, loadMessages, userId, username]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleLogout = () => { localStorage.clear(); navigate("/login"); };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    try {
      const res = await fetch(`${API_URL}/api/chat/${groupId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ message: text.trim() }),
      });
      if (!res.ok) throw new Error("Failed to send");
      setText(""); // message itself arrives via socket 'new_message', not added here
    } catch (err) {
      console.error(err);
      alert("Could not send message.");
    }
  };

  const handleDelete = async (messageId) => {
    if (!window.confirm("Delete this message?")) return;
    try {
      await fetch(`${API_URL}/api/chat/${messageId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      // removal arrives via socket 'message_deleted'
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div id="workspacepage">
      <nav>
        <div className="logo">🚀 {localStorage.getItem("currentGroupName")  || "ProjectHub"}</div>
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
          <a href="#" onClick={() => navigate(role === "leader" ? "/leader-group" : "/member-group")}>📂 Group Info</a><br /><br />
          <a href="#" onClick={() => navigate(role === "leader" ? "/leader-tasks" : "/member-tasks")}>📝 {role === "leader" ? "Task Management" : "Tasks Assigned"}</a><br /><br />
          <a href="#" onClick={() => navigate("/progress")}>📊 Project Progress</a><br /><br />
          <a href="#" onClick={() => navigate("/files")}>📁 File List</a><br /><br />
          <a href="#" className="active">💬 Group Chat</a><br /><br />
          <a href="#" onClick={handleLogout}>🚪 Log Out</a>
        </div>

        <div className="main" style={{ display: "flex", flexDirection: "column", padding: 0 }}>
          <div className="chat-messages">
            {loading ? (
              <p style={{ padding: 20 }}>Loading messages...</p>
            ) : messages.length === 0 ? (
              <div className="groups-state" style={{ margin: 20 }}><h3>No messages yet — say hello</h3></div>
            ) : (
              messages.map((m) => {
                const isMine = (m.sender?._id || m.sender) === userId;
                return (
                  <div key={m._id} className={`chat-bubble-row ${isMine ? "mine" : ""}`}>
                    <div className="chat-bubble">
                      {!isMine && <span className="chat-sender">{m.sender?.username}</span>}
                      <p>{m.message}</p>
                      <span className="chat-time">
                        {new Date(m.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        {m.isEdited && " · edited"}
                      </span>
                      {isMine && (
                        <button className="chat-delete" onClick={() => handleDelete(m._id)}>×</button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
            <div ref={bottomRef} />
          </div>

          <form className="chat-input-row" onSubmit={handleSend}>
            <input
              type="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Type a message..."
            />
            <button type="submit" className="dashboard-action-btn">Send</button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default GroupChat;