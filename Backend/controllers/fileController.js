const File = require("../models/File");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
// Multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/"); // folder for files
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + "-" + file.originalname);
  }
});

// Multer instance
const upload = multer({ storage });

// Controller functions
const uploadFile = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });

    const { groupId } = req.body;
    const ext = path.extname(req.file.originalname);
    const file = new File({
      name: req.file.originalname,
      path: req.file.path,
      group: groupId,
      uploadedBy: req.user.id,    // user uploading the file
      createdBy: req.user.id,     // same as uploadedBy
      type: ext.replace(".", ""), // remove dot if you want just "txt", "java", etc.            // e.g., "txt", "java", "jpg"
    });

    await file.save();
    res.status(201).json({ message: "File uploaded successfully", file });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

const getFilesByGroup = async (req, res) => {
  try {
    const { groupId } = req.params;
    const files = await File.find({ group: groupId }).populate("uploadedBy", "username");
    res.json({ files });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch files" });
  }
};
const downloadFile = async (req, res) => {
  try {
    const fileId = req.params.fileId;
    const file = await File.findById(fileId);
    if (!file) return res.status(404).json({ error: "File not found" });

    if (!fs.existsSync(file.path)) {
      return res.status(404).json({ error: "File not found on server" });
    }

    res.download(path.resolve(file.path), file.name);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error while downloading file" });
  }
};
const openFile = async (req, res) => {
  try {
    const fileId = req.params.fileId;
    const file = await File.findById(fileId);

    if (!file) return res.status(404).json({ error: "File not found" });

    // Read file from disk
    const content = fs.readFileSync(file.path, "utf-8");

    res.json({ name: file.name, content });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error while reading file" });
  }
};
const renameFile = async (req, res) => {
  try {
    const { fileId } = req.params;
    const { newName } = req.body;

    if (!newName) return res.status(400).json({ error: "New name is required" });

    const file = await File.findById(fileId);
    if (!file) return res.status(404).json({ error: "File not found" });

    // Rename file in database
    file.name = newName;
    await file.save();

    res.json({ message: "File renamed successfully", file });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error while renaming file" });
  }
};


// DELETE /api/files/delete/:id
const deleteFile = async (req, res) => {
  try {
    const fileId = req.params.id;
    const file = await File.findById(fileId);

    if (!file) {
      return res.status(404).json({ error: "File not found" });
    }

    // Delete from disk if it exists
    const filePath = path.join(__dirname, "../uploads", file.name); // adjust folder if needed
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    // Delete from DB
    await File.findByIdAndDelete(fileId);

    res.json({ message: "File deleted successfully" });
  } catch (err) {
    console.error("Error deleting file:", err);
    res.status(500).json({ error: "Server error while deleting file" });
  }
};


// ✅ Correct single export object
module.exports = { upload, uploadFile, getFilesByGroup,downloadFile,openFile,renameFile,deleteFile };
