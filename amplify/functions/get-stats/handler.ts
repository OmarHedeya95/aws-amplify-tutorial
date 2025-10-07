import type { Schema } from "../../data/resource";
import { Amplify } from 'aws-amplify';
import { generateClient } from 'aws-amplify/data';
import { env } from '$amplify/env/get-stats';

// Configure Amplify
Amplify.configure(
  {
    API: {
      GraphQL: {
        endpoint: env.AMPLIFY_DATA_GRAPHQL_ENDPOINT,
        region: env.AWS_REGION,
        defaultAuthMode: 'iam'
      }
    }
  },
  {
    Auth: {
      credentialsProvider: {
        getCredentialsAndIdentityId: async () => ({
          credentials: {
            accessKeyId: env.AWS_ACCESS_KEY_ID,
            secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
            sessionToken: env.AWS_SESSION_TOKEN,
          },
        }),
        clearCredentialsAndIdentityId: () => {
          /* noop */
        },
      },
    },
  }
);

const client = generateClient<Schema>({
  authMode: 'iam',
});

/**
 * Calculate statistics across all todos
 * 
 * Returns:
 * - Total count
 * - Completed count
 * - Incomplete count
 * - Priority distribution
 * 
 * @param event - API Gateway event
 * @returns Statistics object
 */
export const handler = async (event: any) => {
  console.log('Event received:', JSON.stringify(event, null, 2));

  try {
    // Fetch all todos for the user
    const { data: todos } = await client.models.Todo.list();

    // Calculate statistics
    const stats = {
      total: todos.length,
      completed: todos.filter(t => t.done).length,
      incomplete: todos.filter(t => !t.done).length,
      byPriority: {
        high: todos.filter(t => t.priority === 'high').length,
        medium: todos.filter(t => t.priority === 'medium').length,
        low: todos.filter(t => t.priority === 'low').length,
      },
      completionRate: todos.length > 0 
        ? Math.round((todos.filter(t => t.done).length / todos.length) * 100) 
        : 0,
    };

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({ 
        success: true, 
        stats 
      }),
    };
  } catch (error: any) {
    console.error('Error calculating stats:', error);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({ 
        success: false, 
        error: error.message || 'Internal server error'
      }),
    };
  }
};