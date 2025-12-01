import * as tf from '@tensorflow/tfjs';

/**
 * Predice el nivel de dificultad ideal (1, 2, 3)
 * Basado en el historial reciente de partidas.
 * @param {Array} recentGames - Array de objetos { score, status, duration }
 */
export const predictDifficulty = async (recentGames) => {
  if (!recentGames || recentGames.length < 2) {
    return 2; // Default: Nivel Medio si hay pocos datos
  }

  // 1. PREPARAR DATOS (Features)
  // Usaremos: Promedio de Score y Tasa de Victorias
  // Normalizamos score: asumimos max posible 2000
  
  let totalScore = 0;
  let wins = 0;

  recentGames.forEach(g => {
    totalScore += (g.score || 0);
    if (g.status === 'finished') wins++;
  });

  const avgScoreNorm = (totalScore / recentGames.length) / 2000; // 0 a 1
  const winRate = wins / recentGames.length; // 0 a 1

  // Tensor de entrada [AvgScore, WinRate]
  const input = tf.tensor2d([[avgScoreNorm, winRate]]);

  // 2. MODELO (Simulado/Heurístico con Tensores)
  // Queremos:
  // - Si score es alto y gana mucho -> Subir nivel (Output > 0.6)
  // - Si score es medio -> Mantener (0.3 - 0.6)
  // - Si pierde mucho -> Bajar (< 0.3)
  
  // Pesos manuales: El Score importa un 40%, el WinRate un 60%
  const weights = tf.tensor2d([[0.4], [0.6]]); 
  
  // Bias para ajustar el umbral base
  const bias = tf.tensor1d([0.1]); 

  // Operación: (Input * Weights) + Bias
  const prediction = input.matMul(weights).add(bias);
  const resultValue = (await prediction.data())[0];

  // Limpieza de memoria
  input.dispose();
  weights.dispose();
  bias.dispose();
  prediction.dispose();

  console.log(`IA Prediction Value: ${resultValue.toFixed(2)}`);

  // 3. INTERPRETAR RESULTADO
  if (resultValue > 0.65) return 3; // Difícil
  if (resultValue < 0.35) return 1; // Fácil
  return 2; // Medio
};
