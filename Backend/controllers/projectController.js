// Backend/controllers/projectController.js
const Project = require("../models/Project");

const createProject = async (req, res, next) => {
  try {
    const { title, description } = req.body;
    if (!title) {
      res.status(400);
      throw new Error("Title is required");
    }
    const project = await Project.create({
      title,
      description,
      createdBy: req.user._id,
      members: [req.user._id]
    });
    res.status(201).json(project);
  } catch (e) {
    next(e);
  }
};

const getMyProjects = async (req, res, next) => {
  try {
    const projects = await Project.find({
      $or: [{ createdBy: req.user._id }, { members: req.user._id }]
    }).populate("createdBy", "name email");
    res.json(projects);
  } catch (e) {
    next(e);
  }
};

module.exports = { createProject, getMyProjects };
