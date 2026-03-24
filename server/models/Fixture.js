const mongoose = require('mongoose');

const fixtureSchema = new mongoose.Schema(
  {
    opponent: { type: String, required: true },
   date: { type: Date, required: false, default: null },
    venue: { type: String, required: true },
    kickOff: { type: String }, // e.g. "19:30"
    result: { type: String, default: '' } // e.g. "2-1 W"
  },
  { timestamps: true }
);

module.exports = mongoose.model('Fixture', fixtureSchema);
