import React from 'react';

function ProductCardEcom({ product, onAdd }) {
  return (
    <div style={{ background: '#020617', padding: '0.6rem', borderRadius: 12, border: '1px solid #1e293b', display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ width: '100%', height: 140, overflow: 'hidden', borderRadius: 8 }}>
        <img src={product.image} alt={product.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontSize: '1rem', fontWeight: 700 }}>{product.title}</div>
        <div style={{ background: '#0b1220', padding: '4px 8px', borderRadius: 8, fontSize: '0.8rem', color: '#9ca3af' }}>{product.category}</div>
      </div>
      <div style={{ opacity: 0.8, marginTop: 2, flex: 1 }}>{product.description}</div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontWeight: 700 }}>${product.price.toFixed(2)}</div>
        <button onClick={onAdd} style={{ background: '#38bdf8', color: 'black', border: 'none', padding: '0.45rem 0.8rem', borderRadius: 8 }}>Add to cart</button>
      </div>
    </div>
  );
}

export default ProductCardEcom;
