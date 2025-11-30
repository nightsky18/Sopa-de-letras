// test-backend.js
const { io } = require("socket.io-client");

// 1. Conectar al servidor local
const socket = io("http://localhost:4000");

console.log("--- Iniciando Prueba de Backend ---");

socket.on("connect", () => {
  console.log("✅ Conectado al servidor con ID:", socket.id);
  
  // 2. Pedir tablero
  console.log("📡 Enviando solicitud de tablero (requestBoard)...");
  socket.emit("requestBoard");
});

socket.on("boardGenerated", (data) => {
  console.log("✅ Tablero recibido.");
  // data = { matrix: [...], wordsPlaced: ["SOL", "MAR", ...] }
  
  const words = data.wordsPlaced;
  const matrix = data.matrix;

  if (words.length === 0) {
    console.error("❌ Error: No llegaron palabras en el tablero.");
    socket.disconnect();
    return;
  }

  // 3. Elegir una palabra real para probar éxito
  const testWord = words[0]; 
  console.log(`🔍 Palabra elegida para prueba: "${testWord}"`);

  // Buscar coordenadas reales de esa palabra en la matriz (Lógica simple de búsqueda para el test)
  const coords = findWordCoordinates(matrix, testWord);

  if (!coords) {
    console.error("⚠️ No se pudo encontrar la palabra en la matriz (la prueba de búsqueda falló, no el server).");
    socket.disconnect();
    return;
  }

  console.log(`📡 Enviando validación para "${testWord}" en coordenadas:`, coords[0], "...");
  
  // 4. Enviar a validar
  socket.emit("validateWord", {
    word: testWord,
    selectedCells: coords
  });
});

socket.on("validationResult", (result) => {
  console.log("📨 Resultado de validación recibido:");
  if (result.isValid) {
    console.log("✅ ¡ÉXITO! El servidor validó correctamente la palabra.");
    console.log("   Datos:", result);
  } else {
    console.error("❌ FALLO. El servidor rechazó la palabra válida.");
    console.error("   Razón:", result.reason);
  }
  
  socket.disconnect();
});

// Utilidad rápida para encontrar coordenadas de una palabra horizontal/vertical
function findWordCoordinates(matrix, word) {
  const rows = matrix.length;
  const cols = matrix[0].length;
  
  // Buscar horizontal
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c <= cols - word.length; c++) {
      let match = true;
      let cells = [];
      for (let i = 0; i < word.length; i++) {
        if (matrix[r][c+i] !== word[i]) { match = false; break; }
        cells.push({ row: r, col: c+i });
      }
      if (match) return cells;
    }
  }
  
  // Buscar vertical
  for (let r = 0; r <= rows - word.length; r++) {
    for (let c = 0; c < cols; c++) {
      let match = true;
      let cells = [];
      for (let i = 0; i < word.length; i++) {
        if (matrix[r+i][c] !== word[i]) { match = false; break; }
        cells.push({ row: r+i, col: c });
      }
      if (match) return cells;
    }
  }
  return null;
}
