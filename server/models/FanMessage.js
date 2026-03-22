const mongoose = require("mongoose");

const fanMessageSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    text: {
      type: String,
      required: true,
      trim: true,
      maxlength: 300
    },
    pinned: {
      type: Boolean,
      default: false
    },
    pinnedAt: {
      type: Date,
      default: null
    },
    pinnedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null
    },
    // store user IDs per emoji to support toggle
    reactions: {
      "👍": { type: [String], default: [] },
      "❤️": { type: [String], default: [] },
      "😂": { type: [String], default: [] }
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("FanMessage", fanMessageSchema);