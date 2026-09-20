import { useNavigate } from "react-router-dom";
import { useState } from "react";

function CreateAccount() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    branch: "",
    className: "",
    phone: "",
    password: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    console.log("Registration data:", formData);

    // We will connect this to your existing auth.js/backend next.
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

          <button type="submit" className="create-account-btn">
            CREATE
          </button>
        </form>
      </div>
    </div>
  );
}

export default CreateAccount;
