// ===== REGISTER FORM =====
const registerForm = document.getElementById("registerForm");
if (registerForm) {
  registerForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const username = document.getElementById("username").value.trim();
    const email = document.getElementById("email").value.trim();
    const branch = document.getElementById("branch").value.trim();
    const userClass = document.getElementById("class").value.trim();
    const phone = document.getElementById("phone").value.trim();
    const password = document.getElementById("password").value.trim();

    if (!username || !email || !password) return alert("Username, email, and password are required!");

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, email, branch, userClass, phone, password })
      });
      const data = await res.json();

      if (res.ok && data.token) {
        localStorage.setItem("token", data.token);
        localStorage.setItem("username", data.username);
        localStorage.setItem("email", data.email || "");
        alert("Registration successful!");
        window.location.href = "login_page.html";
      } else {
        alert(data.message || "Registration failed!");
      }
    } catch (err) {
      console.error(err);
      alert("Server error. Try again later.");
    }
  });
}

// ===== LOGIN FORM =====
const loginForm = document.getElementById("loginForm");
if (loginForm) {
  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const username = document.getElementById("username").value.trim();
    const password = document.getElementById("password").value.trim();

    if (!username || !password) return alert("Username and password are required!");

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password })
      });
      const data = await res.json();

      if (res.ok && data.token) {
        localStorage.setItem("token", data.token);
        localStorage.setItem("username", data.username);
        localStorage.setItem("email", data.email || "");
        localStorage.setItem("role", data.role);
        localStorage.setItem("userId", data._id);   // <-- save role from backend
        localStorage.setItem("role", data.role); // optional
  // Redirect based on role
  if (data.role === "admin") {
    window.location.href = "Admin_Home_Page.html";  // Admin page
  } else {
    window.location.href = "User_Home_Page.html";       // Normal user page
  }
      } else {
        alert(data.message || "Login failed!");
      }
    } catch (err) {
      console.error(err);
      alert("Server error. Try again later.");
    }
  });
}

// ===== CHECK AUTH =====
function checkAuth() {
  const token = localStorage.getItem("token");
  const currentPage = window.location.pathname;

  // ✅ Pages that should NOT require login
  const publicPages = [
    "/",
    "/Home_page.html",
    "/login_page.html",
    "/Create_account_page.html"
  ];

  // ✅ If current page is public, don't force redirect
  if (publicPages.some(page => currentPage.endsWith(page))) {
    return token !== null; // Return true if logged in, false if not
  }

  // ✅ If page is protected and no token → send to login
  if (!token) {
    window.location.href = "login_page.html";
    return false;
  }

  return true;
}
// ===== ROLE CHECK =====
function checkRole(requiredRole) {
  const role = localStorage.getItem("role");
  if (role !== requiredRole) {
    alert("Access denied! Only " + requiredRole + "s can access this page.");
    window.location.href = "User_Home_Page.html"; 
    return false;
  }
  return true;
}
// ===== LOGOUT =====
async function logout() {
  try {
    const token = localStorage.getItem("token");
    await fetch("/api/auth/logout", {
      method: "POST",
      headers: { "Authorization": `Bearer ${token}` }
    });
  } catch (err) {
    console.warn("Logout request failed:", err);
  }
  alert("logged out successfully!");
  localStorage.clear();
  window.location.href = "Home_page.html";
    
}

// ===== PROFILE & SIDEBAR =====
document.addEventListener("DOMContentLoaded", async () => {
  if (!checkAuth()) return;

  const profileNameEl = document.getElementById("profileName");
  const profileEmailEl = document.getElementById("profileEmail");
  const profileBtnEl = document.getElementById("profileBtn");
  const sidebarEl = document.getElementById("sidebar");
  const overlayEl = document.getElementById("overlay");
  const logoutBtn = document.getElementById("logoutBtn");
  const editProfileBtn = document.getElementById("editProfileBtn");

  // Sidebar toggle
  if (profileBtnEl && sidebarEl && overlayEl) {
    profileBtnEl.addEventListener("click", () => {
      sidebarEl.classList.toggle("active");
      overlayEl.classList.toggle("active");
    });

    overlayEl.addEventListener("click", () => {
      sidebarEl.classList.remove("active");
      overlayEl.classList.remove("active");
    });
  }

  // Logout
  if (logoutBtn) logoutBtn.addEventListener("click", logout);

  // Edit profile
  if (editProfileBtn) {
    editProfileBtn.addEventListener("click", () => {
      window.location.href = "edit_profile.html";
    });
  }

  // Load profile info from localStorage
  let username = localStorage.getItem("username") || "User";
  let email = localStorage.getItem("email") || "user@example.com";

  if (profileNameEl) profileNameEl.textContent = username;
  if (profileEmailEl) profileEmailEl.textContent = email;
  if (profileBtnEl) profileBtnEl.textContent = username.charAt(0).toUpperCase();

  // Fetch latest profile from backend
  try {
    const token = localStorage.getItem("token");
    const res = await fetch("/api/auth/profile", {
      headers: { "Authorization": `Bearer ${token}` }
    });

    if (res.ok) {
      const data = await res.json();
      username = data.username || username;
      email = data.email || email;
      localStorage.setItem("username", username);
      localStorage.setItem("email", email);

      if (profileNameEl) profileNameEl.textContent = username;
      if (profileEmailEl) profileEmailEl.textContent = email;
      if (profileBtnEl) profileBtnEl.textContent = username.charAt(0).toUpperCase();
    } else if (res.status === 401) {
      // Token expired or invalid — logout user
      logout();
    }
  } catch (err) {
    console.warn("Could not fetch profile:", err);
  }
});

// ===== EDIT PROFILE PAGE =====
document.addEventListener("DOMContentLoaded", () => {
  if (!document.getElementById("editProfileForm")) return;

  const form = document.getElementById("editProfileForm");
  const toast = document.getElementById("toast");
  const token = localStorage.getItem("token");

  // Pre-fill form
  fetch("/api/auth/profile", {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`
    }
  })
    .then(res => res.json())
    .then(data => {
      document.getElementById("editUsername").value = data.username || "";
      document.getElementById("editEmail").value = data.email || "";
      document.getElementById("editBranch").value = data.branch || "";
      document.getElementById("editClass").value = data.userClass || "";
      document.getElementById("editPhone").value = data.phone || "";
    })
    .catch(err => console.error("Failed to load profile data", err));

  // Toast helper
  function showToast(message) {
    toast.textContent = message;
    toast.classList.add("show");
    setTimeout(() => toast.classList.remove("show"), 3000);
  }

  // Submit update
  form.addEventListener("submit", async e => {
    e.preventDefault();
    const username = document.getElementById("editUsername").value.trim();
    const email = document.getElementById("editEmail").value.trim();
    const branch = document.getElementById("editBranch").value.trim();
    const userClass = document.getElementById("editClass").value.trim();
    const phone = document.getElementById("editPhone").value.trim();

    if (!username || !email) {
      showToast("Please fill all fields.");
      return;
    }

    try {
      const response = await fetch("/api/auth/update-profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ username, email, branch, userClass, phone })
      });

      const result = await response.json();
      if (response.ok) {
        showToast("Profile updated successfully!");
        setTimeout(() => {
    const role = localStorage.getItem("role");
    if (role === "admin") {
        window.location.href = "Admin_Home_Page.html";
    } else {
        window.location.href = "User_Home_Page.html";
    }
}, 1500);
      } else {
        showToast(result.message || "Failed to update profile.");
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      showToast("An error occurred. Try again.");
    }
  });
});

// ===== GROUP CREATION PAGE =====
document.addEventListener("DOMContentLoaded", () => {
  const backBtn = document.getElementById("backDashboardBtn");
  if (backBtn) {
    backBtn.addEventListener("click", () => {
      const role = localStorage.getItem("role");
      if (role === "admin") {
        window.location.href = "Admin_Home_Page.html";
      } else {
        window.location.href = "User_Home_Page.html";
      }
    });
  }
  // Only run this code if we're on the admin group creation page
  const groupForm = document.getElementById("createGroupForm");
  if (!groupForm) return; // Not on that page, skip

  // Ensure only admin can access
  if (!checkAuth() || !checkRole("admin")) return;

  // Populate members list
  fetchAndPopulateUsers();
 
  // Handle form submission
  groupForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const name = document.getElementById("groupName").value.trim();
    const leaderSelect = document.getElementById("leaderName");
    const leader = leaderSelect.value;  // this is now user._id
    const membersContainer = document.getElementById("groupMembersCheckboxContainer");

const selectedMembers = Array.from(
  document.querySelectorAll("#groupMembersCheckboxContainer input[type='checkbox']:checked")
).map(cb => cb.value);
    const password = document.getElementById("groupPassword").value.trim();
    const category = document.getElementById("groupCategory").value;

    if (!name || !leader||!selectedMembers.length ||!password || !category) {
      alert("Please fill all fields before submitting.");
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const res = await fetch("/api/groups/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({
          name,
          leader,
           members: selectedMembers,
          password,
          category,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        alert("Group created successfully!");
        groupForm.reset();
      } else {
        alert(data.message || "Failed to create group.");
      }
    } catch (err) {
      console.error("Error creating group:", err);
      alert("Server error. Please try again.");
    }
  });
});
async function fetchAndPopulateUsers() {
  try {
    const token = localStorage.getItem("token");
    if (!token) {
      console.error("No token found");
      return;
    }

    const res = await fetch("/api/groups/users", {
      headers: {
        "Authorization": `Bearer ${token}`
      }
    });

    if (!res.ok) {
      console.error("Failed to fetch users:", res.statusText);
      return;
    }

    const users = await res.json(); // expecting array of { _id, username, email }
    if (!Array.isArray(users)) {
      console.error("Invalid users data:", users);
      return;
    }

    const leaderSelect = document.getElementById("leaderName");
     const membersContainer = document.getElementById("groupMembersCheckboxContainer");

    if (!leaderSelect || !membersContainer) {
      console.error("Dropdown elements not found");
      return;
    }

    // Clear existing options
    leaderSelect.innerHTML = '<option value="">-- Select Leader --</option>';
    membersContainer.innerHTML = '';

    users.forEach(user => {
      const option = document.createElement("option");
      option.value = user._id;
      option.textContent = `${user.username} (${user.email})`;

      // Add to leader dropdown
      leaderSelect.appendChild(option);
      // Checkbox for members
      const label = document.createElement("label");
      label.style.display = "block";

      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.value = user._id;
      checkbox.name = "groupMembersCheckbox";

      label.appendChild(checkbox);
      label.append(` ${user.username} (${user.email})`);
      membersContainer.appendChild(label);
    });
  }
 catch (err) {
    console.error("Error fetching users:", err);
  }
}
// ====== FETCH & DISPLAY GROUPS ======
async function fetchAndDisplayGroups() {
  try {
    const token = localStorage.getItem("token");
    const role = localStorage.getItem("role");
    const isAdminPage = window.location.pathname.includes("Admin_Home_Page.html");
    // ✅ CHECK IF USER IS LOGGED IN FIRST
    if (!token) {
      console.log('No token found - user is logged out');
      displayLoggedOutState();
      return;
    }

    const res = await fetch("/api/groups", {
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      }
    });
    // ✅ HANDLE 401 UNAUTHORIZED GRACEFULLY
    if (res.status === 401) {
      console.log('Token expired or invalid');
      displayLoggedOutState();
      return;
    }
    if (!res.ok) throw new Error("Failed to fetch groups");

    const groups = await res.json();
    const groupList = document.getElementById("groupList");
    if (!groupList) return;
    groupList.innerHTML = "";

    if (groups.length === 0) {
      groupList.innerHTML = "<p style='color:white'>No groups available.</p>";
      return;
    }

    groups.forEach(group => {
      const box = document.createElement("div");
      box.className = "group-box";

         // Safe members list
    let membersList = "No members";
    if (group.members) {
        if (Array.isArray(group.members) && group.members.length > 0) {
              membersList = group.members.map(m => m.username || m).join(", ");
        } else if (typeof group.members === "string") {
            membersList = group.members;
        }
    }

      box.innerHTML = `
        <p><strong>Group:</strong> ${group.name}</p>
        <p><strong>Leader:</strong> ${group.leader ? (group.leader.username || group.leader) : "N/A"}</p>
        <p><strong>Members:</strong> ${membersList}</p>
        <p><strong>Category:</strong> ${group.category || "N/A"}</p>
      `;
      // Click behavior for all users
box.addEventListener("click", () => {
    if (role === "admin") {
        // Admin directly goes to group info page
        localStorage.setItem("currentGroupId", group._id);
        localStorage.setItem("currentGroupName", group.name);
        window.location.href = "/Admin_group_info.html";
    } else {
        // Non-admin opens login modal
        openGroupLoginModal(group._id, group.name);
    }
     
});

      // Only show edit + delete buttons if admin
      if (role === "admin" && isAdminPage) {
        const actions = document.createElement("div");
        actions.className = "group-actions";
        actions.innerHTML = `
          <button class="edit-btn" data-id="${group._id}" style="color:blue">Edit</button>
          <button class="delete-btn" data-id="${group._id}" style="color:blue">Delete</button>
        `;
        box.appendChild(actions);

        // EDIT button listener
        actions.querySelector(".edit-btn").addEventListener("click", async (e) => {
           e.stopPropagation();  // ⏹ Stop bubbling!
           e.preventDefault();
          const modal = document.getElementById("editGroupModal");
          modal.style.display = "block";

          document.getElementById("editGroupName").value = group.name;
          document.getElementById("editGroupPassword").value = "";
          document.getElementById("editGroupCategory").value = group.category;

          const leaderSelect = document.getElementById("editLeaderName");
          const membersContainer = document.getElementById("editGroupMembersCheckboxContainer");
          leaderSelect.innerHTML = "";
         membersContainer.innerHTML = "";

          // Fetch users for dropdown
          const userRes = await fetch("/api/groups/users", {
            headers: { "Authorization": `Bearer ${token}` }
          });
          const users = await userRes.json();

          users.forEach(user => {
            const option = document.createElement("option");
            option.value = user._id;
            option.textContent = `${user.username} (${user.email})`;
            leaderSelect.appendChild(option.cloneNode(true));
             const label = document.createElement("label");
  label.style.display = "block";

  const checkbox = document.createElement("input");
  checkbox.type = "checkbox";
  checkbox.value = user._id;
  checkbox.name = "editGroupMembersCheckbox";

  // Check if this user is a member of the group
 if (Array.isArray(group.members) && group.members.some(m => m._id === user._id || m === user._id)) {
    checkbox.checked = true;
  }

  label.appendChild(checkbox);
  label.append(` ${user.username} (${user.email})`);
  membersContainer.appendChild(label);
});
             // If leader is an object, get its _id
const leaderId = group.leader?._id || group.leader; // works if it's a string or object

          // Select current leader
          for (let i = 0; i < leaderSelect.options.length; i++) {
            if (leaderSelect.options[i].value === leaderId) {
              leaderSelect.selectedIndex = i;
              break;
            }
          }

         
          // Handle form submit
          const editForm = document.getElementById("editGroupForm");
          editForm.onsubmit = async (e) => {
            e.preventDefault();
            const updatedName = document.getElementById("editGroupName").value.trim();
            const updatedPassword = document.getElementById("editGroupPassword").value.trim();
            const updatedCategory = document.getElementById("editGroupCategory").value.trim();
            const updatedLeader = leaderSelect.value;
            const updatedMembers = Array.from(
  document.querySelectorAll("#editGroupMembersCheckboxContainer input[type='checkbox']:checked")
).map(cb => cb.value);
             // Prepare body data
const bodyData = {
  name: updatedName,
  leader: updatedLeader,
  members: updatedMembers,
  category: updatedCategory
};

// Only include password if entered
if (updatedPassword) {
  bodyData.password = updatedPassword;
}
            try {
              const res = await fetch(`/api/groups/${group._id}`, {
                method: "PUT",
                headers: {
                  "Content-Type": "application/json",
                  "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify(bodyData)
              });

              if (res.ok) {
                alert("Group updated successfully!");
                modal.style.display = "none";
                fetchAndDisplayGroups();
              } else {
                const data = await res.json();
                alert(data.message || "Failed to update group");
              }
            } catch (err) {
              console.error("Error updating group:", err);
              alert("Server error. Try again later.");
            }
          };
          
        });

        // DELETE button listener
        actions.querySelector(".delete-btn").addEventListener("click", async (e) => {
           e.stopPropagation();  // ⏹ Stop bubbling!
           e.preventDefault();
          if (!confirm("Are you sure you want to delete this group?")) return;

          try {
            const res = await fetch(`/api/groups/${group._id}`, {
              method: "DELETE",
              headers: { "Authorization": `Bearer ${token}` }
            });

            if (res.ok) {
              alert("Group deleted successfully!");
              fetchAndDisplayGroups();
            } else {
              const data = await res.json();
              alert(data.message || "Failed to delete group");
            }
          } catch (err) {
            console.error("Error deleting group:", err);
            alert("Server error. Try again later.");
          }
        });
      }

      groupList.appendChild(box);
    });
  } catch (err) {
    console.error("Error loading groups:", err);
    displayLoggedOutState();
    const groupList = document.getElementById("groupList");
    if (groupList) groupList.innerHTML = "<p style='color:red;'>Error loading groups</p>";
  }
}

// ✅ ADD THIS FUNCTION TO HANDLE LOGGED OUT STATE
function displayLoggedOutState() {
  const groupList = document.getElementById("groupList");
  if (!groupList) return;

  groupList.innerHTML = `
    <div class="logged-out-state" style="text-align: center; color: white; padding: 40px;">
      <h3>🚀 Welcome to ProjectHub!</h3>
      <p>Please log in to view and manage your groups</p>
      <button onclick="window.location.href='login.html'" 
              style="background: #007bff; color: white; border: none; padding: 10px 20px; 
                     border-radius: 5px; cursor: pointer; margin-top: 15px;">
        Log In Now
      </button>
    </div>
  `;
}
document.addEventListener("DOMContentLoaded", () => {
  const tabs = document.querySelectorAll(".tab-btn");
  const contents = document.querySelectorAll(".tab-content");

  tabs.forEach(tab => {
    tab.addEventListener("click", () => {
      // Remove active from all tabs
      tabs.forEach(t => t.classList.remove("active"));
      contents.forEach(c => c.classList.remove("active"));

      // Activate clicked tab
      tab.classList.add("active");
      const activeContent = document.getElementById(tab.dataset.tab);
      activeContent.classList.add("active");

      // If 'view' tab clicked, fetch groups
      if (tab.dataset.tab === "view") {
        fetchAndDisplayGroups();
      }
    });
  });
    // ---- Add this line to fetch groups on page load ----
  fetchAndDisplayGroups();
   // ✅ WRAP THIS CALL IN ERROR HANDLING
  try {
    fetchAndDisplayGroups();
  } catch (error) {
    console.log('Initial groups load failed - user might be logged out');
    displayLoggedOutState();
  }

  // Close modal when clicking the "×"
const closeModalBtn = document.getElementById("closeModal");
const editModal = document.getElementById("editGroupModal");

if (closeModalBtn && editModal) {
  closeModalBtn.addEventListener("click", () => {
    editModal.style.display = "none";
  });
}

// Optional: close modal when clicking outside the modal content
window.addEventListener("click", (e) => {
  if (e.target === editModal) {
    editModal.style.display = "none";
  }
});
// --- Group login modal setup ---
    const modal = document.getElementById("groupLoginModal");
    const form = document.getElementById("groupLoginForm");
    const passwordInput = document.getElementById("groupPassword");
    const modalGroupName = document.getElementById("modalGroupName");
    const closeBtn = document.getElementById("closeGroupModal");
    // Only proceed if all elements exist
  if (modal && form && passwordInput && modalGroupName) {
  
    // Close modal via close button
    if (closeBtn) {
      closeBtn.addEventListener("click", () => {
        modal.style.display = "none";
      });
    }

    // Close modal when clicking outside modal content
    window.addEventListener("click", (event) => {
      if (event.target === modal) {
        modal.style.display = "none";
      }
    });

    // Submit handler (once)
    form.addEventListener("submit", async (e) => {
        e.preventDefault();
        const groupId = form.dataset.groupId;
        const groupName = form.dataset.groupName;
        const password = passwordInput.value;
        const token = localStorage.getItem("token");
        const loggedInUserId = localStorage.getItem("userId"); // or however you store logged-in user
        if (!loggedInUserId) return alert("User not logged in properly.");
        try {
            const res = await fetch(`/api/groups/login`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                
                body: JSON.stringify({ name: groupName, password , userId: loggedInUserId })
            });

            const data = await res.json();

            if (res.ok) {
                const group = data.group; // <- from backend
                // Store group info in localStorage

    
      modal.style.display = "none";
 
    // store group id in localStorage
    localStorage.setItem("currentGroupId", data.group._id); 
    localStorage.setItem("currentGroupName", data.group.name);
    localStorage.setItem("role", data.role);
    
     // store role for later
    // Determine role: leader or member
            const leaderId = group.leader?._id || group.leader;
            const role = (loggedInUserId === leaderId) ? "leader" : "member";

            localStorage.setItem("role", data.role);

            // Redirect
            if (data.role === "leader") {
                window.location.href = "/Leader_Group_Info.html";
            } else {
                window.location.href = "/Member_Group_Info.html";
            }
        }  
else {
    alert(data.error || "Invalid password");
} 
        } catch (err) {
            console.error(err);
            alert("Server error. Try again later.");
        }
    });

    // Open modal function exposed globally
    window.openGroupLoginModal = (groupId, groupName) => {
        modal.style.display = "flex";
        modalGroupName.textContent = `Login to ${groupName}`;
        passwordInput.value = ""; // clear previous password
        form.dataset.groupId = groupId;
        form.dataset.groupName = groupName;
    };}
    
});



