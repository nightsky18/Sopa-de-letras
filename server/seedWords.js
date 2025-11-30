// server/seedWords.js
const mongoose = require('mongoose');
const connectDB = require('./config/db');
const Word = require('./models/Word');

const words = [
  'SOL','LUNA','MAR','CIELO','NUBE','LLUVIA','VIENTO','RAYO','TRUENO','NIEVE',
  'RIO','LAGO','MARTE','TIERRA','VENUS','SATURNO','ESTRELLA','GALAXIA','COMETA','ASTRO',
  'CASA','PUERTA','VENTANA','TECHO','PARED','SILLA','MESA','CAMINO','CALLE','PARQUE',
  'ARBOL','FLOR','HOJA','RAIZ','BOSQUE','SELVA','DESIERTO','MONTAÑA','VALLE','PLAYA',
  'PERRO','GATO','LORO','CABALLO','VACA','OVEJA','CABRA','CONEJO','TIGRE','LEON',
  'ROJO','AZUL','VERDE','AMARILLO','NEGRO','BLANCO','MORADO','NARANJA','ROSA','GRIS',
  'FUEGO','AGUA','TIEMPO','AIRE','NUBE','ROCA','ARENA','HIELO','VIENTO','OLLA',
  'LIBRO','PLUMA','PAPEL','CUADERNO','LAPIZ','RELOJ','RADIO','MOVIL','ORDENADOR','TECLADO',
  'JUEGO','DADO','CARTA','PEON','REINA','REY','TORRE','CABALLO','TABLERO','FICHA',
  'MUSICA','DANZA','CANTO','PIANO','GUITARRA','TAMBOR','VIOLIN','FLAUTA','ORQUESTA','CORO'
];

async function seed() {
  try {
    await connectDB();
    await Word.deleteMany({});
    const docs = words.map(w => ({
      text: w,
      difficulty: w.length <= 4 ? 1 : w.length <= 6 ? 2 : 3
    }));
    await Word.insertMany(docs);
    console.log('100 palabras insertadas');
  } catch (err) {
    console.error('Error sembrando palabras:', err);
  } finally {
    mongoose.connection.close();
  }
}

seed();
