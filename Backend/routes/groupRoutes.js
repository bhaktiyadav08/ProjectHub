const express = require("express");
const router = express.Router();
const {createGroup,listUsers,loginGroup,getGroups,updateGroup,deleteGroup,getGroupById}= require("../controllers/groupController");
const { protect,adminOnly } = require("../middleware/authMiddleware");
// Protected routes
router.post("/create",protect,adminOnly,createGroup);
router.get("/users", protect,listUsers);
router.put("/:id", protect, adminOnly, updateGroup); // update group
router.delete("/:id", protect, adminOnly, deleteGroup); // delete group
router.post("/login",loginGroup);
router.get("/", protect, getGroups);
// New route for fetching single group info
router.get("/:id",protect,getGroupById);

module.exports = router;

