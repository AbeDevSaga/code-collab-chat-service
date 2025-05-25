const express = require("express");
const User = require("../models/user");
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
// router.get("/", isAuthenticated, isAdmin, getAllChats); 
router.get("/", isAuthenticated, async (req, res, next) => {
  try {
    const { role, id } = req.user;
    if (role === "Admin") {
      await isAdmin(req, res, () => {});
      return getAllChats(req, res, next);
    } else if (role === "Super Admin") {
      await isSuperAdmin(req, res, () => {});
      req.params.id = id;
      const user = await User.findById(id);
      console.log("user: ", user);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      req.params.id = user.organization;
      return getOrganizationChats(req, res, next);
    } else if (role === "Project Manager" || role === "Team Member" || role === "Developer") {
      req.params.id = id;
      return getUserChats(req, res, next);
    } else {
      return res.status(403).json({ message: "Unauthorized access" });
    }
  } catch (error) {
    next(error);
  }
});
// router.post("/create", isAuthenticated, isProjectExist, isProjectMemeber, createChat); // Create a chat group (only project members can create a chat group)
router.post("/create", isAuthenticated, isAdmin, createChat); 
router.get("/organization/:id", isAuthenticated, getOrganizationChats); // Get all chats in an organization (authenticated users)
router.get("/project/:id", isAuthenticated, getProjectChats); // Get all chats in an project (authenticated users)
router.get("/chat/:id", isAuthenticated, getChatById); // Get a single project by ID (authenticated users)
router.put("/update/:id", isAuthenticated, isSuperAdmin, updateChat); // Update a project (only super admins)
router.delete("/delete/:id", isAuthenticated, isSuperAdmin, deleteChat); // Delete a project (only super admins)
router.get("/:id", isAuthenticated, getUserChats); // Get all chats for a user (authenticated users)


module.exports = router;
