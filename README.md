# Sopa de Letras Inteligente
Aplicación web de sopa de letras en tiempo real, con dificultad adaptativa usando IA, tableros dinámicos para cada usuario y persistencia de estadísticas de juego.

## Tecnologías principales

- Frontend:
  - React (Create React App)
  - Socket.io Client
  - SweetAlert2
- Backend:
  - Node.js + Express
  - Socket.io
  - MongoDB + Mongoose
  - Worker Threads (validación concurrente)
- IA / Adaptación:
  - Modelo de dificultad con TensorFlow.js (lado cliente)

## Características

- Generación dinámica de tableros según dificultad:
  - Fácil﻿: tablero 10x10 con 5 palabras.
  - Medio﻿: tablero 15x15 con 15 palabras.
  - Difícil﻿: tablero 20x20 con 25 palabras.
- Distribución de palabras:
  - En Fácil﻿, palabras colocadas en direcciones horizontal y vertical.
  - En Medio﻿ y Difícil﻿, palabras colocadas en direcciones horizontal, vertical y diagonal para aumentar la complejidad.
- Cada jugador recibe un tablero único por partida.
- Selección de palabras arrastrando el ratón sobre las letras.
- Validación concurrente de palabras mediante Worker Threads.
- Función “Rendirse / Resolver” que revela todas las palabras en el tablero.
- Registro completo de partidas: tiempo, puntuación, estado (ganada/abandonada), dificultad.
- Dificultad inicial elegida por el usuario y luego ajustada automáticamente según el rendimiento.
- Palabras encontradas coloreadas con distintos tonos para distinguirlas fácilmente.
- Panel de:
  - Mejores puntuaciones.
  - Historial reciente de partidas.
- Diseño con fondo degradado, tarjetas y controles estilizados.

## Requisitos previos

- Node.js 18+ instalado
- MongoDB en ejecución (por defecto en `mongodb://localhost:27017/sopa_letras`)

## Instalación

1. Clonar el repositorio:

git clone <URL_DEL_REPO>
cd nightsky18-sopa-de-letras

2. Instalar dependencias del servidor:
```
cd server
npm install
```

3. Instalar dependencias del cliente:
```
cd ../client
npm install
```

4. Sembrar la base de datos con palabras:
```
cd ../server
node seedWords.js

```

## Ejecución en desarrollo

En una terminal, levantar el backend:
```
cd server
npm start
```

En otra terminal, levantar el frontend:
```
cd client
npm start
```

La aplicación estará disponible en:

- Frontend: `http://localhost:3000`
- Backend (API / Socket.io): `http://localhost:4000`

## Flujo de juego

1. Al entrar por primera vez se puede elegir la dificultad inicial (Fácil/Medio/Difícil).
2. Pulsar “Nueva Partida” para generar un tablero nuevo y una sesión de juego.
3. Seleccionar palabras arrastrando sobre las letras; si son válidas se marcan con un color y se actualiza el panel.
4. El temporizador registra el tiempo total de la partida.
5. Se puede:
   - Completar todas las palabras.
   - Rendirse (mostrar solución).
   - Salir de la sesión y reiniciar usuario.

## Scripts útiles

En `server/package.json`:

- `npm start`: iniciar servidor Express + Socket.io.

En `client/package.json`:

- `npm start`: iniciar React en modo desarrollo.
- `npm run build`: compilar para producción.

## Autores
- Mateo Berrío Cardona
- Mariana Montoya Sepúlveda



