import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';

function Cart() {
  const [items, setItems] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const raw = localStorage.getItem('cart_items');
    setItems(raw ? JSON.parse(raw) : []);
  }, []);

  const updateStorage = (next) => {
    setItems(next);
    localStorage.setItem('cart_items', JSON.stringify(next));
  };

  const remove = (id) => {
    updateStorage(items.filter(i => i.id !== id));
  };

  const changeQty = (id, delta) => {
    const next = items.map(i => i.id === id ? { ...i, qty: Math.max(1, i.qty + delta) } : i);
    updateStorage(next);
  };

  const clear = () => {
    updateStorage([]);
  };

  const checkout = () => {
    // placeholder behavior
    alert('Checkout not implemented in demo.');
    clear();
    navigate('/ecommerce');
  };

  const total = items.reduce((s, it) => s + (it.price || 0) * it.qty, 0);

  return (
    <div style={{ minHeight: '100vh', background: '#0f172a', color: '#e5e7eb', padding: '2rem' }}>
      <Link to="/ecommerce" style={{ color: '#38bdf8', textDecoration: 'none', marginBottom: '1rem', display: 'inline-block' }}>← Back to Shop</Link>
      <h1>Cart</h1>
      {items.length === 0 ? (
        <div style={{ marginTop: '1rem' }}>Your cart is empty.</div>
      ) : (
        <div style={{ marginTop: '1rem' }}>
          <div style={{ display: 'grid', gap: '0.75rem' }}>
            {items.map(it => (
              <div key={it.id} style={{ display: 'flex', justifyContent: 'space-between', background: '#020617', padding: '0.8rem', borderRadius: 8 }}>
                <div>
                  <div style={{ fontWeight: 600 }}>{it.title}</div>
                  <div style={{ opacity: 0.8, fontSize: '0.9rem' }}>{it.description}</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <button onClick={() => changeQty(it.id, -1)} style={{ padding: '0.25rem 0.5rem' }}>−</button>
                  <div>{it.qty}</div>
                  <button onClick={() => changeQty(it.id, 1)} style={{ padding: '0.25rem 0.5rem' }}>+</button>
                  <div style={{ width: 80, textAlign: 'right', marginLeft: '1rem' }}>${(it.price * it.qty).toFixed(2)}</div>
                  <button onClick={() => remove(it.id)} style={{ marginLeft: '0.5rem', background: '#ef4444', color: 'white', border: 'none', padding: '0.35rem 0.6rem', borderRadius: 6 }}>Remove</button>
                </div>
              </div>
            ))}
          </div>

          <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontWeight: 700 }}>Total: ${total.toFixed(2)}</div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button onClick={clear} style={{ background: '#94a3b8', color: 'white', border: 'none', padding: '0.5rem 0.8rem', borderRadius: 6 }}>Clear</button>
              <button onClick={checkout} style={{ background: '#10b981', color: 'white', border: 'none', padding: '0.5rem 0.8rem', borderRadius: 6 }}>Checkout</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Cart;
