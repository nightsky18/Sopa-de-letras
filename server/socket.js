// server/socket.js
const { generateBoard } = require('./utils/boardGenerator');
const { runWordValidation } = require('./utils/workerHandler');
const Board = require('./models/Board');
const GameSession = require('./models/GameSession');
const { findWordInMatrix } = require('./utils/matrixSearch');

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

     // 3. RESOLVER PARTIDA (Rendición)
    socket.on('requestResolve', async (data) => {
      const { gameSessionId } = data;
      
      try {
        const session = await GameSession.findById(gameSessionId).populate('board');
        
        if (!session || session.status !== 'playing') {
          return; // Ignorar si ya acabó
        }

        // Marcar como resuelta/abandonada
        session.status = 'abandoned'; // O 'resolved' según prefieras
        session.endTime = new Date();
        
        // Calcular tiempo (aunque sea abandono, registramos cuánto duró)
        const durationSeconds = Math.floor((session.endTime - session.startTime) / 1000);
        session.duration = durationSeconds;
        
        await session.save();

        // Calcular TODAS las coordenadas de TODAS las palabras
        const allSolutions = [];
        // Convertir a objeto plano para evitar problemas de acceso
        const matrix = JSON.parse(JSON.stringify(session.board.matrix));
        const words = session.board.wordsPlaced;

        words.forEach(word => {
          const coords = findWordInMatrix(matrix, word);
          if (coords.length > 0) {
            allSolutions.push({ word, cells: coords });
          }
        });

        // Emitir resultado
        socket.emit('resolveResult', {
          solutions: allSolutions,
          duration: durationSeconds
        });
        
        console.log(`Partida ${session._id} resuelta por abandono.`);

      } catch (err) {
        console.error('Error resolviendo partida:', err);
      }
    });

    // 4. REANUDAR PARTIDA
    socket.on('resumeGame', async (data) => {
      const { gameSessionId } = data;

      try {
        const session = await GameSession.findById(gameSessionId).populate('board');

        // Validar si la sesión es válida para reanudar
        if (!session || session.status !== 'playing') {
          // Si no existe o ya terminó, avisamos para que el cliente borre su storage y pida una nueva
          socket.emit('errorResuming', { message: 'Partida no válida o finalizada' });
          return;
        }

        // RECUPERACIÓN DE COORDENADAS (Esfuerzo Extra)
        // Buscamos en la matriz las coordenadas de cada palabra que está en session.foundWords
        const recoveredCells = [];
        const matrixObj = JSON.parse(JSON.stringify(session.board.matrix)); // Matriz plana

        session.foundWords.forEach(word => {
          const coords = findWordInMatrix(matrixObj, word);
          if (coords.length > 0) {
             // Agregamos todas las celdas de esta palabra al array plano
             recoveredCells.push(...coords);
          }
        });

        // Calcular tiempo transcurrido hasta ahora para sincronizar cronómetro (opcional pero bueno)
        // El frontend puede usar su propio timer, pero enviar el startTime ayuda.
        
        // Reconstruir la respuesta como si fuera una partida nueva, pero con datos extra
        socket.emit('gameResumed', {
          matrix: session.board.matrix,
          wordsPlaced: session.board.wordsPlaced,
          foundWords: session.foundWords, // ¡Clave! Lista de palabras ya tachadas
          gameSessionId: session._id.toString(),
          startTime: session.startTime, // Para ajustar el reloj si quisiéramos
          foundCells: recoveredCells
        });
        
        console.log(`Partida ${session._id} reanudada.`);

      } catch (err) {
        console.error('Error reanudando partida:', err);
        socket.emit('errorResuming', { message: 'Error interno' });
      }
    });

    // 5. ABANDONAR EXPLICITAMENTE (Para botón "Nueva Partida")
    socket.on('abandonGame', async (data) => {
        const { gameSessionId } = data;
        try {
            await GameSession.findByIdAndUpdate(gameSessionId, { 
                status: 'abandoned', 
                endTime: new Date() 
            });
            // No necesitamos emitir nada especial, el cliente ya sabe que va a pedir una nueva
        } catch(err) {
            console.error(err);
        }
    });

    socket.on('disconnect', () => {
      console.log('Cliente desconectado:', socket.id);
    });
  });
}

module.exports = socketSetup;