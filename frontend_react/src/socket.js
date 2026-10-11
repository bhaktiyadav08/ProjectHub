import { io } from "socket.io-client";

// ✅ FIX: Instead of a hardcoded string, this reads your active .env variable!
// The "||" serves as a safe backup link if an environment variable isn't found.
const SOCKET_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

export const socket = io(SOCKET_URL, {
  autoConnect: false,
  withCredentials: true // Required to match the backend CORS updates we made earlier
});
