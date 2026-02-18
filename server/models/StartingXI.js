const mongoose = require("mongoose");

const startingXISchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  formation: {
    type: String,
    required: true
  },
  players: [
    {
      name: String,
      position: String
    }
  ]
}, { timestamps: true });

module.exports = mongoose.model("StartingXI", startingXISchema);
