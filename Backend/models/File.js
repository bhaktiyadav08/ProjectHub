const mongoose = require("mongoose");

const fileSchema = new mongoose.Schema({
  name: { type: String, required: true },
  path: { type: String, required: true },
  group: { type: mongoose.Schema.Types.ObjectId, ref: "Group" },
  uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  owner: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  type: { type: String, required: true }, // e.g., "java", "txt", "jpg"
});
module.exports = mongoose.model("File", fileSchema);
