import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

function TicTacToe() {
  const [board, setBoard] = useState(Array(9).fill(null));
  const [currentPlayer, setCurrentPlayer] = useState('X');
  const [winner, setWinner] = useState(null);
  const [gamePhase, setGamePhase] = useState('setup'); // 'setup', 'toss', 'playing'
  const [player1Symbol, setPlayer1Symbol] = useState(null);
  const [player2Symbol, setPlayer2Symbol] = useState(null);
  const [tossWinner, setTossWinner] = useState(null);
  const [tossAnimation, setTossAnimation] = useState('');

  const calculateWinner = (squares) => {
    const lines = [
      [0, 1, 2],
      [3, 4, 5],
      [6, 7, 8],
      [0, 3, 6],
      [1, 4, 7],
      [2, 5, 8],
      [0, 4, 8],
      [2, 4, 6],
    ];
    for (let i = 0; i < lines.length; i++) {
      const [a, b, c] = lines[i];
      if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
        return squares[a];
      }
    }
    return null;
  };

  const handleClick = (i) => {
    if (board[i] || winner || gamePhase !== 'playing') return;
    const newBoard = board.slice();
    newBoard[i] = currentPlayer;
    setBoard(newBoard);
    setCurrentPlayer(currentPlayer === 'X' ? 'O' : 'X');
  };

  useEffect(() => {
    const win = calculateWinner(board);
    if (win) {
      setWinner(win);
    }
  }, [board]);

  const selectSymbol = (symbol) => {
    if (!player1Symbol) {
      setPlayer1Symbol(symbol);
      setPlayer2Symbol(symbol === 'X' ? 'O' : 'X');
    }
  };

  const [spinning, setSpinning] = useState(false);

  const startToss = () => {
    setGamePhase('toss');
    setSpinning(true);
    let count = 0;
    const interval = setInterval(() => {
      setTossAnimation(count % 2 === 0 ? player1Symbol : player2Symbol);
      count++;
      if (count > 10) {
        clearInterval(interval);
        setSpinning(false);
        const winner = Math.random() < 0.5 ? 'Player 1' : 'Player 2';
        setTossWinner(winner);
        setTossAnimation(winner === 'Player 1' ? player1Symbol : player2Symbol);
        setTimeout(() => {
          setGamePhase('playing');
          setCurrentPlayer(winner === 'Player 1' ? player1Symbol : player2Symbol);
        }, 1000);
      }
    }, 200);
  };

  const resetGame = () => {
    setBoard(Array(9).fill(null));
    setCurrentPlayer('X');
    setWinner(null);
    setGamePhase('setup');
    setPlayer1Symbol(null);
    setPlayer2Symbol(null);
    setTossWinner(null);
    setTossAnimation('');
  };

  const renderSquare = (i) => (
    <button
      style={{
        width: '60px',
        height: '60px',
        fontSize: '2rem',
        border: '1px solid #ccc',
        background: '#1e293b',
        color: '#e5e7eb',
        cursor: gamePhase === 'playing' ? 'pointer' : 'not-allowed'
      }}
      onClick={() => handleClick(i)}
    >
      {board[i]}
    </button>
  );

  if (gamePhase === 'setup') {
    return (
      <div style={{ padding: '2rem', background: '#0f172a', color: '#e5e7eb', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <Link to="/" style={{ color: '#38bdf8', textDecoration: 'none', marginBottom: '1rem', alignSelf: 'flex-start' }}>← Back to Home</Link>
        <h1>Tic-Tac-Toe</h1>
        <p>Player 1, choose your symbol:</p>
        <div>
          <button onClick={() => selectSymbol('X')} style={{ padding: '1rem', margin: '0.5rem', borderRadius: '4px', border: 'none', background: '#38bdf8', color: 'white' }}>X</button>
          <button onClick={() => selectSymbol('O')} style={{ padding: '1rem', margin: '0.5rem', borderRadius: '4px', border: 'none', background: '#38bdf8', color: 'white' }}>O</button>
        </div>
        {player1Symbol && (
          <div>
            <p>Player 1: {player1Symbol}</p>
            <p>Player 2: {player2Symbol}</p>
            <button onClick={startToss} style={{ padding: '0.5rem 1rem', borderRadius: '4px', border: 'none', background: '#10b981', color: 'white' }}>Start Toss</button>
          </div>
        )}
      </div>
    );
  }

  if (gamePhase === 'toss') {
    return (
      <div style={{ padding: '2rem', background: '#0f172a', color: '#e5e7eb', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <h1>Tossing...</h1>
        <div style={{ position: 'relative', height: '300px', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
          <style>
            {`
              @keyframes coinFlip {
                0% { transform: translateY(0) rotateY(0deg); }
                25% { transform: translateY(-100px) rotateY(450deg); }
                50% { transform: translateY(-200px) rotateY(900deg); }
                75% { transform: translateY(-100px) rotateY(1350deg); }
                100% { transform: translateY(0) rotateY(1800deg); }
              }
              @keyframes handToss {
                0% { transform: translateY(0) rotate(0deg); }
                20% { transform: translateY(-10px) rotate(-5deg); }
                40% { transform: translateY(-20px) rotate(5deg); }
                60% { transform: translateY(-10px) rotate(-5deg); }
                80% { transform: translateY(0) rotate(0deg); }
                100% { transform: translateY(0) rotate(0deg); }
              }
            `}
          </style>
          <div
            style={{
              width: '80px',
              height: '80px',
              borderRadius: '50%',
              background: 'linear-gradient(45deg, gold, #ffd700)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '2.5rem',
              fontWeight: 'bold',
              color: '#000',
              animation: spinning ? 'coinFlip 2s ease-in-out' : 'none',
              boxShadow: '0 4px 8px rgba(0,0,0,0.3)',
              position: 'absolute',
              bottom: '100px'
            }}
          >
            {tossAnimation}
          </div>
          <svg
            width="100"
            height="100"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            style={{
              animation: spinning ? 'handToss 2s ease-in-out' : 'none',
              position: 'absolute',
              bottom: '0'
            }}
          >
            <path d="M12 2C13.1 2 14 2.9 14 4V8H16C17.1 8 18 8.9 18 10V12H20C21.1 12 22 12.9 22 14V20C22 21.1 21.1 22 20 22H12C10.9 22 10 21.1 10 20V18H8C6.9 18 6 17.1 6 16V14H4C2.9 14 2 13.1 2 12V8C2 6.9 2.9 6 4 6H6V4C6 2.9 6.9 2 8 2H12Z" fill="#e5e7eb"/>
          </svg>
        </div>
        {tossWinner && <p style={{ marginTop: '1rem', fontSize: '1.2rem' }}>{tossWinner} goes first!</p>}
      </div>
    );
  }

  return (
    <div style={{ padding: '2rem', background: '#0f172a', color: '#e5e7eb', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <Link to="/" style={{ color: '#38bdf8', textDecoration: 'none', marginBottom: '1rem', alignSelf: 'flex-start' }}>← Back to Home</Link>
      <h1>Tic-Tac-Toe</h1>
      <div style={{ marginBottom: '1rem' }}>
        {winner ? `Winner: ${winner}` : board.includes(null) ? `Current player: ${currentPlayer}` : 'Draw'}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 60px)', gap: '5px' }}>
        {Array(9).fill(null).map((_, i) => renderSquare(i))}
      </div>
      <button onClick={resetGame} style={{ marginTop: '1rem', padding: '0.5rem 1rem', borderRadius: '4px', border: 'none', background: '#38bdf8', color: 'white' }}>New Game</button>
    </div>
  );
}

export default TicTacToe;