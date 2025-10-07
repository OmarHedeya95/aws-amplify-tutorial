import React, { useState } from 'react';
import type { Schema } from '../../amplify/data/resource';
import TodoItem from './TodoItem';
import './TodoList.css';

interface TodoListProps {
  todos: Array<Schema["Todo"]["type"]>;
  onCreateTodo: (content: string, priority: 'low' | 'medium' | 'high') => void;
  onToggleTodo: (id: string, currentStatus: boolean) => void;
  onDeleteTodo: (id: string) => void;
  onUpdatePriority: (id: string, priority: 'low' | 'medium' | 'high') => void;
}

/**
 * TodoList Component
 * 
 * Displays all todos and provides a form to create new ones
 */
const TodoList: React.FC<TodoListProps> = ({
  todos,
  onCreateTodo,
  onToggleTodo,
  onDeleteTodo,
  onUpdatePriority,
}) => {
  const [newTodo, setNewTodo] = useState('');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newTodo.trim()) {
      onCreateTodo(newTodo.trim(), priority);
      setNewTodo('');
      setPriority('medium');
    }
  };

  // Sort todos: incomplete first, then by priority, then by date
  const sortedTodos = [...todos].sort((a, b) => {
    if (a.done !== b.done) {
      return a.done ? 1 : -1;
    }
    
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    const aPriority = priorityOrder[a.priority || 'medium'];
    const bPriority = priorityOrder[b.priority || 'medium'];
    
    if (aPriority !== bPriority) {
      return aPriority - bPriority;
    }
    
    return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
  });

  return (
    <div className="todo-list-container">
      <form onSubmit={handleSubmit} className="todo-form">
        <div className="input-group">
          <input
            type="text"
            value={newTodo}
            onChange={(e) => setNewTodo(e.target.value)}
            placeholder="What needs to be done?"
            className="todo-input"
          />
          
          <select
            value={priority}
            onChange={(e) => setPriority(e.target.value as 'low' | 'medium' | 'high')}
            className="priority-select"
          >
            <option value="low">Low Priority</option>
            <option value="medium">Medium Priority</option>
            <option value="high">High Priority</option>
          </select>
          
          <button type="submit" className="add-btn">
            Add Todo
          </button>
        </div>
      </form>

      <div className="todos-wrapper">
        {sortedTodos.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📝</div>
            <h3>No todos yet</h3>
            <p>Add your first todo to get started!</p>
          </div>
        ) : (
          <div className="todos-grid">
            {sortedTodos.map((todo) => (
              <TodoItem
                key={todo.id}
                todo={todo}
                onToggle={onToggleTodo}
                onDelete={onDeleteTodo}
                onUpdatePriority={onUpdatePriority}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default TodoList;