// client/src/components/Board.js
import React from 'react';

function Board({ matrix }) {
  if (!matrix || matrix.length === 0) {
    return <div>Cargando tablero...</div>;
  }

  return (
    <table>
      <tbody>
        {matrix.map((row, r) => (
          <tr key={r}>
            {row.map((letter, c) => (
              <td key={c}>{letter}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export default Board;
