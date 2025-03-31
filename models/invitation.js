const mongoose = require("mongoose");

const InvitationSchema = new mongoose.Schema(
  {
    chat: { type: mongoose.Schema.Types.ObjectId, ref: "Chat", required: true },
    inviter: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    invitee: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, // Can be null for link-based
    email: { type: String }, // For email invitations
    token: { type: String, required: true, unique: true },
    expiresAt: { type: Date },
    status: {
      type: String,
      enum: ["pending", "accepted", "rejected", "expired"],
      default: "pending",
    },
    isLinkBased: { type: Boolean, default: false }, // Whether it's a multi-use link
  },
  { timestamps: true }
);

module.exports = mongoose.model("Invitation", InvitationSchema);