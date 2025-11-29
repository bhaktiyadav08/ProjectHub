const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  username: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  branch: String,
  userClass: String,
  phone: String,
  password: { type: String, required: true },
  role: { type: String, enum: ["user", "admin"], default: "user"}
});

module.exports = mongoose.models.User || mongoose.model("User", userSchema);