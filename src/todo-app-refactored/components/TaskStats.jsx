import React from 'react';
import { styles } from '../styles/styles';
import { theme } from '../styles/theme';
import { SkeletonLoader } from './SkeletonLoader';

export const TaskStats = ({ stats, loading = false }) => {
  if (loading) {
    return (
      <div style={styles.statsGrid}>
        <div style={styles.statCard}>
          <SkeletonLoader type="statCard" style={{ height: '30px', width: '40px', margin: '0 auto 10px' }} />
          <SkeletonLoader type="statCard" style={{ height: '12px', width: '50px', margin: '0 auto' }} />
        </div>
        <div style={styles.statCard}>
          <SkeletonLoader type="statCard" style={{ height: '30px', width: '40px', margin: '0 auto 10px' }} />
          <SkeletonLoader type="statCard" style={{ height: '12px', width: '50px', margin: '0 auto' }} />
        </div>
        <div style={styles.statCard}>
          <SkeletonLoader type="statCard" style={{ height: '30px', width: '40px', margin: '0 auto 10px' }} />
          <SkeletonLoader type="statCard" style={{ height: '12px', width: '50px', margin: '0 auto' }} />
        </div>
        <div style={styles.statCard}>
          <SkeletonLoader type="statCard" style={{ height: '30px', width: '40px', margin: '0 auto 10px' }} />
          <SkeletonLoader type="statCard" style={{ height: '12px', width: '50px', margin: '0 auto' }} />
        </div>
      </div>
    );
  }

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
