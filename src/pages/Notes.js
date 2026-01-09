import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

function Notes() {
  const [notes, setNotes] = useState([]);
  const [input, setInput] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    const storedNotes = JSON.parse(localStorage.getItem('notes')) || [];
    setNotes(storedNotes);
  }, []);

  useEffect(() => {
    localStorage.setItem('notes', JSON.stringify(notes));
  }, [notes]);

  const addNote = () => {
    if (input.trim()) {
      setNotes([...notes, { id: Date.now(), text: input }]);
      setInput('');
    }
  };

  const deleteNote = (id) => {
    setNotes(notes.filter(note => note.id !== id));
  };

  const filteredNotes = notes.filter(note =>
    note.text.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ padding: '2rem', background: '#0f172a', color: '#e5e7eb', minHeight: '100vh' }}>
      <Link to="/" style={{ color: '#38bdf8', textDecoration: 'none', marginBottom: '1rem', display: 'inline-block' }}>← Back to Home</Link>
      <h1>Notes App</h1>
      <div style={{ marginBottom: '1rem' }}>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Add a new note"
          style={{ padding: '0.5rem', marginRight: '0.5rem', borderRadius: '4px', border: 'none', width: '70%' }}
        />
        <button onClick={addNote} style={{ padding: '0.5rem 1rem', borderRadius: '4px', border: 'none', background: '#38bdf8', color: 'white' }}>Add</button>
      </div>
      <div style={{ marginBottom: '1rem' }}>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search notes"
          style={{ padding: '0.5rem', borderRadius: '4px', border: 'none', width: '100%' }}
        />
      </div>
      <div>
        {filteredNotes.map(note => (
          <div key={note.id} style={{ background: '#1e293b', padding: '1rem', marginBottom: '0.5rem', borderRadius: '8px', display: 'flex', justifyContent: 'space-between' }}>
            <span>{note.text}</span>
            <button onClick={() => deleteNote(note.id)} style={{ padding: '0.25rem 0.5rem', borderRadius: '4px', border: 'none', background: '#ef4444', color: 'white' }}>Delete</button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Notes;