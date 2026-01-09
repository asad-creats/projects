import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import ProductList from '../components/ProductList';
import EcomHeader from '../components/EcomHeader';

function Ecommerce() {
  const [cartCount, setCartCount] = useState(0);
  const [toast, setToast] = useState(null);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [user, setUser] = useState(() => {
    const raw = localStorage.getItem('ecom_user');
    return raw ? JSON.parse(raw) : null;
  });

  useEffect(() => {
    const raw = localStorage.getItem('cart_items');
    const items = raw ? JSON.parse(raw) : [];
    const count = items.reduce((s, it) => s + (it.qty || 0), 0);
    setCartCount(count);
  }, []);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 1800);
  };

  const addToCart = (product) => {
    const raw = localStorage.getItem('cart_items');
    const items = raw ? JSON.parse(raw) : [];
    const existing = items.find(i => i.id === product.id);
    if (existing) {
      existing.qty += 1;
    } else {
      items.push({ ...product, qty: 1 });
    }
    localStorage.setItem('cart_items', JSON.stringify(items));
    const newCount = items.reduce((s, it) => s + (it.qty || 0), 0);
    setCartCount(newCount);
    showToast(`${product.title} added to cart`);
  };

  const signIn = () => {
    const name = window.prompt('Enter your name to sign in:') || 'User';
    const u = { name };
    setUser(u);
    localStorage.setItem('ecom_user', JSON.stringify(u));
    showToast(`Signed in as ${u.name}`);
  };

  const signOut = () => {
    setUser(null);
    localStorage.removeItem('ecom_user');
    showToast('Signed out');
  };

  const categories = ['All', 'Apparel', 'Stationery', 'Audio', 'Merch'];

  return (
    <div style={{ minHeight: '100vh', background: '#0f172a', color: '#e5e7eb', padding: '2rem' }}>
      <EcomHeader storeName={"Asad's Store"} cartCount={cartCount} search={search} setSearch={setSearch} category={category} setCategory={setCategory} categories={categories} user={user} onSignIn={signIn} onSignOut={signOut} />

      <p style={{ opacity: 0.9 }}>Simple front-end demo showing product listing and cart (no backend).</p>

      <ProductList onAdd={addToCart} search={search} category={category} />

      {toast && (
        <div style={{ position: 'fixed', right: 20, bottom: 20, background: '#111827', color: 'white', padding: '0.6rem 0.9rem', borderRadius: 8, boxShadow: '0 6px 18px rgba(0,0,0,0.5)' }}>{toast}</div>
      )}
    </div>
  );
}

export default Ecommerce;
