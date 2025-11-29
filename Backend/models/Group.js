const mongoose = require("mongoose");

const groupSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true
  },
  leader: {                      // 👈 new field (reference to User)
    type: mongoose.Schema.Types.ObjectId, 
    ref: "User",
    required: true
  },
   members: [
    {
      type: mongoose.Schema.Types.ObjectId, 
      ref: "User"  ,
      required: true // assuming you already have a User model
    }
  ],
  password: {
    type: String,
    required: true
  },
  category: {
    type: String,
    required: true,
  },
 
  createdBy: {
    type: mongoose.Schema.Types.ObjectId, 
    ref: "User",
    required: true
  }
}, { timestamps: true });

module.exports = mongoose.models.Group || mongoose.model("Group", groupSchema);
