import React from 'react';
import ProductCardEcom from './ProductCardEcom';

const sampleProducts = [
  { id: 'p1', title: 'Starter T-Shirt', description: 'Comfortable cotton tee', price: 19.99, category: 'Apparel', image: 'https://via.placeholder.com/300x180?text=Starter+T-Shirt' },
  { id: 'p2', title: 'Notebook Pro', description: 'Hardcover notebook, 200 pages', price: 12.5, category: 'Stationery', image: 'https://via.placeholder.com/300x180?text=Notebook+Pro' },
  { id: 'p3', title: 'Wireless Headset', description: 'Lightweight bluetooth headset', price: 59.99, category: 'Audio', image: 'https://via.placeholder.com/300x180?text=Wireless+Headset' },
  { id: 'p4', title: 'Developer Mug', description: 'Ceramic mug with code-print', price: 9.99, category: 'Merch', image: 'https://via.placeholder.com/300x180?text=Developer+Mug' },
];

function ProductList({ onAdd, search = '', category = 'All' }) {
  const q = search.trim().toLowerCase();
  const filtered = sampleProducts.filter(p => {
    if (category !== 'All' && p.category !== category) return false;
    if (!q) return true;
    return p.title.toLowerCase().includes(q) || p.description.toLowerCase().includes(q) || p.category.toLowerCase().includes(q);
  });

  return (
    <div style={{ marginTop: 12 }}>
      {filtered.length === 0 ? (
        <div style={{ padding: 20, background: '#020617', borderRadius: 8 }}>No products match your search.</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16 }}>
          {filtered.map(p => (
            <ProductCardEcom key={p.id} product={p} onAdd={() => onAdd(p)} />
          ))}
        </div>
      )}
    </div>
  );
}

export default ProductList;
