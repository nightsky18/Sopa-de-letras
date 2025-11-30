// server/config/db.js
const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    await mongoose.connect('mongodb://localhost:27017/sopa_letras');
    console.log('Conectado a MongoDB');
  } catch (err) {
    console.error('Error de conexión a MongoDB:', err);
    process.exit(1);
  }
};

module.exports = connectDB;
