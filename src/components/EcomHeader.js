import React from 'react';
import { Link } from 'react-router-dom';

function EcomHeader({ storeName = "Asad's Store", cartCount = 0, search, setSearch, category, setCategory, categories = [], user, onSignIn, onSignOut }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: '0.75rem 0', borderBottom: '1px solid #0b1a2a', marginBottom: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none', color: 'inherit' }}>
          <div style={{ width: 44, height: 44, borderRadius: 10, background: '#38bdf8', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#04263b', fontWeight: 800 }}>A</div>
          <div>
            <div style={{ fontWeight: 800, fontSize: '1.05rem' }}>{storeName}</div>
            <div style={{ fontSize: '0.75rem', opacity: 0.8 }}>Handcrafted demos</div>
          </div>
        </Link>
      </div>

      <nav style={{ display: 'flex', gap: 10, alignItems: 'center', flex: 1, justifyContent: 'center' }} aria-label="Product categories">
        {categories.map(c => (
          <button key={c} onClick={() => setCategory(c)} style={{ background: category === c ? '#1e293b' : 'transparent', color: '#e5e7eb', border: 'none', padding: '0.4rem 0.65rem', borderRadius: 8, cursor: 'pointer' }}>{c}</button>
        ))}
      </nav>

      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <input aria-label="Search products" placeholder="Search" value={search} onChange={(e) => setSearch(e.target.value)} style={{ padding: '0.45rem 0.6rem', borderRadius: 8, border: '1px solid #263244', background: '#071127', color: '#e5e7eb' }} />
        <Link to="/ecommerce/cart" style={{ background: '#10b981', color: 'white', padding: '0.5rem 0.8rem', borderRadius: 8, textDecoration: 'none' }}>Cart ({cartCount})</Link>

        {user ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 36, height: 36, borderRadius: 999, background: '#0ea5a0', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#04263b', fontWeight: 700 }}>{user.name.charAt(0).toUpperCase()}</div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <div style={{ fontSize: '0.9rem' }}>{user.name}</div>
              <button onClick={onSignOut} style={{ background: 'transparent', border: 'none', color: '#94a3b8', padding: 0, cursor: 'pointer', fontSize: '0.8rem' }}>Sign out</button>
            </div>
          </div>
        ) : (
          <button onClick={onSignIn} style={{ background: 'transparent', border: '1px solid #263244', color: '#e5e7eb', padding: '0.45rem 0.6rem', borderRadius: 8 }}>Sign in</button>
        )}
      </div>
    </div>
  );
}

export default EcomHeader;
