import { useEffect, useState } from "react";

import API_URL from "../config/api";
import { useNavigate } from "react-router-dom";

function EditProfile() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    username: "",
    email: "",
    branch: "",
    userClass: "",
    phone: "",
  });

  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const token = localStorage.getItem("token");

  // Load profile
  useEffect(() => {
    const loadProfile = async () => {
      try {
        const response = await fetch(`${API_URL}/api/auth/profile`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error("Failed to load profile");
        }

        const data = await response.json();

        setFormData({
          username: data.username || "",
          email: data.email || "",
          branch: data.branch || "",
          userClass: data.userClass || "",
          phone: data.phone || "",
        });
      } catch (err) {
        console.error(err);
        setError("Unable to load profile.");
      } finally {
        setLoading(false);
      }
    };

    if (!token) {
      navigate("/login");
      return;
    }

    loadProfile();
  }, [token, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setMessage("");
    setError("");

    if (!formData.username || !formData.email) {
      setError("Username and email are required.");
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/auth/update-profile`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (!response.ok) {
        setError(
          result.message || "Failed to update profile."
        );
        return;
      }

      localStorage.setItem(
        "username",
        formData.username
      );

      localStorage.setItem(
        "email",
        formData.email
      );

      setMessage("Profile updated successfully!");

      setTimeout(() => {
        navigate("/dashboard");
      }, 1200);

    } catch (err) {
      console.error(err);
      setError(
        "Something went wrong. Please try again."
      );
    }
  };

  if (loading) {
    return (
      <div className="profile-page">
        <div className="profile-loading">
          Loading profile...
        </div>
      </div>
    );
  }

  return (
    <div className="profile-page">

      <div className="profile-edit-card">

        <button
          className="back-dashboard"
          onClick={() => navigate("/dashboard")}
        >
          ← Back to Dashboard
        </button>

        <div className="profile-edit-header">

          <div className="profile-edit-avatar">
            {formData.username
              ?.charAt(0)
              .toUpperCase() || "U"}
          </div>

          <div>
            <span>ACCOUNT SETTINGS</span>

            <h1>Edit Profile</h1>

            <p>
              Update your personal information.
            </p>
          </div>

        </div>

        <form
          className="profile-form"
          onSubmit={handleSubmit}
        >

          <div className="profile-form-grid">

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
              />
            </div>

            <div className="form-group">
              <label>Class</label>

              <input
                type="text"
                name="userClass"
                value={formData.userClass}
                onChange={handleChange}
              />
            </div>

            <div className="form-group full-width">
              <label>Phone</label>

              <input
                type="text"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
              />
            </div>

          </div>

          {error && (
            <div className="profile-message error">
              {error}
            </div>
          )}

          {message && (
            <div className="profile-message success">
              {message}
            </div>
          )}

          <button
            type="submit"
            className="save-profile-btn"
          >
            Save Changes
          </button>

        </form>

      </div>

    </div>
  );
}

export default EditProfile;