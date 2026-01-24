import React from 'react';

export const SkeletonLoader = ({ type = 'default', style = {} }) => {
  const skeletonStyles = {
    default: {
      background: 'linear-gradient(90deg, rgba(100, 116, 139, 0.1) 25%, rgba(100, 116, 139, 0.2) 50%, rgba(100, 116, 139, 0.1) 75%)',
      backgroundSize: '200% 100%',
      animation: 'skeleton-loading 1.5s infinite',
      ...style
    },
    statCard: {
      height: '80px',
      borderRadius: '12px',
      background: 'linear-gradient(90deg, rgba(100, 116, 139, 0.1) 25%, rgba(100, 116, 139, 0.2) 50%, rgba(100, 116, 139, 0.1) 75%)',
      backgroundSize: '200% 100%',
      animation: 'skeleton-loading 1.5s infinite',
      ...style
    },
    taskCard: {
      height: '80px',
      borderRadius: '12px',
      background: 'linear-gradient(90deg, rgba(100, 116, 139, 0.1) 25%, rgba(100, 116, 139, 0.2) 50%, rgba(100, 116, 139, 0.1) 75%)',
      backgroundSize: '200% 100%',
      animation: 'skeleton-loading 1.5s infinite',
      ...style
    }
  };

  return <div style={skeletonStyles[type]} />;
};