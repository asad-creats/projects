import React from 'react';

export const TaskStats = ({ today = 0, completed = 0, inProgress = 0, overdue = 0, completionPct = 0 }) => (
  <div className="stats">
    <div className="stat">
      <div className="k">Today</div>
      <div className="v">
        <span className="num tnum">{today}</span>
        <span className="delta">{completionPct}% done</span>
      </div>
      <div className="bar"><i style={{ width: completionPct + '%' }} /></div>
    </div>
    <div className="stat is-good">
      <div className="k">Completed</div>
      <div className="v">
        <span className="num tnum">{completed}</span>
        <span className="delta">all time</span>
      </div>
    </div>
    <div className="stat">
      <div className="k">In progress</div>
      <div className="v">
        <span className="num tnum">{Math.max(0, inProgress)}</span>
        <span className="delta">active</span>
      </div>
    </div>
    <div className={`stat ${overdue > 0 ? 'is-warn' : ''}`}>
      <div className="k">Overdue</div>
      <div className="v">
        <span className="num tnum">{overdue}</span>
        <span className="delta">{overdue > 0 ? 'needs attention' : 'all clear'}</span>
      </div>
    </div>
  </div>
);
