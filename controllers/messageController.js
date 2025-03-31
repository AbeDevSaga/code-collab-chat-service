const Message = require("../models/message");
const Chat = require("../models/chat");

// Send a message
const sendMessage = async (req, res) => {
  try {
    const { chatId, content, attachments } = req.body;
    const senderId = req.user.id;

    // Check if user is part of the chat
    const chat = await Chat.findOne({
      _id: chatId,
      "participants.user": senderId,
      "participants.status": "active",
    });

    if (!chat) {
      return res
        .status(403)
        .json({ message: "Not authorized to send message in this chat" });
    }

    // Create the message
    const newMessage = new Message({
      chat: chatId,
      sender: senderId,
      content,
      attachments,
    });

    await newMessage.save();

    // Update chat's last message and timestamp
    chat.lastMessage = newMessage._id;
    chat.updatedAt = new Date();
    await chat.save();

    // Populate sender info before sending response
    const populatedMessage = await Message.populate(newMessage, {
      path: "sender",
      select: "name email avatar",
    });

    res.status(201).json(populatedMessage);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
// Get all messages in a chat
const getMessages = async (req, res) => {
  try {
    const chatId = req.params.chatId;
    const userId = req.user.id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;

    // Check if user is part of the chat
    const chat = await Chat.findOne({
      _id: chatId,
      "participants.user": userId,
      "participants.status": "active",
    });

    if (!chat) {
      return res
        .status(403)
        .json({ message: "Not authorized to view messages in this chat" });
    }

    // Get messages with pagination
    const messages = await Message.find({ chat: chatId })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate("sender", "name email avatar")
      .populate("readBy", "name email");

    res.status(200).json(messages.reverse()); // Return in chronological order
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
// Update a message
const updateMessage = async (req, res) => {
  try {
    const messageId = req.params.id;
    const { content } = req.body;
    const userId = req.user.id;

    const message = await Message.findOne({
      _id: messageId,
      sender: userId,
    });

    if (!message) {
      return res
        .status(404)
        .json({ message: "Message not found or not authorized" });
    }

    message.content = content || message.content;
    message.updatedAt = new Date();
    message.isEdited = true;

    await message.save();

    res.status(200).json(message);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
// Delete a message
const deleteMessage = async (req, res) => {
  try {
    const messageId = req.params.id;
    const userId = req.user.id;

    const message = await Message.findOne({
      _id: messageId,
      sender: userId,
    });

    if (!message) {
      return res
        .status(404)
        .json({ message: "Message not found or not authorized" });
    }

    // Soft delete (mark as deleted)
    message.deleted = true;
    message.deletedAt = new Date();
    message.deletedBy = userId;

    await message.save();

    res.status(200).json({ message: "Message deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
// Mark message as read
const markAsRead = async (req, res) => {
  try {
    const messageId = req.params.id;
    const userId = req.user.id;

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
      return res
        .status(403)
        .json({ message: "Not authorized to mark this message as read" });
    }

    // Add user to readBy if not already there
    if (!message.readBy.includes(userId)) {
      message.readBy.push(userId);
      await message.save();
    }

    res.status(200).json({ message: "Message marked as read" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
// Search messages in a chat
const searchMessages = async (req, res) => {
  try {
    const chatId = req.params.chatId;
    const userId = req.user.id;
    const { query } = req.query;

    // Check if user is part of the chat
    const chat = await Chat.findOne({
      _id: chatId,
      "participants.user": userId,
      "participants.status": "active",
    });

    if (!chat) {
      return res
        .status(403)
        .json({ message: "Not authorized to search messages in this chat" });
    }

    // Search messages containing the query
    const messages = await Message.find({
      chat: chatId,
      content: { $regex: query, $options: "i" },
      deleted: false,
    })
      .populate("sender", "name email avatar")
      .sort({ createdAt: -1 })
      .limit(50);

    res.status(200).json(messages);
  } catch (error) {
    res.status(500).json({ message: error.message });
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
