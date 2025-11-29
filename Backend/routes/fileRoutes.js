const express = require("express");
const router = express.Router();
const { uploadFile, getFilesByGroup, upload,downloadFile ,openFile,renameFile,deleteFile} = require("../controllers/fileController");
const {protect} = require("../middleware/authMiddleware");

// Use multer middleware for file uploads
router.post("/upload", protect, upload.single("file"), uploadFile);
router.get("/group/:groupId", protect, getFilesByGroup);
router.get("/download/:fileId", protect, downloadFile);
router.get("/open/:fileId", protect, openFile);
router.put("/rename/:fileId", protect, renameFile);
router.delete("/delete/:id", protect, deleteFile);
module.exports = router;
