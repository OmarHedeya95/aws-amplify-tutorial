import React from 'react';
import type { Schema } from '../../amplify/data/resource';
import './TodoItem.css';

interface TodoItemProps {
  todo: Schema["Todo"]["type"];
  onToggle: (id: string, currentStatus: boolean) => void;
  onDelete: (id: string) => void;
  onUpdatePriority: (id: string, priority: 'low' | 'medium' | 'high') => void;
}

/**
 * TodoItem Component
 * 
 * Displays a single todo with:
 * - Checkbox to toggle completion
 * - Priority indicator and selector
 * - Delete button
 * - Timestamp
 */
const TodoItem: React.FC<TodoItemProps> = ({
  todo,
  onToggle,
  onDelete,
  onUpdatePriority,
}) => {
  const priorityColors = {
    high: '#ff4757',
    medium: '#ffa502',
    low: '#2ed573',
  };

  const priorityLabels = {
    high: '🔴 High',
    medium: '🟡 Medium',
    low: '🟢 Low',
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <div className={`todo-item ${todo.done ? 'completed' : ''}`}>
      <div className="todo-content">
        <div className="todo-main">
          <input
            type="checkbox"
            checked={todo.done || false}
            onChange={() => onToggle(todo.id, todo.done || false)}
            className="todo-checkbox"
          />
          
          <div className="todo-text">
            <p className={todo.done ? 'strikethrough' : ''}>{todo.content}</p>
            <span className="todo-date">{formatDate(todo.createdAt)}</span>
          </div>
        </div>

        <div className="todo-actions">
          <select
            value={todo.priority || 'medium'}
            onChange={(e) => onUpdatePriority(todo.id, e.target.value as 'low' | 'medium' | 'high')}
            className="priority-badge"
            style={{ 
              borderColor: priorityColors[todo.priority || 'medium'],
              color: priorityColors[todo.priority || 'medium']
            }}
            disabled={todo.done}
          >
            <option value="high">🔴 High</option>
            <option value="medium">🟡 Medium</option>
            <option value="low">🟢 Low</option>
          </select>

          <button
            onClick={() => onDelete(todo.id)}
            className="delete-btn"
            aria-label="Delete todo"
          >
            🗑️
          </button>
        </div>
      </div>
    </div>
  );
};

export default TodoItem;