import React from 'react';
import styles from './ProjectCard.module.css';

const ProjectCard = ({ project, onClick }) => {
  return (
    <div
      className={styles.card}
      onClick={onClick}
      aria-label={`View ${project.title} project`}
      role="button"
      tabIndex="0"
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          onClick();
        }
      }}
    >
      <div className={styles.icon}>{project.icon}</div>
      <h3 className={styles.title}>{project.title}</h3>
      <p className={styles.description}>{project.description}</p>
      <span className={styles.category}>{project.category}</span>
    </div>
  );
};

export default ProjectCard;