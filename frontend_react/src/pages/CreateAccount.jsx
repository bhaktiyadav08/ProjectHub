import API_URL from "../config/api";
import { useNavigate } from "react-router-dom";
import { useState } from "react";

function CreateAccount() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    branch: "",
    className: "", // Maps to database userClass
    phone: "",
    password: "",
  });

  // Added missing UI states
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  // ⚡ The missing handleSubmit implementation
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    console.log("Registration data sending:", formData);

    try {
      const res = await fetch(`${API_URL}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // Ensure property keys perfectly match what your backend controller reads!
        body: JSON.stringify({
          username: formData.username,
          email: formData.email,
          branch: formData.branch,
          userClass: formData.className, // Matches backend expected parameter
          phone: formData.phone,
          password: formData.password,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || "Registration failed. Please try again.");
        return;
      }

      // Success! Send user to login page or dashboard
      console.log("Registration successful!", data);
      navigate("/login"); 
      
    } catch (err) {
      console.error("Network error:", err);
      setError("Server error. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="create-account-page">
      <div className="create-account-container">
        <button
          className="back-dashboard"
          onClick={() => navigate("/")}
          style={{ marginBottom: 16 }}
        >
          ← Back to Home
        </button>
        <div className="create-account-header">
          <h1>CREATE ACCOUNT</h1>
        </div>

        {/* Display backend errors if they happen */}
        {error && <div className="auth-error" style={{ color: "red", marginBottom: 12 }}>{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Username</label>
            <input
              type="text"
              name="username"
              value={formData.username}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label>Branch</label>
            <input
              type="text"
              name="branch"
              value={formData.branch}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label>Class</label>
            <input
              type="text"
              name="className"
              value={formData.className}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label>Phone</label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
            />
          </div>

          {/* Button shows state feedback while running network task */}
          <button type="submit" className="create-account-btn" disabled={loading}>
            {loading ? "CREATING..." : "CREATE"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default CreateAccount;
