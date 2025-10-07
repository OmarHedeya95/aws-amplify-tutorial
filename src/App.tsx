import React, { useEffect, useState } from 'react';
import { Amplify } from 'aws-amplify';
import { generateClient } from 'aws-amplify/data';
import { Authenticator } from '@aws-amplify/ui-react';
import '@aws-amplify/ui-react/styles.css';
import outputs from '../amplify_outputs.json';
import type { Schema } from '../amplify/data/resource';
import TodoList from './components/TodoList';
import Statistics from './components/Statistics';
import './App.css';

// Configure Amplify with backend outputs
Amplify.configure(outputs);

// Create a typed client for data operations
const client = generateClient<Schema>();

/**
 * Main App Component
 * 
 * Handles:
 * - User authentication with Amplify UI
 * - Fetching todos from DynamoDB
 * - Real-time subscriptions for live updates
 * - CRUD operations on todos
 */
function App() {
  const [todos, setTodos] = useState<Array<Schema["Todo"]["type"]>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch initial todos
    fetchTodos();

    // Set up real-time subscription for live updates
    const subscription = client.models.Todo.observeQuery().subscribe({
      next: (data) => {
        console.log('Real-time update received');
        setTodos([...data.items]);
      },
      error: (error) => {
        console.error('Subscription error:', error);
      }
    });

    // Cleanup subscription on unmount
    return () => subscription.unsubscribe();
  }, []);

  /**
   * Fetch all todos from DynamoDB
   */
  const fetchTodos = async () => {
    try {
      setLoading(true);
      const { data: items, errors } = await client.models.Todo.list();
      
      if (errors) {
        console.error('Errors fetching todos:', errors);
      }
      
      setTodos(items);
    } catch (error) {
      console.error('Error fetching todos:', error);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Create a new todo
   */
  const createTodo = async (content: string, priority: 'low' | 'medium' | 'high' = 'medium') => {
    try {
      const now = new Date().toISOString();
      await client.models.Todo.create({
        content,
        priority,
        done: false,
        createdAt: now,
        updatedAt: now,
      });
    } catch (error) {
      console.error('Error creating todo:', error);
    }
  };

  /**
   * Toggle todo completion status
   */
  const toggleTodo = async (id: string, currentStatus: boolean) => {
    try {
      await client.models.Todo.update({
        id,
        done: !currentStatus,
        updatedAt: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Error updating todo:', error);
    }
  };

  /**
   * Delete a todo
   */
  const deleteTodo = async (id: string) => {
    try {
      await client.models.Todo.delete({ id });
    } catch (error) {
      console.error('Error deleting todo:', error);
    }
  };

  /**
   * Update todo priority
   */
  const updatePriority = async (id: string, priority: 'low' | 'medium' | 'high') => {
    try {
      await client.models.Todo.update({
        id,
        priority,
        updatedAt: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Error updating priority:', error);
    }
  };

  return (
    <Authenticator>
      {({ signOut, user }) => (
        <div className="app">
          <header className="app-header">
            <div className="header-content">
              <h1>📝 AWS Amplify Todo App</h1>
              <p className="subtitle">React + Lambda + DynamoDB</p>
              <div className="user-info">
                <span>Welcome, {user?.signInDetails?.loginId}</span>
                <button onClick={signOut} className="sign-out-btn">
                  Sign Out
                </button>
              </div>
            </div>
          </header>

          <main className="app-main">
            <div className="container">
              <Statistics todos={todos} />
              
              {loading ? (
                <div className="loading">Loading todos...</div>
              ) : (
                <TodoList
                  todos={todos}
                  onCreateTodo={createTodo}
                  onToggleTodo={toggleTodo}
                  onDeleteTodo={deleteTodo}
                  onUpdatePriority={updatePriority}
                />
              )}
            </div>
          </main>

          <footer className="app-footer">
            <p>
              Built with AWS Amplify, Lambda, and DynamoDB 
              <span className="heart">❤️</span>
            </p>
          </footer>
        </div>
      )}
    </Authenticator>
  );
}

export default App;