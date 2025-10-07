import { defineFunction } from '@aws-amplify/backend';

/**
 * Define the Lambda function for processing todo operations
 * 
 * This function handles:
 * - Marking todos as complete
 * - Deleting todos
 * - Batch operations
 */
export const processTodo = defineFunction({
  name: 'process-todo',
  // Specify the entry point
  entry: './handler.ts',
});