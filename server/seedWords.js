// server/seedWords.js
const mongoose = require('mongoose');
const connectDB = require('./config/db');
const Word = require('./models/Word');

// Lista base con categorías para futuro uso con TensorFlow
const rawWords = [
  // ASTRONOMIA
  { text: 'SOL', category: 'ASTRONOMIA' }, { text: 'LUNA', category: 'ASTRONOMIA' },
  { text: 'MARTE', category: 'ASTRONOMIA' }, { text: 'JUPITER', category: 'ASTRONOMIA' },
  { text: 'SATURNO', category: 'ASTRONOMIA' }, { text: 'URANO', category: 'ASTRONOMIA' },
  { text: 'NEPTUNO', category: 'ASTRONOMIA' }, { text: 'PLUTON', category: 'ASTRONOMIA' },
  { text: 'COMETA', category: 'ASTRONOMIA' }, { text: 'ASTEROIDE', category: 'ASTRONOMIA' },
  { text: 'GALAXIA', category: 'ASTRONOMIA' }, { text: 'NEBULOSA', category: 'ASTRONOMIA' },
  { text: 'ORBITA', category: 'ASTRONOMIA' }, { text: 'ECLIPSE', category: 'ASTRONOMIA' },
  { text: 'CONSTELACION', category: 'ASTRONOMIA' }, { text: 'SUPERNOVA', category: 'ASTRONOMIA' },
  { text: 'AGUJERO', category: 'ASTRONOMIA' }, { text: 'COSMOS', category: 'ASTRONOMIA' },
  { text: 'GRAVEDAD', category: 'ASTRONOMIA' }, { text: 'SATELITE', category: 'ASTRONOMIA' },

  // NATURALEZA
  { text: 'ARBOL', category: 'NATURALEZA' }, { text: 'FLOR', category: 'NATURALEZA' },
  { text: 'RIO', category: 'NATURALEZA' }, { text: 'MONTAÑA', category: 'NATURALEZA' },
  { text: 'OCEANO', category: 'NATURALEZA' }, { text: 'BOSQUE', category: 'NATURALEZA' },
  { text: 'SELVA', category: 'NATURALEZA' }, { text: 'DESIERTO', category: 'NATURALEZA' },
  { text: 'VOLCAN', category: 'NATURALEZA' }, { text: 'CASCADA', category: 'NATURALEZA' },
  { text: 'TRUENO', category: 'NATURALEZA' }, { text: 'RELAMPAGO', category: 'NATURALEZA' },
  { text: 'HURACAN', category: 'NATURALEZA' }, { text: 'TORNADO', category: 'NATURALEZA' },
  { text: 'ARCOIRIS', category: 'NATURALEZA' }, { text: 'SEMILLA', category: 'NATURALEZA' },
  { text: 'RAIZ', category: 'NATURALEZA' }, { text: 'PETALO', category: 'NATURALEZA' },
  { text: 'POLEN', category: 'NATURALEZA' }, { text: 'MANANTIAL', category: 'NATURALEZA' },

  // ANIMALES
  { text: 'PERRO', category: 'ANIMALES' }, { text: 'GATO', category: 'ANIMALES' },
  { text: 'ELEFANTE', category: 'ANIMALES' }, { text: 'JIRAFA', category: 'ANIMALES' },
  { text: 'LEON', category: 'ANIMALES' }, { text: 'TIGRE', category: 'ANIMALES' },
  { text: 'DELFIN', category: 'ANIMALES' }, { text: 'BALLENA', category: 'ANIMALES' },
  { text: 'AGUILA', category: 'ANIMALES' }, { text: 'PINGUINO', category: 'ANIMALES' },
  { text: 'CANGURO', category: 'ANIMALES' }, { text: 'KOALA', category: 'ANIMALES' },
  { text: 'PANDA', category: 'ANIMALES' }, { text: 'LOBO', category: 'ANIMALES' },
  { text: 'ZORRO', category: 'ANIMALES' }, { text: 'OSO', category: 'ANIMALES' },
  { text: 'TORTUGA', category: 'ANIMALES' }, { text: 'SERPIENTE', category: 'ANIMALES' },
  { text: 'COCODRILO', category: 'ANIMALES' }, { text: 'CAMALEON', category: 'ANIMALES' },

  // TECNOLOGIA
  { text: 'COMPUTADOR', category: 'TECNOLOGIA' }, { text: 'INTERNET', category: 'TECNOLOGIA' },
  { text: 'ROBOT', category: 'TECNOLOGIA' }, { text: 'SOFTWARE', category: 'TECNOLOGIA' },
  { text: 'HARDWARE', category: 'TECNOLOGIA' }, { text: 'ALGORITMO', category: 'TECNOLOGIA' },
  { text: 'PIXEL', category: 'TECNOLOGIA' }, { text: 'SERVIDOR', category: 'TECNOLOGIA' },
  { text: 'CODIGO', category: 'TECNOLOGIA' }, { text: 'DATOS', category: 'TECNOLOGIA' },
  { text: 'WIFI', category: 'TECNOLOGIA' }, { text: 'BLUETOOTH', category: 'TECNOLOGIA' },
  { text: 'PANTALLA', category: 'TECNOLOGIA' }, { text: 'TECLADO', category: 'TECNOLOGIA' },
  { text: 'MOUSE', category: 'TECNOLOGIA' }, { text: 'CHIP', category: 'TECNOLOGIA' },
  { text: 'MEMORIA', category: 'TECNOLOGIA' }, { text: 'BATERIA', category: 'TECNOLOGIA' },
  { text: 'VIRTUAL', category: 'TECNOLOGIA' }, { text: 'DIGITAL', category: 'TECNOLOGIA' },

  // DEPORTES
  { text: 'FUTBOL', category: 'DEPORTES' }, { text: 'BALONCESTO', category: 'DEPORTES' },
  { text: 'TENIS', category: 'DEPORTES' }, { text: 'NATACION', category: 'DEPORTES' },
  { text: 'ATLETISMO', category: 'DEPORTES' }, { text: 'CICLISMO', category: 'DEPORTES' },
  { text: 'BOXEO', category: 'DEPORTES' }, { text: 'GOLF', category: 'DEPORTES' },
  { text: 'VOLEIBOL', category: 'DEPORTES' }, { text: 'RUGBY', category: 'DEPORTES' },
  { text: 'BEISBOL', category: 'DEPORTES' }, { text: 'HOCKEY', category: 'DEPORTES' },
  { text: 'KARATE', category: 'DEPORTES' }, { text: 'JUDO', category: 'DEPORTES' },
  { text: 'ESGRIMA', category: 'DEPORTES' }, { text: 'SURF', category: 'DEPORTES' },
  { text: 'SKATE', category: 'DEPORTES' }, { text: 'GIMNASIA', category: 'DEPORTES' },
  { text: 'ESQUI', category: 'DEPORTES' }, { text: 'REMO', category: 'DEPORTES' },

  // COLORES
  { text: 'ROJO', category: 'COLORES' }, { text: 'AZUL', category: 'COLORES' },
  { text: 'VERDE', category: 'COLORES' }, { text: 'AMARILLO', category: 'COLORES' },
  { text: 'NARANJA', category: 'COLORES' }, { text: 'VIOLETA', category: 'COLORES' },
  { text: 'INDIGO', category: 'COLORES' }, { text: 'BLANCO', category: 'COLORES' },
  { text: 'NEGRO', category: 'COLORES' }, { text: 'GRIS', category: 'COLORES' },
  { text: 'ROSA', category: 'COLORES' }, { text: 'TURQUESA', category: 'COLORES' },
  { text: 'DORADO', category: 'COLORES' }, { text: 'PLATEADO', category: 'COLORES' },
  { text: 'BRONCE', category: 'COLORES' }, { text: 'BEIGE', category: 'COLORES' },
  { text: 'MARRON', category: 'COLORES' }, { text: 'MAGENTA', category: 'COLORES' },
  { text: 'CIAN', category: 'COLORES' }, { text: 'LILA', category: 'COLORES' },

  // ALIMENTOS
  { text: 'MANZANA', category: 'ALIMENTOS' }, { text: 'BANANA', category: 'ALIMENTOS' },
  { text: 'NARANJA', category: 'ALIMENTOS' }, { text: 'UVA', category: 'ALIMENTOS' },
  { text: 'FRESA', category: 'ALIMENTOS' }, { text: 'MELON', category: 'ALIMENTOS' },
  { text: 'SANDIA', category: 'ALIMENTOS' }, { text: 'PIÑA', category: 'ALIMENTOS' },
  { text: 'KIWI', category: 'ALIMENTOS' }, { text: 'LIMON', category: 'ALIMENTOS' },
  { text: 'TOMATE', category: 'ALIMENTOS' }, { text: 'LECHUGA', category: 'ALIMENTOS' },
  { text: 'ZANAHORIA', category: 'ALIMENTOS' }, { text: 'PAPA', category: 'ALIMENTOS' },
  { text: 'ARROZ', category: 'ALIMENTOS' }, { text: 'PASTA', category: 'ALIMENTOS' },
  { text: 'PAN', category: 'ALIMENTOS' }, { text: 'QUESO', category: 'ALIMENTOS' },
  { text: 'LECHE', category: 'ALIMENTOS' }, { text: 'HUEVO', category: 'ALIMENTOS' }
];

async function seed() {
  try {
    await connectDB();
    
    // 1. Limpiar colección previa
    await Word.deleteMany({});
    console.log('Colección de palabras limpiada.');

    // 2. Eliminar duplicados basados en el campo 'text'
    // Usamos un Map para mantener solo la primera ocurrencia de cada texto
    const uniqueMap = new Map();
    for (const item of rawWords) {
      if (!uniqueMap.has(item.text)) {
        uniqueMap.set(item.text, item);
      }
    }
    const uniqueList = Array.from(uniqueMap.values());

    // 3. Preparar documentos calculando length y difficulty
    const docs = uniqueList.map(w => {
      const len = w.text.length;
      // Dificultad: 1 (<=5 letras), 2 (6-8 letras), 3 (>=9 letras)
      const diff = len <= 5 ? 1 : len <= 8 ? 2 : 3;
      
      return {
        text: w.text,
        category: w.category,
        length: len,
        difficulty: diff
      };
    });

    // 4. Insertar en BD
    await Word.insertMany(docs);
    console.log(`${docs.length} palabras insertadas correctamente.`);

  } catch (err) {
    console.error('Error sembrando palabras:', err);
  } finally {
    mongoose.connection.close();
  }
}

seed();