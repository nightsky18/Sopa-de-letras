// server/socket.js
const { generateBoard } = require('./utils/boardGenerator');
const { runWordValidation } = require('./utils/workerHandler');
const Board = require('./models/Board');
const GameSession = require('./models/GameSession');

function socketSetup(io) {
  io.on('connection', (socket) => {
    console.log('Cliente conectado:', socket.id);

    // 1. INICIAR PARTIDA (Crear Board y GameSession en BD)
    socket.on('requestBoard', async () => {
      try {
        // A. Generar lógica del tablero (15x15, 15 palabras)
        const { matrix, wordsPlaced } = await generateBoard(15, 15, 15);
        
        // B. Guardar Tablero físico en BD
        const newBoard = new Board({
          rows: 15,
          columns: 15,
          matrix,
          wordsPlaced
        });
        await newBoard.save();

        // C. Crear Sesión de Juego en BD
        // Se guarda startTime automáticamente con el default: Date.now
        const newSession = new GameSession({
          board: newBoard._id,
          status: 'playing'
        });
        await newSession.save();

        // D. Enviar al cliente matriz + ID de sesión
        socket.emit('boardGenerated', { 
          matrix, 
          wordsPlaced, 
          gameSessionId: newSession._id.toString()
        });

        console.log(`Partida creada: ${newSession._id}`);

      } catch (err) {
        console.error('Error creando partida:', err);
      }
    });

    // 2. VALIDAR PALABRA (Consultar y actualizar BD)
    socket.on('validateWord', async (data) => {
      const { word, selectedCells, gameSessionId } = data;

      if (!gameSessionId) {
        socket.emit('validationResult', { isValid: false, reason: 'Falta ID de sesión' });
        return;
      }

      try {
        // A. Buscar sesión y tablero poblado
        const session = await GameSession.findById(gameSessionId).populate('board');
        
        if (!session || session.status !== 'playing') {
          socket.emit('validationResult', { isValid: false, reason: 'Partida no activa o no encontrada' });
          return;
        }

        // B. Validar si ya la encontró antes
        if (session.foundWords.includes(word.toUpperCase())) {
          socket.emit('validationResult', { isValid: false, reason: 'Palabra ya encontrada' });
          return;
        }

        // C. PREPARAR DATOS PARA EL WORKER
        // Convertir objetos Mongoose a objetos planos JS para evitar DataCloneError
        const plainWordsList = JSON.parse(JSON.stringify(session.board.wordsPlaced));
        const plainMatrix = JSON.parse(JSON.stringify(session.board.matrix));

        // D. Usar Worker para validar geometría y existencia
        const validation = await runWordValidation(
          word, 
          selectedCells, 
          plainWordsList, 
          plainMatrix
        );

        if (validation.isValid) {
          // E. Actualizar BD
          session.foundWords.push(validation.word);
          
          // Verificar victoria
          if (session.foundWords.length >= session.board.wordsPlaced.length) {
            session.status = 'finished';
            session.endTime = new Date();

            // --- CÁLCULO DE DURACIÓN (NUEVO) ---
            // Calcular diferencia en segundos
            const durationMs = session.endTime - session.startTime;
            const durationSeconds = Math.floor(durationMs / 1000);
            
            // Guardar duración en el modelo
            session.duration = durationSeconds;
            
            console.log(`Partida ${session._id} finalizada con éxito en ${durationSeconds}s.`);
            
            // Guardamos antes de emitir
            await session.save();

            // Emitir evento de finalización con el tiempo oficial
            socket.emit('gameFinished', { 
              score: session.foundWords.length,
              duration: durationSeconds 
            });
          } else {
            // Si no ha terminado, solo guardamos el progreso
            await session.save();
          }

          // Responder éxito en la validación
          socket.emit('validationResult', validation);
          
        } else {
          // Responder fallo
          socket.emit('validationResult', validation);
        }

      } catch (err) {
        console.error('Error en validación:', err);
        socket.emit('validationResult', { isValid: false, error: 'Error interno del servidor' });
      }
    });

    socket.on('disconnect', () => {
      console.log('Cliente desconectado:', socket.id);
    });
  });
}

module.exports = socketSetup;