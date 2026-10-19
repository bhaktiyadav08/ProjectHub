import { useNavigate } from "react-router-dom";

function Home() {
  const navigate = useNavigate();

  return (
    <div className="home-page">
      <nav className="navbar">
        <div className="brand">
          <div className="brand-mark">
            <span></span>
            <span></span>
            <span></span>
          </div>

          <span className="brand-name">ProjectHub</span>
        </div>

        <div className="nav-actions">
          <button className="nav-login-btn" onClick={() => navigate("/login")}>
            Login
          </button>

          <button
            className="nav-get-started"
            onClick={() => navigate("/create-account")}
          >
            Get Started
          </button>
        </div>
      </nav>

      <main className="home-content">
        <div className="hero-badge">✦ Collaborative project management</div>

        <h1>
          Everything your team needs
          <span> to build together.</span>
        </h1>

        <p>
          ProjectHub brings team collaboration, task management, real-time
          communication, project tracking and file sharing into one workspace.
        </p>

        <div className="hero-actions">
          <button
            className="hero-primary-btn"
            onClick={() => navigate("/create-account")}
          >
            Get Started →
          </button>

          <button
            className="hero-secondary-btn"
            onClick={() => navigate("/login")}
          >
            Sign In
          </button>
        </div>

        <div className="product-preview">
          <div className="preview-sidebar">
            <div className="preview-logo">🚀</div>

            <div className="preview-nav active">▦</div>

            <div className="preview-nav">✓</div>

            <div className="preview-nav">💬</div>

            <div className="preview-nav">📁</div>
          </div>

          <div className="preview-main">
            <div className="preview-topbar">
              <div>
                <small>Workspace</small>
                <strong>ProjectHub Team</strong>
              </div>

              <div className="preview-avatar">B</div>
            </div>

            <div className="preview-title">
              <div>
                <small>Overview</small>
                <h3>Team Workspace</h3>
              </div>

              <div className="preview-status">● Active</div>
            </div>

            <div className="preview-cards">
              <div className="preview-card">
                <span>Projects</span>
                <strong>04</strong>
                <small>Active projects</small>
              </div>

              <div className="preview-card">
                <span>Tasks</span>
                <strong>18</strong>
                <small>Across your teams</small>
              </div>

              <div className="preview-card">
                <span>Members</span>
                <strong>12</strong>
                <small>Collaborators</small>
              </div>
            </div>

            <div className="preview-bottom">
              <div className="preview-project">
                <div className="preview-section-title">Active Projects</div>

                <div className="fake-project">
                  <div>
                    <strong>Website Redesign</strong>
                    <small>6 members · 14 tasks</small>
                  </div>

                  <span>72%</span>

                  <div className="fake-progress">
                    <div />
                  </div>
                </div>

                <div className="fake-project">
                  <div>
                    <strong>Mobile Application</strong>
                    <small>4 members · 9 tasks</small>
                  </div>

                  <span>48%</span>

                  <div className="fake-progress">
                    <div style={{ width: "48%" }} />
                  </div>
                </div>
              </div>

              <div className="preview-activity">
                <div className="preview-section-title">Recent Activity</div>

                <div className="activity">
                  <div className="activity-dot" />
                  <div>
                    <strong>Task completed</strong>
                    <small>2 min ago</small>
                  </div>
                </div>

                <div className="activity">
                  <div className="activity-dot purple" />
                  <div>
                    <strong>New member joined</strong>
                    <small>15 min ago</small>
                  </div>
                </div>

                <div className="activity">
                  <div className="activity-dot orange" />
                  <div>
                    <strong>Project updated</strong>
                    <small>32 min ago</small>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <section className="features-section">
          <div className="section-heading">
            <span>BUILT FOR COLLABORATION</span>
            <h2>Everything in one workspace.</h2>
          </div>

          <div className="feature-container">
            <div className="feature-card">
              <div className="feature-icon purple">👥</div>
              <h2>Team Collaboration</h2>
              <p>
                Create groups, manage members and work together from a shared
                workspace.
              </p>
            </div>

            <div className="feature-card">
              <div className="feature-icon blue">✓</div>
              <h2>Task Management</h2>
              <p>
                Assign tasks, update their status and keep your project work
                organized.
              </p>
            </div>

            <div className="feature-card">
              <div className="feature-icon green">💬</div>
              <h2>Real-Time Chat</h2>
              <p>
                Communicate with your team instantly using real-time group
                messaging.
              </p>
            </div>

            <div className="feature-card">
              <div className="feature-icon orange">📁</div>
              <h2>File Sharing</h2>
              <p>
                Keep project files accessible to the right people in your
                workspace.
              </p>
            </div>
          </div>
        </section>
      </main>

      <footer className="home-footer">
        <div>
          🚀 <strong>ProjectHub</strong>
        </div>

        <span>Collaborative project management platform</span>
      </footer>
    </div>
  );
}

export default Home;
