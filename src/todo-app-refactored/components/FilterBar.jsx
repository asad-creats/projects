import React from 'react';

const TABS = [
  { id: 'all', label: 'All' },
  { id: 'active', label: 'Active' },
  { id: 'today', label: 'Today' },
  { id: 'overdue', label: 'Overdue' },
  { id: 'done', label: 'Completed' },
];

export const FilterBar = ({ filter, setFilter, counts = {} }) => (
  <div className="filterbar">
    <div className="filter-tabs">
      {TABS.map((t) => (
        <button
          key={t.id}
          className={`ft ${filter === t.id ? 'active' : ''}`}
          onClick={() => setFilter(t.id)}
        >
          {t.label} <span className="cnt tnum">{counts[t.id] ?? 0}</span>
        </button>
      ))}
    </div>
    <div className="right-tools">
      <span>Sort: <span style={{ color: 'var(--ink-2)' }}>Smart</span></span>
    </div>
  </div>
);
