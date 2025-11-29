const mongoose = require("mongoose");

const taskSchema = new mongoose.Schema({
  group: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Group",
    required: true
  },
  title: { type: String, required: true },
  description: String,
  dueDate: Date,
  assignedMembers: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    }
  ],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User", // leader who created it
    required: true
  },
   weight: {
    type: Number,
    default: 1,
    min: 1,
    max: 10,
    required: true
  },
   priority: {
    type: String,
    enum: ["Low", "Medium", "High", "Critical"],
    default: "Medium"
  },
  status: {
    type: String,
    enum: ["Not Started", "In Progress", "Completed"],
    default: "Not Started"
  }
}, { timestamps: true });

module.exports = mongoose.model("Task", taskSchema);
