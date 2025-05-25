const express = require("express");
const {
  isAuthenticated,
  isSuperAdmin,
  isAdmin,
} = require("../middlewares/authorizationMiddleware");
const {
  sendMessage,
  getMessages,
  updateMessage,
  deleteMessage,
  markAsRead,
  searchMessages,
} = require("../controllers/messageController");

const router = express.Router();

// Message operations
router.post("/", isAuthenticated, sendMessage); // Send a message (must be chat participant)
router.get("/chat/:chatId", isAuthenticated, getMessages); // Get messages in a chat (must be chat participant)
router.put("/:id", isAuthenticated, updateMessage); // Update a message (only sender can update)
router.delete("/:id", isAuthenticated, deleteMessage); // Delete a message (only sender can delete)
router.post("/:id/read", isAuthenticated, markAsRead); // Mark message as read (must be chat participant)
router.get("/chat/:chatId/search", isAuthenticated, searchMessages); // Search messages in a chat (must be chat participant)

module.exports = router;
