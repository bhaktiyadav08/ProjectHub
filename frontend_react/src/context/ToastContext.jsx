import { createContext, useCallback, useEffect, useState } from "react";

import { socket } from "../socket";

export const ToastContext = createContext();

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const showToast = useCallback((message) => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message }]);
    setTimeout(() => setToasts((prev) => prev.filter(t => t.id !== id)), 4000);
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;

    socket.connect();
    socket.emit("user_join", {
      userId: localStorage.getItem("userId"),
      groupId: localStorage.getItem("currentGroupId"),
      username: localStorage.getItem("username"),
    });

    const onTaskNotif = (data) => showToast(`📝 ${data.message}`);
    const onNewMessage = (msg) => {
      // Only toast if we're not currently on the chat page (avoid duplicate with visible bubble)
      if (!window.location.pathname.includes("/chat")) {
        showToast(`💬 ${msg.sender?.username || "Someone"}: ${msg.message}`);
      }
    };

    socket.on("new_task_notification", onTaskNotif);
    socket.on("new_message", onNewMessage);

    return () => {
      socket.off("new_task_notification", onTaskNotif);
      socket.off("new_message", onNewMessage);
    };
  }, [showToast]);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="toast-stack">
        {toasts.map(t => <div key={t.id} className="toast">{t.message}</div>)}
      </div>
    </ToastContext.Provider>
  );
}