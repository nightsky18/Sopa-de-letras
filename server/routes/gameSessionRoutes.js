const express = require('express');
const router = express.Router();
const { createGameSession } = require('../controllers/gameSessionController');

router.post('/game-sessions', createGameSession);

module.exports = router;
