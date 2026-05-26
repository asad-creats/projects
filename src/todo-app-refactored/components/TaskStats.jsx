import React from 'react';
import { styles } from '../styles/styles';
import { theme } from '../styles/theme';
import { SkeletonLoader } from './SkeletonLoader';

export const TaskStats = ({ stats, loading = false }) => {
  if (loading) {
    return (
      <div style={styles.statsGrid}>
        {[0, 1, 2, 3].map((i) => (
          <div style={styles.statCard} key={i}>
            <SkeletonLoader type="statCard" style={{ height: '30px', width: '40px', margin: '0 auto 10px' }} />
            <SkeletonLoader type="statCard" style={{ height: '12px', width: '50px', margin: '0 auto' }} />
          </div>
        ))}
      </div>
    );
  }

  const cards = [
    { key: 'total', label: 'Total', value: stats.total, color: theme.accent },
    { key: 'completed', label: 'Completed', value: stats.completed, color: theme.success },
    { key: 'pending', label: 'Pending', value: stats.pending, color: theme.warning },
    {
      key: 'overdue',
      label: 'Overdue',
      value: stats.overdue,
      color: stats.overdue > 0 ? theme.danger : theme.textSecondary,
      alert: stats.overdue > 0,
    },
  ];

  return (
    <div style={styles.statsGrid}>
      {cards.map((c) => (
        <div
          key={c.key}
          style={{
            ...styles.statCard,
            borderColor: c.alert ? theme.danger : theme.border,
          }}
        >
          {/* top accent bar */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '3px',
              background: c.color,
              opacity: c.alert ? 0.9 : 0.55,
            }}
          />
          <div style={{ ...styles.statValue, color: c.color }}>{c.value}</div>
          <div style={styles.statLabel}>{c.label}</div>
        </div>
      ))}
    </div>
  );
};
