import React from 'react';
import { styles } from '../styles/styles';

export const CategoryBar = ({ categories, selectedCategory, setSelectedCategory }) => {
  return (
    <div style={styles.categoryBar}>
      {categories.map(cat => (
        <button
          key={cat}
          onClick={() => setSelectedCategory(cat)}
          style={{
            ...styles.categoryButton,
            ...(selectedCategory === cat ? styles.categoryButtonActive : {})
          }}
        >
          {cat}
        </button>
      ))}
    </div>
  );
};
