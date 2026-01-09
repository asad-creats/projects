import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

function Pomodoro() {
  const storedWork = parseInt(localStorage.getItem('pomodoroWorkMinutes')) || 25;
  const storedBreak = parseInt(localStorage.getItem('pomodoroBreakMinutes')) || 5;

  const [workMinutes, setWorkMinutes] = useState(storedWork);
  const [breakMinutes, setBreakMinutes] = useState(storedBreak);
  const [time, setTime] = useState(workMinutes * 60);
  const [isActive, setIsActive] = useState(false);
  const [isBreak, setIsBreak] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [draftWork, setDraftWork] = useState(workMinutes);
  const [draftBreak, setDraftBreak] = useState(breakMinutes);

  useEffect(() => {
    let interval = null;
    if (isActive && time > 0) {
      interval = setInterval(() => {
        setTime(time => time - 1);
      }, 1000);
    } else if (time === 0) {
      if (!isBreak) {
        setIsBreak(true);
        setTime(breakMinutes * 60);
      } else {
        setIsBreak(false);
        setTime(workMinutes * 60);
        setIsActive(false);
      }
    }
    return () => clearInterval(interval);
  }, [isActive, time, isBreak]);

  const toggleTimer = () => {
    setIsActive(!isActive);
  };

  const resetTimer = () => {
    setIsActive(false);
    setIsBreak(false);
    setTime(workMinutes * 60);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div style={{ padding: '2rem', background: '#0f172a', color: '#e5e7eb', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
      <Link to="/" style={{ color: '#38bdf8', textDecoration: 'none', marginBottom: '1rem', position: 'absolute', top: '2rem', left: '2rem' }}>← Back to Home</Link>
      <h1>Pomodoro Timer</h1>
      <div style={{ fontSize: '4rem', marginBottom: '2rem' }}>{formatTime(time)}</div>
      <div style={{ marginBottom: '1rem' }}>{isBreak ? 'Break Time!' : 'Work Time'}</div>
      <div style={{ marginBottom: '1rem' }}>
        <button onClick={() => { setIsEditing(!isEditing); setDraftWork(workMinutes); setDraftBreak(breakMinutes); }} style={{ padding: '0.35rem 0.6rem', marginRight: '0.5rem', borderRadius: '4px', border: 'none', background: '#94a3b8', color: 'white' }}>
          {isEditing ? 'Close' : 'Edit Time'}
        </button>
      </div>
      {isEditing && (
        <div style={{ marginBottom: '1rem', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            Work (min):
            <input type="number" min="1" value={draftWork} onChange={(e) => setDraftWork(Number(e.target.value))} style={{ width: '4rem', marginLeft: '0.25rem', padding: '0.25rem' }} />
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            Break (min):
            <input type="number" min="1" value={draftBreak} onChange={(e) => setDraftBreak(Number(e.target.value))} style={{ width: '4rem', marginLeft: '0.25rem', padding: '0.25rem' }} />
          </label>
          <button onClick={() => {
            const w = Math.max(1, Math.floor(draftWork));
            const b = Math.max(1, Math.floor(draftBreak));
            setWorkMinutes(w);
            setBreakMinutes(b);
            localStorage.setItem('pomodoroWorkMinutes', String(w));
            localStorage.setItem('pomodoroBreakMinutes', String(b));
            setIsEditing(false);
            setIsBreak(false);
            setIsActive(false);
            setTime(w * 60);
          }} style={{ padding: '0.35rem 0.6rem', borderRadius: '4px', border: 'none', background: '#10b981', color: 'white' }}>Save</button>
          <button onClick={() => { setDraftWork(workMinutes); setDraftBreak(breakMinutes); setIsEditing(false); }} style={{ padding: '0.35rem 0.6rem', borderRadius: '4px', border: 'none', background: '#ef4444', color: 'white' }}>Cancel</button>
        </div>
      )}
      <div>
        <button onClick={toggleTimer} style={{ padding: '0.5rem 1rem', marginRight: '0.5rem', borderRadius: '4px', border: 'none', background: '#38bdf8', color: 'white' }}>
          {isActive ? 'Pause' : 'Start'}
        </button>
        <button onClick={resetTimer} style={{ padding: '0.5rem 1rem', borderRadius: '4px', border: 'none', background: '#ef4444', color: 'white' }}>Reset</button>
      </div>
    </div>
  );
}

export default Pomodoro;