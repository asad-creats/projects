import React from 'react';
import { styles } from '../styles/styles';
import { getTodayString } from '../utils/dateUtils';

export const AddTaskForm = ({ 
  newTaskText, 
  setNewTaskText, 
  newTaskDate, 
  setNewTaskDate, 
  newTaskCategory, 
  setNewTaskCategory,
  onSubmit 
}) => {
  return (
    <form onSubmit={onSubmit} style={styles.addTaskForm}>
      <div style={styles.addTaskHeader}>
        <span style={styles.addTaskTitle}>➕ Add New Task</span>
      </div>
      <div style={styles.addTaskInputs}>
        <input
          type="text"
          value={newTaskText}
          onChange={(e) => setNewTaskText(e.target.value)}
          placeholder="What needs to be done?"
          style={styles.taskInput}
          required
        />
        <div style={styles.taskMetaInputs}>
          <input
            type="date"
            value={newTaskDate}
            onChange={(e) => setNewTaskDate(e.target.value)}
            style={styles.dateInput}
            required
          />
          <select
            value={newTaskCategory}
            onChange={(e) => setNewTaskCategory(e.target.value)}
            style={styles.categoryInput}
          >
            <option value="General">General</option>
            <option value="Work">Work</option>
            <option value="Personal">Personal</option>
            <option value="Shopping">Shopping</option>
            <option value="Health">Health</option>
            <option value="Learning">Learning</option>
          </select>
          <button type="submit" style={styles.addTaskButton}>
            Add Task
          </button>
        </div>
      </div>
    </form>
  );
};
