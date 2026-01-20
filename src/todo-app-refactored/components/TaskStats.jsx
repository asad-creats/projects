import React from 'react';
import { styles } from '../styles/styles';
import { theme } from '../styles/theme';

export const TaskStats = ({ stats }) => {
  return (
    <div style={styles.statsGrid}>
      <div style={styles.statCard}>
        <div style={styles.statValue}>{stats.total}</div>
        <div style={styles.statLabel}>Total</div>
      </div>
      <div style={styles.statCard}>
        <div style={styles.statValue}>{stats.completed}</div>
        <div style={styles.statLabel}>Completed</div>
      </div>
      <div style={styles.statCard}>
        <div style={styles.statValue}>{stats.pending}</div>
        <div style={styles.statLabel}>Pending</div>
      </div>
      <div style={{...styles.statCard, borderColor: stats.overdue > 0 ? theme.danger : theme.border}}>
        <div style={{...styles.statValue, color: stats.overdue > 0 ? theme.danger : theme.text}}>
          {stats.overdue}
        </div>
        <div style={styles.statLabel}>Overdue</div>
      </div>
    </div>
  );
};
