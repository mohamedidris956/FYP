const mongoose = require("mongoose");

const moderationLogSchema = new mongoose.Schema(
  {
    action: {
      type: String,
      enum: ["mute", "unmute"],
      required: true
    },
    actor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    target: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    minutes: {
      type: Number,
      default: null
    },
    reason: {
      type: String,
      default: ""
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("ModerationLog", moderationLogSchema);