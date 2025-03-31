const express = require("express");
const {
  isAuthenticated,
  isSuperAdmin,
  isAdmin,
  isProjectMemeber,
  isProjectExist,
} = require("../middlewares/authorizationMiddleware");
const { createChat } = require("../controllers/chatGroupController");

const router = express.Router();

// Chat Group operations
router.post("/create", isAuthenticated, isProjectExist, isProjectMemeber, createChat); // Create a project (only super admins)
router.get("/organization/:id", isAuthenticated, getProjects); // Get all projects in an organization (authenticated users)
router.get("/:id", isAuthenticated, getProjectById); // Get a single project by ID (authenticated users)
router.put("/update/:id", isAuthenticated, isSuperAdmin, updateProject); // Update a project (only super admins)
router.delete("/delete/:id", isAuthenticated, isSuperAdmin, deleteProject); // Delete a project (only super admins)

module.exports = router;
