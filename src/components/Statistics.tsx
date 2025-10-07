import React from 'react';
import type { Schema } from '../../amplify/data/resource';
import './Statistics.css';

interface StatisticsProps {
  todos: Array<Schema["Todo"]["type"]>;
}

/**
 * Statistics Component
 * 
 * Displays:
 * - Total todo count
 * - Completed vs incomplete
 * - Priority distribution
 * - Completion rate
 */
const Statistics: React.FC<StatisticsProps> = ({ todos }) => {
  const total = todos.length;
  const completed = todos.filter(t => t.done).length;
  const incomplete = total - completed;
  const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

  const byPriority = {
    high: todos.filter(t => t.priority === 'high').length,
    medium: todos.filter(t => t.priority === 'medium').length,
    low: todos.filter(t => t.priority === 'low').length,
  };

  return (
    <div className="statistics">
      <h2>📊 Statistics</h2>
      
      <div className="stats-grid">
        <div className="stat-card total">
          <div className="stat-value">{total}</div>
          <div className="stat-label">Total Todos</div>
        </div>

        <div className="stat-card completed">
          <div className="stat-value">{completed}</div>
          <div className="stat-label">Completed</div>
        </div>

        <div className="stat-card incomplete">
          <div className="stat-value">{incomplete}</div>
          <div className="stat-label">In Progress</div>
        </div>

        <div className="stat-card rate">
          <div className="stat-value">{completionRate}%</div>
          <div className="stat-label">Completion Rate</div>
        </div>
      </div>

      <div className="priority-breakdown">
        <h3>Priority Distribution</h3>
        <div className="priority-bars">
          <div className="priority-bar">
            <span className="priority-label">🔴 High</span>
            <div className="bar-container">
              <div 
                className="bar high" 
                style={{ width: total > 0 ? `${(byPriority.high / total) * 100}%` : '0%' }}
              />
            </div>
            <span className="priority-count">{byPriority.high}</span>
          </div>

          <div className="priority-bar">
            <span className="priority-label">🟡 Medium</span>
            <div className="bar-container">
              <div 
                className="bar medium" 
                style={{ width: total > 0 ? `${(byPriority.medium / total) * 100}%` : '0%' }}
              />
            </div>
            <span className="priority-count">{byPriority.medium}</span>
          </div>

          <div className="priority-bar">
            <span className="priority-label">🟢 Low</span>
            <div className="bar-container">
              <div 
                className="bar low" 
                style={{ width: total > 0 ? `${(byPriority.low / total) * 100}%` : '0%' }}
              />
            </div>
            <span className="priority-count">{byPriority.low}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Statistics;