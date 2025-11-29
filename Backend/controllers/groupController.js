const Group = require("../models/Group.js");
const User = require("../models/User.js"); // for adding members
const bcrypt = require("bcryptjs");

// Create group
exports.createGroup = async (req, res) => {
  try {
    const { name, leader, members, password,category} = req.body;

    // hash the group password
    const hashedPwd = await bcrypt.hash(password, 10);
    
    const group = new Group({
      name,
      leader,
      members,
      password: hashedPwd,
      category,
      createdBy: req.user.id // from JWT
    });

    await group.save();
    // Populate for frontend
const populatedGroup = await Group.findById(group._id)
  .populate("leader", "username")
  .populate("members", "username");

    res.status(201).json({ message: "Group created successfully", group: populatedGroup  });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// List all registered users (for admin to add as members)
exports.listUsers = async (req, res) => {
  try {
    const users = await User.find({}, "username email"); // return only safe fields
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Login into group (for members)
exports.loginGroup = async (req, res) => {
  try {
    const { name, password} = req.body;
    // logged-in user ID from JWT
    const group = await Group.findOne({ name });
    if (!group) return res.status(404).json({ error: "Group not found" });

    const isMatch = await bcrypt.compare(password.trim(), group.password);
    if (!isMatch) return res.status(401).json({ error: "Invalid credentials" });
    // populate leader & members for frontend
    await group.populate([
      { path: "leader", select: "username" },
      { path: "members", select: "username" }
    ]);
    const userId = (req.user && req.user.id) || req.body.userId;

if (!userId) {
    return res.status(400).json({ error: "User ID is required for role detection" });
}
    const role = group.leader._id.toString() === userId ? "leader" : "member";

    res.json({ message: "Group login success", group,role });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
// For both admin & users
exports.getGroups = async (req, res) => {
  try {
    const groups = await Group.find({}, "name category leader members")
    .populate("leader", "username")
      .populate("members", "username"); // populate usernames

    // 👆 limiting fields: don’t send password to frontend
    res.json(groups);
  } catch (err) {
    console.error("Error fetching groups:", err);
    res.status(500).json({ error: "Failed to fetch groups" });
  }
};

// DELETE group
exports.deleteGroup = async (req, res) => {
  try {
    const group = await Group.findById(req.params.id);
    if (!group) return res.status(404).json({ message: "Group not found" });

    await Group.findByIdAndDelete(req.params.id); // simpler, no middleware issues
    res.json({ message: "Group deleted successfully" });
  } catch (err) {
    console.error("Delete group error:", err);
    res.status(500).json({ message: "Server error" });
  }
};


// UPDATE group
exports.updateGroup = async (req, res) => {
  try {
    const { name, leader, members, password, category } = req.body;

    const group = await Group.findById(req.params.id);
    if (!group) return res.status(404).json({ message: "Group not found" });

    // Update fields
    group.name = name || group.name;
    group.leader = leader || group.leader;
    group.members = members || group.members;
    group.password = password || group.password;
    group.category = category || group.category;
        // Update password only if a new one is provided
    if (password && password.trim() !== "") {
      const hashedPassword = await bcrypt.hash(password, 10);
      group.password = hashedPassword;
    }
    await group.save();
    
    // populate for response
    const updatedGroup = await Group.findById(group._id)
      .populate("leader", "username")
      .populate("members", "username");
    res.json({ message: "Group updated successfully", group:updatedGroup});
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};
// Get single group by ID (for workspace page)
exports.getGroupById = async (req, res) => {
  try {
    const group = await Group.findById(req.params.id)
      .populate("leader", "username")   // populate leader username
      .populate("members", "username"); // populate members usernames

    if (!group) return res.status(404).json({ error: "Group not found" });

    res.json({ group });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};