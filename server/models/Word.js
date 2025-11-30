// server/models/Word.js
const mongoose = require('mongoose');

const WordSchema = new mongoose.Schema({
  text: { type: String, required: true, unique: true },
  length: { type: Number, required: true }, 
  difficulty: { type: Number, default: 1 },
  category: { type: String, default: '' },
});

module.exports = mongoose.model('Word', WordSchema);
