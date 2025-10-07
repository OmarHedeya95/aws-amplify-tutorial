import { defineAuth } from '@aws-amplify/backend';

/**
 * Define and configure your auth resource
 * This sets up Amazon Cognito for user authentication
 * 
 * Features:
 * - Email-based login
 * - Password requirements
 * - Email verification
 * - Self-service password reset
 */
export const auth = defineAuth({
  loginWith: {
    email: true, // Allow users to sign in with email
  },
  // Configure password policy
  userAttributes: {
    email: {
      required: true,
      mutable: true,
    },
    name: {
      required: false,
      mutable: true,
    },
  },
});