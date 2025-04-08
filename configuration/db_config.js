const mongoose = require("mongoose");
const dotenv = require('dotenv');
dotenv.config();

// Import models
const ChatGroup = require("../models/chatGroup");
const Invitation = require("../models/invitation"); 
const Message = require("../models/message");
const User = require("../models/user"); 
const Project = require("../models/project"); 
const Organization = require("../models/organization");

const connectDB = async () => {
  try {
    // Register models before connecting
    mongoose.model("ChatGroup", ChatGroup.schema);
    mongoose.model("Invitation", Invitation.schema);
    mongoose.model("Message", Message.schema);
    mongoose.model("Project", Project.schema);
    mongoose.model("Organization", Organization.schema);
    mongoose.model("User", User.schema);

    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB')

  } catch (err) {
    console.error("Failed to connect to MongoDB", err);
    process.exit(1);
  }
};

module.exports = connectDB;
