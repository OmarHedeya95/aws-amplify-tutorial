import type { Schema } from "../../data/resource";
import { Amplify } from 'aws-amplify';
import { generateClient } from 'aws-amplify/data';
import { env } from '$amplify/env/process-todo';

// Configure Amplify with environment variables
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

// Create a data client for DynamoDB operations
const client = generateClient<Schema>({
  authMode: 'iam',
});

/**
 * Lambda function handler
 * 
 * Handles todo processing operations:
 * - complete: Mark a todo as done
 * - delete: Remove a todo
 * - batch-complete: Complete multiple todos
 * 
 * @param event - API Gateway event with action and todoId(s)
 * @returns Success response or error
 */
export const handler = async (event: any) => {
  console.log('Event received:', JSON.stringify(event, null, 2));

  try {
    const body = JSON.parse(event.body || '{}');
    const { action, todoId, todoIds } = body;

    switch (action) {
      case 'complete':
        // Mark a single todo as complete
        if (!todoId) {
          throw new Error('todoId is required for complete action');
        }
        await client.models.Todo.update({
          id: todoId,
          done: true,
          updatedAt: new Date().toISOString(),
        });
        return {
          statusCode: 200,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
          body: JSON.stringify({ 
            success: true, 
            message: 'Todo marked as complete',
            todoId 
          }),
        };

      case 'delete':
        // Delete a single todo
        if (!todoId) {
          throw new Error('todoId is required for delete action');
        }
        await client.models.Todo.delete({ id: todoId });
        return {
          statusCode: 200,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
          body: JSON.stringify({ 
            success: true, 
            message: 'Todo deleted',
            todoId 
          }),
        };

      case 'batch-complete':
        // Complete multiple todos at once
        if (!todoIds || !Array.isArray(todoIds)) {
          throw new Error('todoIds array is required for batch-complete action');
        }
        
        const results = await Promise.all(
          todoIds.map(id => 
            client.models.Todo.update({
              id,
              done: true,
              updatedAt: new Date().toISOString(),
            })
          )
        );

        return {
          statusCode: 200,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
          body: JSON.stringify({ 
            success: true, 
            message: `${results.length} todos marked as complete`,
            count: results.length
          }),
        };

      default:
        throw new Error(`Unknown action: ${action}`);
    }
  } catch (error: any) {
    console.error('Error processing todo:', error);
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