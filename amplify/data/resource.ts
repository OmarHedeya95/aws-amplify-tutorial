import { type ClientSchema, a, defineData } from '@aws-amplify/backend';

/**
 * Define your DynamoDB data model
 * 
 * This schema defines:
 * - Todo: Individual todo items
 * - Authorization: Only the owner can read/write their todos
 * 
 * The schema is type-safe and generates TypeScript types automatically
 */
const schema = a.schema({
  // Define the Todo model - maps to a DynamoDB table
  Todo: a
    .model({
      content: a.string().required(), // The todo text
      done: a.boolean().default(false), // Completion status
      priority: a.enum(['low', 'medium', 'high']).default('medium'), // Priority level
      createdAt: a.datetime(), // When it was created
      updatedAt: a.datetime(), // When it was last updated
    })
    // Authorization rules: only the owner can access their todos
    .authorization((allow) => [allow.owner()]),
});

// Export the schema type for use in the app
export type Schema = ClientSchema<typeof schema>;

/**
 * Configure the data resource
 * Uses Amazon Cognito User Pools for authentication
 */
export const data = defineData({
  schema,
  authorizationModes: {
    defaultAuthorizationMode: 'userPool', // Use Cognito for auth
  },
});