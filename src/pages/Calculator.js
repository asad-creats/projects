import { useState } from 'react';
import { Link } from 'react-router-dom';

function Calculator() {
  const [display, setDisplay] = useState('0');
  const [previousValue, setPreviousValue] = useState(null);
  const [operation, setOperation] = useState(null);

  const inputNumber = (num) => {
    setDisplay(display === '0' ? num : display + num);
  };

  const inputOperation = (op) => {
    if (previousValue === null) {
      setPreviousValue(parseFloat(display));
      setDisplay('0');
      setOperation(op);
    } else {
      calculate();
      setOperation(op);
    }
  };

  const calculate = () => {
    const current = parseFloat(display);
    let result;
    switch (operation) {
      case '+':
        result = previousValue + current;
        break;
      case '-':
        result = previousValue - current;
        break;
      case '*':
        result = previousValue * current;
        break;
      case '/':
        result = previousValue / current;
        break;
      default:
        return;
    }
    setDisplay(result.toString());
    setPreviousValue(null);
    setOperation(null);
  };

  const clear = () => {
    setDisplay('0');
    setPreviousValue(null);
    setOperation(null);
  };

  return (
    <div style={{ padding: '2rem', background: '#0f172a', color: '#e5e7eb', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <Link to="/" style={{ color: '#38bdf8', textDecoration: 'none', marginBottom: '1rem', alignSelf: 'flex-start' }}>← Back to Home</Link>
      <div style={{ background: '#1e293b', padding: '1rem', borderRadius: '8px', width: '300px' }}>
        <div style={{ background: '#0f172a', padding: '1rem', marginBottom: '1rem', borderRadius: '4px', textAlign: 'right', fontSize: '2rem' }}>{display}</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem' }}>
          <button onClick={clear} style={{ padding: '1rem', borderRadius: '4px', border: 'none', background: '#ef4444', color: 'white' }}>C</button>
          <button onClick={() => inputOperation('/')} style={{ padding: '1rem', borderRadius: '4px', border: 'none', background: '#374151', color: 'white' }}>/</button>
          <button onClick={() => inputOperation('*')} style={{ padding: '1rem', borderRadius: '4px', border: 'none', background: '#374151', color: 'white' }}>*</button>
          <button onClick={() => inputOperation('-')} style={{ padding: '1rem', borderRadius: '4px', border: 'none', background: '#374151', color: 'white' }}>-</button>
          <button onClick={() => inputNumber('7')} style={{ padding: '1rem', borderRadius: '4px', border: 'none', background: '#4b5563', color: 'white' }}>7</button>
          <button onClick={() => inputNumber('8')} style={{ padding: '1rem', borderRadius: '4px', border: 'none', background: '#4b5563', color: 'white' }}>8</button>
          <button onClick={() => inputNumber('9')} style={{ padding: '1rem', borderRadius: '4px', border: 'none', background: '#4b5563', color: 'white' }}>9</button>
          <button onClick={() => inputOperation('+')} style={{ padding: '1rem', borderRadius: '4px', border: 'none', background: '#374151', color: 'white', gridRow: 'span 2' }}>+</button>
          <button onClick={() => inputNumber('4')} style={{ padding: '1rem', borderRadius: '4px', border: 'none', background: '#4b5563', color: 'white' }}>4</button>
          <button onClick={() => inputNumber('5')} style={{ padding: '1rem', borderRadius: '4px', border: 'none', background: '#4b5563', color: 'white' }}>5</button>
          <button onClick={() => inputNumber('6')} style={{ padding: '1rem', borderRadius: '4px', border: 'none', background: '#4b5563', color: 'white' }}>6</button>
          <button onClick={() => inputNumber('1')} style={{ padding: '1rem', borderRadius: '4px', border: 'none', background: '#4b5563', color: 'white' }}>1</button>
          <button onClick={() => inputNumber('2')} style={{ padding: '1rem', borderRadius: '4px', border: 'none', background: '#4b5563', color: 'white' }}>2</button>
          <button onClick={() => inputNumber('3')} style={{ padding: '1rem', borderRadius: '4px', border: 'none', background: '#4b5563', color: 'white' }}>3</button>
          <button onClick={calculate} style={{ padding: '1rem', borderRadius: '4px', border: 'none', background: '#10b981', color: 'white', gridColumn: 'span 2' }}>=</button>
          <button onClick={() => inputNumber('0')} style={{ padding: '1rem', borderRadius: '4px', border: 'none', background: '#4b5563', color: 'white', gridColumn: 'span 2' }}>0</button>
          <button onClick={() => inputNumber('.')} style={{ padding: '1rem', borderRadius: '4px', border: 'none', background: '#4b5563', color: 'white' }}>.</button>
        </div>
      </div>
    </div>
  );
}

export default Calculator;