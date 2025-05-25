const Chat = require("../models/chatGroup");
const Message = require("../models/message");
const { generateToken } = require("../utils/helpers");

// Create a new chat group (project or private)
const createChat = async (req, res) => {
  try {
    const { name, avatar, description, isGroupChat, projectId, participants } = req.body;
    const createdBy = req.user.id;

    // Create the chat
    const newChat = new Chat({
      name,
      avatar,
      description,
      isGroupChat: isGroupChat !== false, // Default to true if not specified
      project: projectId || null,
      createdBy,
      participants: [{ user: createdBy, role: "admin" }],
    });

    // Add other participants if provided
    if (participants && participants.length > 0) {
      const uniqueUserIds = [...new Set(userIds)]; // Remove duplicates
      for (const userId of uniqueUserIds) {
        if (userId.toString() !== createdBy.toString()) {
          newChat.participants.push({
            user: userId,
            role: "member",
            status: "pending",
            invitedBy: createdBy,
          });
        }
      }
    }

    await newChat.save();

    res.status(201).json(newChat);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
//get all chats
const getAllChats = async (req, res) => {
  try {
    const chats = await Chat.find()
      .populate("project")
      .populate("participants.user");
    res.status(200).json(chats);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
const getOrganizationChats = async (req, res) => {
  try {
    const organizationId = req.params.id;
    const chats = await Chat.find({ organization: organizationId })
      .populate("project")
      .populate("participants.user");
    res.status(200).json(chats);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
// get all chats for a specific project
const getProjectChats = async (req, res) => {
  try {
    const projectId = req.params.id;
    const chats = await Chat.find({ project: projectId })
      .populate("participants")
      .populate("lastMessage")
      .sort({ updatedAt: -1 });
    res.status(200).json(chats);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
// Get all chats for a user
const getUserChats = async (req, res) => {
  try {
    const userId = req.user.id;

    const chats = await Chat.find({
      "participants.user": userId,
      "participants.status": "active",
    })
      .populate("participants")
      .populate("lastMessage")
      .sort({ updatedAt: -1 });

    res.status(200).json(chats);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
// Get chat details by ID
const getChatById = async (req, res) => {
  try {
    const chatId = req.params.id;
    const userId = req.user.id;

    const chat = await Chat.findOne({
      _id: chatId,
      "participants.user": userId,
      "participants.status": "active",
    })
      .populate({
        path: "participants.user",
        select: "username email profileImage role status", // Include the fields you want
        model: "User"
      })
      .populate("project", "name")
      .populate("lastMessage");

    if (!chat) {
      return res
        .status(404)
        .json({ message: "Chat not found or access denied" });
    }

    res.status(200).json(chat);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
// Update chat details
const updateChat = async (req, res) => {
  try {
    const chatId = req.params.id;
    const userId = req.user.id;
    const { name, description } = req.body;

    const chat = await Chat.findOne({
      _id: chatId,
      "participants.user": userId,
      "participants.role": "admin",
      "participants.status": "active",
    });

    if (!chat) {
      return res
        .status(404)
        .json({ message: "Chat not found or not authorized" });
    }

    chat.name = name || chat.name;
    chat.description = description || chat.description;
    chat.updatedAt = new Date();

    await chat.save();

    res.status(200).json(chat);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
// Delete a chat
const deleteChat = async (req, res) => {
  try {
    const chatId = req.params.id;
    const userId = req.user.id;

    const chat = await Chat.findOne({
      _id: chatId,
      "participants.user": userId,
      "participants.role": "admin",
      "participants.status": "active",
    });

    if (!chat) {
      return res
        .status(404)
        .json({ message: "Chat not found or not authorized" });
    }

    // Delete all messages in this chat first
    await Message.deleteMany({ chat: chatId });

    await chat.remove();

    res.status(200).json({ message: "Chat deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
// Generate invitation link for a chat
const generateInvitationLink = async (req, res) => {
  try {
    const chatId = req.params.id;
    const userId = req.user.id;

    const chat = await Chat.findOne({
      _id: chatId,
      "participants.user": userId,
      "participants.status": "active",
    });

    if (!chat) {
      return res
        .status(404)
        .json({ message: "Chat not found or access denied" });
    }

    const token = generateToken();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // Link expires in 7 days

    chat.invitationLink = token;
    chat.invitationLinkExpires = expiresAt;
    chat.invitationLinkCreator = userId;
    chat.isInvitationLinkChat = true;

    await chat.save();

    res.status(200).json({
      invitationLink: `${process.env.FRONTEND_URL}/join-chat?token=${token}`,
      expiresAt,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
// Join chat via invitation link
const joinChatViaLink = async (req, res) => {
  try {
    const { token } = req.body;
    const userId = req.user.id;

    const chat = await Chat.findOne({
      invitationLink: token,
      invitationLinkExpires: { $gt: new Date() },
    });

    if (!chat) {
      return res
        .status(404)
        .json({ message: "Invalid or expired invitation link" });
    }

    // Check if user is already a participant
    const isParticipant = chat.participants.some(
      (p) => p.user.toString() === userId.toString()
    );

    if (isParticipant) {
      return res.status(400).json({ message: "You are already in this chat" });
    }

    // Add user as participant
    chat.participants.push({
      user: userId,
      role: "member",
      status: "active",
      joinedAt: new Date(),
    });

    await chat.save();

    res.status(200).json(chat);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
// Remove participant from chat
const removeParticipant = async (req, res) => {
  try {
    const chatId = req.params.id;
    const userId = req.user.id;
    const { participantId } = req.body;

    const chat = await Chat.findOne({
      _id: chatId,
      "participants.user": userId,
      "participants.role": { $in: ["admin", "manager"] },
      "participants.status": "active",
    });

    if (!chat) {
      return res
        .status(404)
        .json({ message: "Chat not found or not authorized" });
    }

    // Remove participant
    chat.participants = chat.participants.filter(
      (p) => p.user.toString() !== participantId.toString()
    );

    await chat.save();

    res.status(200).json(chat);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createChat,
  getAllChats,
  getOrganizationChats,
  getProjectChats,
  getUserChats,
  getChatById,
  updateChat,
  deleteChat,
  generateInvitationLink,
  joinChatViaLink,
  removeParticipant,
};
