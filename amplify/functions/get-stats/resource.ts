import { defineFunction } from '@aws-amplify/backend';

/**
 * Define the Lambda function for calculating statistics
 * 
 * This function provides analytics:
 * - Total number of todos
 * - Completed vs incomplete count
 * - Priority distribution
 */
export const getStats = defineFunction({
  name: 'get-stats',
  entry: './handler.ts',
});