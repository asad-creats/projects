import React from 'react';
import { styles } from '../styles/styles';

export const FilterBar = ({ filter, setFilter }) => {
  return (
    <div style={styles.filterBar}>
      <div style={styles.filterButtons}>
        {['all', 'active', 'completed'].map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            style={{
              ...styles.filterButton,
              ...(filter === f ? styles.filterButtonActive : {})
            }}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>
    </div>
  );
};
