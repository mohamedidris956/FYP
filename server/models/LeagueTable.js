const mongoose = require('mongoose');

const LeagueTableSchema = new mongoose.Schema({
  team: { type: String, required: true },
  mp: Number, // matches played
  w: Number,
  d: Number,
  l: Number,
  gf: Number, // goals for
  ga: Number, // goals against
  gd: Number, // goal difference
  pts: Number // points
}, { timestamps: true });

module.exports = mongoose.model('LeagueTable', LeagueTableSchema);
