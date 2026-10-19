import API_URL from "../config/api";
import { useAuth } from "../context/useAuth";
import { useNavigate } from "react-router-dom";
import { useState } from "react";

function Login() {
  const navigate = useNavigate();
  const { login } = useAuth(); // ← actually use it

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");

    if (!username || !password) {
      setError("Username and password are required.");
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(`${API_URL}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (!response.ok || !data.token) {
        setError(data.message || "Login failed.");
        return;
      }

      login(data); // ← sets token in localStorage AND updates context's user state
      navigate("/dashboard");
    } catch (error) {
      console.error(error);
      setError("Server error. Try again later.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <button
          className="back-dashboard"
          onClick={() => navigate("/")}
          style={{ marginBottom: 16 }}
        >
          ← Back to Home
        </button>
        <div className="login-header">
          <span className="auth-eyebrow">PROJECTHUB</span>

          <h1>Welcome back</h1>

          <p>Sign in to continue to your workspace.</p>
        </div>

        <form onSubmit={handleLogin}>
          <div className="form-group">
            <label>Username</label>

            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter your username"
              required
            />
          </div>

          <div className="form-group">
            <label>Password</label>

            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
            />
          </div>

          {error && <div className="auth-error">{error}</div>}

          <button type="submit" className="login-submit" disabled={loading}>
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>

        <p className="create-account-text">
          Don't have an account?{" "}
          <button
            type="button"
            onClick={() => navigate("/create-account")}
            className="link-button"
          >
            Create Account
          </button>
        </p>
      </div>
    </div>
  );
}

export default Login;
