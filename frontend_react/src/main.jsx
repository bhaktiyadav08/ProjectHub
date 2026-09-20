import "./styles/Global.css";

import App from "./App.jsx";
import { AuthProvider } from "./context/AuthContext";
import { createRoot } from "react-dom/client";

createRoot(document.getElementById("root")).render(
  <AuthProvider>
    <App />
  </AuthProvider>,
);
