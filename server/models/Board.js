// server/models/Board.js
const mongoose = require('mongoose');

const BoardSchema = new mongoose.Schema({
  rows: { type: Number, required: true },
  columns: { type: Number, required: true },
  matrix: { type: [[String]], required: true },
  wordsPlaced: { type: [String], default: [] },
});

module.exports = mongoose.model('Board', BoardSchema);
