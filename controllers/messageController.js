const Message = require("../models/message");
const Chat = require("../models/chatGroup");
const mongoose = require("mongoose");

// Send a message
const sendMessage = async (req, res) => {
  try {
    const { chat, content, attachments } = req.body.message;
    console.log("chatId, content, attachments: ", chat, content, attachments)
    const senderId = req.user.id;

    // Validate chatId
    if (!mongoose.Types.ObjectId.isValid(chat)) {
      return res.status(400).json({ message: "Invalid chat ID" });
    }

    // Check if user is part of the chat
    const chat_group = await Chat.findOne({
      _id: chat,
      "participants.user": senderId,
      "participants.status": "active",
    });

    if (!chat_group) {
      return res.status(403).json({ 
        message: "Not authorized to send message in this chat" 
      });
    }

    // Create the message
    const newMessage = new Message({
      chat: chat,
      sender: senderId,
      content,
      attachments,
    });

    await newMessage.save();

    // Update chat's last message and timestamp
    chat_group.lastMessage = newMessage._id;
    chat_group.updatedAt = new Date();
    await chat_group.save();

    // Populate sender info before sending response
    const populatedMessage = await Message.populate(newMessage, {
      path: "sender",
      select: "username email profileImage",
      model: "User"
    });

    res.status(201).json(populatedMessage);
  } catch (error) {
    console.error("Error sending message:", error);
    res.status(500).json({ 
      message: "Failed to send message",
      error: error.message 
    });
  }
};

// Get all messages in a chat
const getMessages = async (req, res) => {
  try {
    const chatId = req.params.chatId;
    const userId = req.user.id;

    // Validate chatId
    if (!mongoose.Types.ObjectId.isValid(chatId)) {
      return res.status(400).json({ message: "Invalid chat ID" });
    }

    // Check if user is part of the chat
    const chat = await Chat.findOne({
      _id: chatId,
      "participants.user": userId,
      "participants.status": "active",
    });

    if (!chat) {
      return res.status(403).json({ 
        message: "Not authorized to view messages in this chat" 
      });
    }

    // Get messages with proper population
    const messages = await Message.find({ chat: chatId })
      .populate({
        path: "sender",
        select: "username email profileImage",
        model: "User"
      })
      .populate({
        path: "readBy",
        select: "username email",
        model: "User"
      })
      .sort({ createdAt: -1 });

    res.status(200).json(messages.reverse());
  } catch (error) {
    console.error("Error fetching messages:", error);
    res.status(500).json({ 
      message: "Failed to fetch messages",
      error: error.message 
    });
  }
};

// Update a message
const updateMessage = async (req, res) => {
  try {
    const messageId = req.params.id;
    const { content } = req.body;
    const userId = req.user.id;

    // Validate messageId
    if (!mongoose.Types.ObjectId.isValid(messageId)) {
      return res.status(400).json({ message: "Invalid message ID" });
    }

    const message = await Message.findOne({
      _id: messageId,
      sender: userId,
    });

    if (!message) {
      return res.status(404).json({ 
        message: "Message not found or not authorized" 
      });
    }

    message.content = content || message.content;
    message.updatedAt = new Date();
    message.isEdited = true;

    const updatedMessage = await message.save();

    // Populate sender info before sending response
    const populatedMessage = await Message.populate(updatedMessage, {
      path: "sender",
      select: "username email profileImage",
      model: "User"
    });

    res.status(200).json(populatedMessage);
  } catch (error) {
    console.error("Error updating message:", error);
    res.status(500).json({ 
      message: "Failed to update message",
      error: error.message 
    });
  }
};

// Delete a message
const deleteMessage = async (req, res) => {
  try {
    const messageId = req.params.id;
    const userId = req.user.id;

    // Validate messageId
    if (!mongoose.Types.ObjectId.isValid(messageId)) {
      return res.status(400).json({ message: "Invalid message ID" });
    }

    const message = await Message.findOne({
      _id: messageId,
      sender: userId,
    });

    if (!message) {
      return res.status(404).json({ 
        message: "Message not found or not authorized" 
      });
    }

    // Soft delete (mark as deleted)
    message.deleted = true;
    message.deletedAt = new Date();
    message.deletedBy = userId;

    await message.save();

    res.status(200).json({ 
      message: "Message deleted successfully",
      deletedMessageId: messageId 
    });
  } catch (error) {
    console.error("Error deleting message:", error);
    res.status(500).json({ 
      message: "Failed to delete message",
      error: error.message 
    });
  }
};

// Mark message as read
const markAsRead = async (req, res) => {
  try {
    const messageId = req.params.id;
    const userId = req.user.id;

    // Validate messageId
    if (!mongoose.Types.ObjectId.isValid(messageId)) {
      return res.status(400).json({ message: "Invalid message ID" });
    }

    const message = await Message.findById(messageId);

    if (!message) {
      return res.status(404).json({ message: "Message not found" });
    }

    // Check if user is part of the chat
    const chat = await Chat.findOne({
      _id: message.chat,
      "participants.user": userId,
      "participants.status": "active",
    });

    if (!chat) {
      return res.status(403).json({ 
        message: "Not authorized to mark this message as read" 
      });
    }

    // Add user to readBy if not already there
    if (!message.readBy.includes(userId)) {
      message.readBy.push(userId);
      await message.save();
    }

    // Populate the updated message
    const populatedMessage = await Message.populate(message, {
      path: "sender readBy",
      select: "username email profileImage",
      model: "User"
    });

    res.status(200).json({ 
      message: "Message marked as read",
      updatedMessage: populatedMessage 
    });
  } catch (error) {
    console.error("Error marking message as read:", error);
    res.status(500).json({ 
      message: "Failed to mark message as read",
      error: error.message 
    });
  }
};

// Search messages in a chat
const searchMessages = async (req, res) => {
  try {
    const chatId = req.params.chatId;
    const userId = req.user.id;
    const { query } = req.query;

    if (!query || typeof query !== 'string') {
      return res.status(400).json({ message: "Invalid search query" });
    }

    // Validate chatId
    if (!mongoose.Types.ObjectId.isValid(chatId)) {
      return res.status(400).json({ message: "Invalid chat ID" });
    }

    // Check if user is part of the chat
    const chat = await Chat.findOne({
      _id: chatId,
      "participants.user": userId,
      "participants.status": "active",
    });

    if (!chat) {
      return res.status(403).json({ 
        message: "Not authorized to search messages in this chat" 
      });
    }

    // Search messages containing the query
    const messages = await Message.find({
      chat: chatId,
      content: { $regex: query, $options: "i" },
      deleted: false,
    })
      .populate({
        path: "sender",
        select: "username email profileImage",
        model: "User"
      })
      .sort({ createdAt: -1 })
      .limit(50);

    res.status(200).json(messages);
  } catch (error) {
    console.error("Error searching messages:", error);
    res.status(500).json({ 
      message: "Failed to search messages",
      error: error.message 
    });
  }
};

module.exports = {
  sendMessage,
  getMessages,
  updateMessage,
  deleteMessage,
  markAsRead,
  searchMessages,
};