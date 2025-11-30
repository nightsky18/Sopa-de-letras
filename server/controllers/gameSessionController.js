// server/controllers/gameSessionController.js
const Board = require('../models/Board');
const GameSession = require('../models/GameSession');
const { generateBoard } = require('../utils/boardGenerator');
const Word = require('../models/Word');

async function createGameSession(req, res) {
  try {
    const { userId, rows = 10, columns = 10, wordCount = 5 } = req.body;

    // Obtener palabras aleatorias de la BD
    const wordsFromDB = await Word.aggregate([{ $sample: { size: wordCount } }]);
    const words = wordsFromDB.map(w => w.text);

    // Generar tablero con palabras
    const { matrix, wordsPlaced } = generateBoard(words, rows, columns);

    // Crear documento Board
    const board = new Board({
      rows,
      columns,
      matrix,
      wordsPlaced,
    });
    await board.save();

    // Crear partida con referencia al tablero
    const gameSession = new GameSession({
      user: userId,
      board: board._id,
      foundWords: [],
      timeSpent: 0,
      status: 'playing',
    });
    await gameSession.save();

    // Enviar partida con tablero poblado
    const populatedSession = await gameSession.populate('board').execPopulate();

    res.status(201).json(populatedSession);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al crear partida' });
  }
}

module.exports = { createGameSession };
