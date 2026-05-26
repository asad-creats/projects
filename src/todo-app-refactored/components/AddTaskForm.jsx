import React from 'react';
import { Icon } from './TallyIcons';

const CATEGORIES = ['General', 'Work', 'Personal', 'Shopping', 'Health', 'Learning'];

export const AddTaskForm = ({
  newTaskText,
  setNewTaskText,
  newTaskDate,
  setNewTaskDate,
  newTaskCategory,
  setNewTaskCategory,
  onSubmit,
}) => {
  return (
    <form className="composer" onSubmit={onSubmit}>
      <div className="plus"><Icon.plus style={{ width: 14, height: 14 }} /></div>
      <input
        className="title"
        value={newTaskText}
        onChange={(e) => setNewTaskText(e.target.value)}
        placeholder="Add a task… e.g. “Email Marcus tomorrow about Q3 budget”"
      />
      <div className="chips">
        <label className="chip-input" title="Due date">
          <Icon.calendar style={{ width: 11, height: 11 }} />
          <input
            type="date"
            value={newTaskDate}
            onChange={(e) => setNewTaskDate(e.target.value)}
            style={{ background: 'transparent', border: 0, color: 'inherit', outline: 0, font: 'inherit', width: 120, colorScheme: 'dark' }}
          />
        </label>
        <select
          className="chip-input"
          value={newTaskCategory}
          onChange={(e) => setNewTaskCategory(e.target.value)}
          title="Category"
          style={{ appearance: 'none' }}
        >
          {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <button type="submit" className="add-btn" disabled={!newTaskText.trim()}>
          Add task <span className="k mono">↵</span>
        </button>
      </div>
    </form>
  );
};
