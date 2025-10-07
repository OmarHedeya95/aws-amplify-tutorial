import { defineBackend } from '@aws-amplify/backend';
import { auth } from './auth/resource';
import { data } from './data/resource';
import { processTodo } from './functions/process-todo/resource';
import { getStats } from './functions/get-stats/resource';
import { PolicyStatement } from 'aws-cdk-lib/aws-iam';

/**
 * Backend configuration
 * 
 * This file:
 * 1. Defines all backend resources (auth, data, functions)
 * 2. Sets up permissions between services
 * 3. Configures the infrastructure
 */
export const backend = defineBackend({
  auth,
  data,
  processTodo,
  getStats,
});

/**
 * Grant Lambda functions access to DynamoDB
 * 
 * The Lambda functions need IAM permissions to:
 * - Query items from DynamoDB tables
 * - Update items in DynamoDB tables
 * - Delete items from DynamoDB tables
 */
const todoTableName = backend.data.resources.tables['Todo'];

// Grant process-todo function permissions to access the Todo table
backend.processTodo.resources.lambda.addToRolePolicy(
  new PolicyStatement({
    actions: [
      'dynamodb:GetItem',
      'dynamodb:Query',
      'dynamodb:UpdateItem',
      'dynamodb:DeleteItem',
    ],
    resources: [
      todoTableName.tableArn,
      `${todoTableName.tableArn}/index/*`, // Include GSI access
    ],
  })
);

// Grant get-stats function permissions to scan the Todo table
backend.getStats.resources.lambda.addToRolePolicy(
  new PolicyStatement({
    actions: [
      'dynamodb:GetItem',
      'dynamodb:Query',
      'dynamodb:Scan', // Stats function needs to scan all items
    ],
    resources: [
      todoTableName.tableArn,
      `${todoTableName.tableArn}/index/*`,
    ],
  })
);

/**
 * Enable the data resource to invoke Lambda functions
 * This allows GraphQL resolvers to trigger Lambda functions
 */
backend.data.resources.cfnResources.cfnGraphqlApi.environmentVariables = {
  PROCESS_TODO_FUNCTION_ARN: backend.processTodo.resources.lambda.functionArn,
  GET_STATS_FUNCTION_ARN: backend.getStats.resources.lambda.functionArn,
};

// Grant the AppSync API permission to invoke Lambda functions
backend.processTodo.resources.lambda.grantInvoke(
  backend.data.resources.cfnResources.cfnGraphqlApi
);

backend.getStats.resources.lambda.grantInvoke(
  backend.data.resources.cfnResources.cfnGraphqlApi
);