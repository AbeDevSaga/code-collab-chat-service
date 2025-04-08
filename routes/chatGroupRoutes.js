const express = require("express");
const {
  isAuthenticated,
  isSuperAdmin,
  isAdmin,
  isProjectMemeber,
  isProjectExist,
} = require("../middlewares/authorizationMiddleware");
const { createChat, getUserChats, getAllChats, getOrganizationChats, getProjectChats, getChatById, deleteChat, updateChat } = require("../controllers/chatGroupController");

const router = express.Router();

// Chat Group operations
router.get("/", isAuthenticated, isAdmin, getAllChats); // Get all chats for Admin 
router.post("/create", isAuthenticated, isProjectExist, isProjectMemeber, createChat); // Create a chat group (only project members can create a chat group)
router.get("/organization/:id", isAuthenticated, getOrganizationChats); // Get all chats in an organization (authenticated users)
router.get("/project/:id", isAuthenticated, getProjectChats); // Get all chats in an project (authenticated users)
router.get("/chat/:id", isAuthenticated, getChatById); // Get a single project by ID (authenticated users)
router.put("/update/:id", isAuthenticated, isSuperAdmin, updateChat); // Update a project (only super admins)
router.delete("/delete/:id", isAuthenticated, isSuperAdmin, deleteChat); // Delete a project (only super admins)
router.get("/:id", isAuthenticated, getUserChats); // Get all chats for a user (authenticated users)


module.exports = router;
