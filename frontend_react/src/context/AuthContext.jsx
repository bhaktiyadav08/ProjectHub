import { createContext, useEffect, useState } from "react";

import { api } from "../api/client";

export const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(() => !!localStorage.getItem("token"));

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return; // loading already initialized to false above
    api("/auth/profile")
      .then(setUser)
      .catch(() => localStorage.removeItem("token"))
      .finally(() => setLoading(false));
  }, []);

  function login(data) {
  localStorage.setItem("token", data.token);
  localStorage.setItem("role", data.role || "");
  localStorage.setItem("username", data.username || "");
  localStorage.setItem("email", data.email || "");
  localStorage.setItem("userId", data._id || "");
  setUser(data);
}

  function logout() {
    api("/auth/logout", { method: "POST" }).catch(() => {});
    localStorage.clear();
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}