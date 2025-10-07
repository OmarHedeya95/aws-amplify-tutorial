# AWS Amplify Architecture Deep Dive

This document explains the technical architecture and data flow of our AWS Amplify full-stack application, showing exactly how React, Lambda, and DynamoDB connect together.

---

## Table of Contents

1. [Complete Request Flow](#complete-request-flow)
2. [Authentication Flow](#authentication-flow)
3. [Data Operations](#data-operations)
4. [Real-Time Subscriptions](#real-time-subscriptions)
5. [Lambda Integration](#lambda-integration)
6. [IAM Permissions](#iam-permissions)
7. [Code Walkthrough](#code-walkthrough)

---

## Complete Request Flow

### When a User Creates a Todo

```
┌─────────────────────────────────────────────────────────────────┐
│ 1. USER CLICKS "ADD TODO"                                       │
└─────────────┬───────────────────────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────────────────────────────┐
│ 2. REACT COMPONENT (TodoList.tsx)                               │
│    - handleSubmit() is called                                   │
│    - Calls onCreateTodo(content, priority)                      │
└─────────────┬───────────────────────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────────────────────────────┐
│ 3. APP COMPONENT (App.tsx)                                      │
│    - createTodo() function executes                             │
│    - Calls: client.models.Todo.create({...})                    │
└─────────────┬───────────────────────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────────────────────────────┐
│ 4. AMPLIFY DATA CLIENT                                          │
│    - Serializes data to GraphQL mutation                        │
│    - Adds authentication token from Cognito                     │
│    - Sends HTTPS request to AppSync endpoint                    │
└─────────────┬───────────────────────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────────────────────────────┐
│ 5. AWS APPSYNC (GraphQL API)                                    │
│    - Receives mutation: createTodo                              │
│    - Validates authentication token                             │
│    - Checks authorization rules (owner-based)                   │
│    - Executes resolver                                          │
└─────────────┬───────────────────────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────────────────────────────┐
│ 6. DYNAMODB                                                      │
│    - Receives PutItem request                                   │
│    - Stores item with:                                          │
│      * Partition Key: id (auto-generated UUID)                  │
│      * Owner: user's Cognito sub (from token)                   │
│      * Content, priority, done, timestamps                      │
│    - Returns success                                            │
└─────────────┬───────────────────────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────────────────────────────┐
│ 7. APPSYNC PUBLISHES TO SUBSCRIBERS                             │
│    - Identifies active subscriptions for this user              │
│    - Sends real-time update via WebSocket                       │
└─────────────┬───────────────────────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────────────────────────────┐
│ 8. REACT APP RECEIVES UPDATE                                    │
│    - observeQuery() subscription callback fires                 │
│    - Updates state: setTodos([...data.items])                   │
│    - React re-renders with new todo visible                     │
└─────────────────────────────────────────────────────────────────┘
```

**Time: Typically 200-500ms end-to-end**

---

## Authentication Flow

### Sign Up Process

```typescript
// 1. User fills out sign-up form in Amplify Authenticator component
// 2. Authenticator calls Cognito API

POST https://cognito-idp.{region}.amazonaws.com/
{
  "AuthFlow": "USER_SRP_AUTH",
  "ClientId": "your-app-client-id",
  "UserPoolId": "your-user-pool-id",
  "Username": "user@example.com",
  "Password": "SecurePassword123!",
  "UserAttributes": [
    { "Name": "email", "Value": "user@example.com" }
  ]
}

// 3. Cognito creates user and sends verification email
// 4. User verifies email with code
// 5. User can now sign in
```

### Sign In Process

```typescript
// 1. User enters credentials
// 2. Authenticator initiates SRP (Secure Remote Password) flow

// Step 1: Initial authentication request
POST https://cognito-idp.{region}.amazonaws.com/
{
  "AuthFlow": "USER_SRP_AUTH",
  "AuthParameters": {
    "USERNAME": "user@example.com",
    "SRP_A": "{calculated_value}"
  }
}

// Step 2: Cognito responds with challenge
Response: {
  "ChallengeName": "PASSWORD_VERIFIER",
  "ChallengeParameters": { "SRP_B": "{value}", ... }
}

// Step 3: Client responds to challenge with password proof
POST https://cognito-idp.{region}.amazonaws.com/
{
  "ChallengeName": "PASSWORD_VERIFIER",
  "ChallengeResponses": {
    "PASSWORD_CLAIM_SECRET_BLOCK": "{value}",
    "PASSWORD_CLAIM_SIGNATURE": "{value}",
    "USERNAME": "user@example.com"
  }
}

// Step 4: Cognito validates and returns tokens
Response: {
  "AuthenticationResult": {
    "AccessToken": "eyJraWQiOiJ...",  // Valid for 1 hour
    "IdToken": "eyJraWQiOiJ...",      // Contains user attributes
    "RefreshToken": "eyJjdHkiOiJ...", // Valid for 30 days
    "ExpiresIn": 3600
  }
}
```

### How Tokens Are Used

```typescript
// Every API request includes the IdToken:
POST https://your-appsync-api.com/graphql
Headers: {
  "Authorization": "Bearer eyJraWQiOiJ..."  // IdToken
}

// AppSync extracts the user identity from the token:
// Token payload contains:
{
  "sub": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",  // User ID
  "email": "user@example.com",
  "cognito:username": "user@example.com"
  // ... other claims
}

// This "sub" becomes the "owner" field in DynamoDB
// Authorization rule: allow.owner() means only items 
// where owner === token.sub can be accessed
```

---

## Data Operations

### Schema to DynamoDB Table Mapping

Our schema in `amplify/data/resource.ts`:

```typescript
Todo: a.model({
  content: a.string().required(),
  done: a.boolean().default(false),
  priority: a.enum(['low', 'medium', 'high']).default('medium'),
  createdAt: a.datetime(),
  updatedAt: a.datetime(),
}).authorization((allow) => [allow.owner()])
```

**Becomes this DynamoDB table:**

```
Table Name: Todo-{environment-id}

Primary Key:
  - Partition Key: id (String)

Global Secondary Index (GSI):
  - Index Name: byOwner
  - Partition Key: owner (String)
  - Sort Key: createdAt (String)

Attributes:
  - id: String (UUID, e.g., "a1b2c3d4-...")
  - owner: String (Cognito sub, e.g., "a1b2c3d4-...")
  - content: String
  - done: Boolean
  - priority: String (one of: low, medium, high)
  - createdAt: String (ISO 8601 datetime)
  - updatedAt: String (ISO 8601 datetime)
  - __typename: String (always "Todo")
  - _version: Number (for conflict resolution)
  - _deleted: Boolean (for soft deletes)
  - _lastChangedAt: Number (timestamp)
```

### GraphQL Operations Generated

Amplify auto-generates these GraphQL operations:

#### Mutations

```graphql
# Create
mutation CreateTodo($input: CreateTodoInput!) {
  createTodo(input: $input) {
    id
    content
    done
    priority
    createdAt
    updatedAt
    owner
  }
}

# Update
mutation UpdateTodo($input: UpdateTodoInput!) {
  updateTodo(input: $input) {
    id
    content
    done
    priority
    updatedAt
    owner
  }
}

# Delete
mutation DeleteTodo($input: DeleteTodoInput!) {
  deleteTodo(input: $input) {
    id
  }
}
```

#### Queries

```graphql
# Get single item
query GetTodo($id: ID!) {
  getTodo(id: $id) {
    id
    content
    done
    priority
    createdAt
    updatedAt
    owner
  }
}

# List items (with owner filter automatically applied)
query ListTodos($filter: ModelTodoFilterInput, $limit: Int, $nextToken: String) {
  listTodos(filter: $filter, limit: $limit, nextToken: $nextToken) {
    items {
      id
      content
      done
      priority
      createdAt
      updatedAt
      owner
    }
    nextToken
  }
}
```

#### Subscriptions

```graphql
# Real-time updates
subscription OnCreateTodo($owner: String!) {
  onCreateTodo(owner: $owner) {
    id
    content
    done
    priority
    createdAt
    updatedAt
    owner
  }
}

subscription OnUpdateTodo($owner: String!) {
  onUpdateTodo(owner: $owner) {
    id
    content
    done
    priority
    updatedAt
    owner
  }
}

subscription OnDeleteTodo($owner: String!) {
  onDeleteTodo(owner: $owner) {
    id
  }
}
```

### How React Code Maps to GraphQL

```typescript
// React: client.models.Todo.create({...})
// Becomes GraphQL mutation:
mutation {
  createTodo(input: {
    content: "Learn Amplify",
    priority: "high",
    done: false,
    createdAt: "2025-10-07T18:00:00.000Z",
    updatedAt: "2025-10-07T18:00:00.000Z"
  }) {
    id
    content
    done
    priority
    createdAt
    updatedAt
    owner
  }
}

// React: client.models.Todo.list()
// Becomes GraphQL query:
query {
  listTodos {
    items {
      id
      content
      done
      priority
      createdAt
      updatedAt
      owner
    }
  }
}

// React: client.models.Todo.update({id, done: true})
// Becomes GraphQL mutation:
mutation {
  updateTodo(input: {
    id: "a1b2c3d4-...",
    done: true,
    updatedAt: "2025-10-07T18:01:00.000Z"
  }) {
    id
    done
    updatedAt
  }
}
```

---

## Real-Time Subscriptions

### How observeQuery() Works

```typescript
// In App.tsx:
const subscription = client.models.Todo.observeQuery().subscribe({
  next: (data) => setTodos([...data.items]),
});
```

**Behind the scenes:**

```
1. Initial Connection
   ├─ Client opens WebSocket to AppSync
   ├─ Sends authentication token
   └─ AppSync validates and maintains connection

2. Subscription Registration
   ├─ Client sends subscription GraphQL over WebSocket
   ├─ Subscribes to: onCreateTodo, onUpdateTodo, onDeleteTodo
   └─ Filters by owner (current user's Cognito sub)

3. Initial Data Fetch
   ├─ Executes listTodos query
   ├─ Returns current items
   └─ Calls next() callback with initial data

4. Live Updates
   ├─ Any mutation (create/update/delete) triggers subscription
   ├─ AppSync pushes update through WebSocket
   ├─ Client receives update
   ├─ Merges with local state
   └─ Calls next() callback with updated data
```

### WebSocket Communication Example

```javascript
// 1. WebSocket connection established
wss://your-appsync-api.appsync-realtime-api.{region}.amazonaws.com/graphql

// 2. Client sends subscription
{
  "type": "start",
  "id": "subscription-1",
  "payload": {
    "query": "subscription { onCreateTodo(owner: \"user-sub\") { id content ... } }",
    "variables": {},
    "extensions": {
      "authorization": {
        "Authorization": "Bearer eyJraWQiOiJ..."
      }
    }
  }
}

// 3. Server acknowledges
{
  "type": "start_ack",
  "id": "subscription-1"
}

// 4. When data changes, server pushes update
{
  "type": "data",
  "id": "subscription-1",
  "payload": {
    "data": {
      "onCreateTodo": {
        "id": "new-todo-id",
        "content": "New todo",
        "done": false,
        ...
      }
    }
  }
}

// 5. Client processes and updates UI automatically
```

---

## Lambda Integration

### How Lambda Functions Access DynamoDB

In `amplify/backend.ts`, we grant permissions:

```typescript
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
      `${todoTableName.tableArn}/index/*`,
    ],
  })
);
```

**This creates an IAM role:**

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "dynamodb:GetItem",
        "dynamodb:Query",
        "dynamodb:UpdateItem",
        "dynamodb:DeleteItem"
      ],
      "Resource": [
        "arn:aws:dynamodb:{region}:{account}:table/Todo-{env}",
        "arn:aws:dynamodb:{region}:{account}:table/Todo-{env}/index/*"
      ]
    },
    {
      "Effect": "Allow",
      "Action": [
        "logs:CreateLogGroup",
        "logs:CreateLogStream",
        "logs:PutLogEvents"
      ],
      "Resource": "arn:aws:logs:{region}:{account}:*"
    }
  ]
}
```

### Lambda Execution Environment

When a Lambda function runs:

```
1. AWS Lambda Service receives invocation
2. Checks if warm container exists
   ├─ YES: Reuses existing container
   └─ NO: Cold start - creates new container
3. Sets environment variables:
   ├─ AWS_ACCESS_KEY_ID (temporary credentials)
   ├─ AWS_SECRET_ACCESS_KEY (temporary credentials)
   ├─ AWS_SESSION_TOKEN (temporary credentials)
   ├─ AWS_REGION
   ├─ AMPLIFY_DATA_GRAPHQL_ENDPOINT
   └─ Custom environment variables
4. Loads function code
5. Executes handler function
6. Returns response
7. Container kept warm for ~15 minutes
```

### Lambda to DynamoDB Communication

```typescript
// In handler.ts:
const client = generateClient<Schema>({
  authMode: 'iam',
});

await client.models.Todo.update({
  id: todoId,
  done: true
});
```

**This translates to:**

```javascript
// 1. Amplify client constructs GraphQL mutation
const mutation = `
  mutation UpdateTodo($input: UpdateTodoInput!) {
    updateTodo(input: $input) {
      id done updatedAt
    }
  }
`;

// 2. Sends HTTPS request to AppSync
POST https://your-appsync-api.com/graphql
Headers: {
  "Authorization": "{IAM signature v4}",  // Signed with Lambda's IAM role
  "Content-Type": "application/json"
}
Body: {
  "query": mutation,
  "variables": {
    "input": {
      "id": "todo-id",
      "done": true,
      "updatedAt": "2025-10-07T18:00:00.000Z"
    }
  }
}

// 3. AppSync receives request
//    - Validates IAM signature
//    - Checks if Lambda role has necessary permissions
//    - Executes DynamoDB UpdateItem

// 4. DynamoDB updates item
UpdateItem {
  TableName: "Todo-{env}",
  Key: { "id": { S: "todo-id" } },
  UpdateExpression: "SET done = :done, updatedAt = :time",
  ExpressionAttributeValues: {
    ":done": { BOOL: true },
    ":time": { S: "2025-10-07T18:00:00.000Z" }
  }
}

// 5. Returns success to Lambda
// 6. Lambda returns success to caller
```

---

## IAM Permissions

### Permission Hierarchy

```
┌─────────────────────────────────────────┐
│ USER (Cognito Identity)                 │
│ Permissions:                            │
│ - Create/Read/Update/Delete own todos   │
│ - Cannot access other users' todos      │
└─────────────┬───────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────┐
│ APPSYNC API                             │
│ Permissions:                            │
│ - Execute DynamoDB operations           │
│ - Publish to subscriptions              │
│ - Invoke Lambda functions               │
└─────────────┬───────────────────────────┘
              │
              ├────────────────┐
              ▼                ▼
┌──────────────────┐  ┌─────────────────┐
│ LAMBDA FUNCTIONS │  │ DYNAMODB TABLE  │
│ Permissions:     │  │ Permissions:    │
│ - Read/Write     │  │ - Full access   │
│   DynamoDB       │  │   (if caller    │
│ - Write logs     │  │   authorized)   │
└──────────────────┘  └─────────────────┘
```

### Authorization Rule Explained

```typescript
.authorization((allow) => [allow.owner()])
```

**This creates a VTL (Velocity Template Language) resolver:**

```vtl
## Before accessing DynamoDB, check authorization
#set($owner = $ctx.identity.sub)  ## Get user ID from token

## For queries/mutations, add owner filter
#if($ctx.args.input)
  $util.qr($ctx.args.input.put("owner", $owner))
#end

## For list operations, filter by owner
#set($filter = {
  "owner": {
    "eq": $owner
  }
})
```

**In practice:**

```javascript
// User A (sub: user-a-123) creates a todo
// DynamoDB stores:
{
  "id": "todo-1",
  "content": "Todo A",
  "owner": "user-a-123"  // ← Automatically added
}

// User A lists todos
// Query automatically becomes:
listTodos(filter: { owner: { eq: "user-a-123" } })
// ✓ Returns todo-1

// User B (sub: user-b-456) lists todos
// Query automatically becomes:
listTodos(filter: { owner: { eq: "user-b-456" } })
// ✗ Does not return todo-1 (different owner)

// User B tries to update User A's todo
updateTodo(id: "todo-1", done: true)
// ✗ AppSync checks: item.owner !== ctx.identity.sub
// ✗ Returns: "Unauthorized" error
```

---

## Code Walkthrough

### Complete Flow: Adding a Todo

**Step 1: User Input (TodoList.tsx)**

```typescript
const handleSubmit = (e: React.FormEvent) => {
  e.preventDefault();
  if (newTodo.trim()) {
    onCreateTodo(newTodo.trim(), priority);  // ← Calls parent callback
    setNewTodo('');
    setPriority('medium');
  }
};
```

**Step 2: State Management (App.tsx)**

```typescript
const createTodo = async (content: string, priority: 'low' | 'medium' | 'high' = 'medium') => {
  try {
    const now = new Date().toISOString();
    
    // This is the key line - using Amplify Data client
    await client.models.Todo.create({
      content,           // User's input
      priority,          // Selected priority
      done: false,       // Default value
      createdAt: now,    // Current timestamp
      updatedAt: now,    // Current timestamp
      // owner is added automatically by AppSync
    });
    
    // No need to update state here!
    // The observeQuery subscription will do it automatically
  } catch (error) {
    console.error('Error creating todo:', error);
  }
};
```

**Step 3: Amplify Client Processing**

```typescript
// Inside aws-amplify library (simplified):
class Todo {
  async create(input: CreateTodoInput) {
    // 1. Validate input
    this.validateInput(input);
    
    // 2. Get auth token from storage
    const token = await Auth.currentSession().getIdToken().getJwtToken();
    
    // 3. Construct GraphQL mutation
    const mutation = `
      mutation CreateTodo($input: CreateTodoInput!) {
        createTodo(input: $input) {
          id content done priority createdAt updatedAt owner
        }
      }
    `;
    
    // 4. Send request to AppSync
    const response = await fetch(config.aws_appsync_graphqlEndpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: mutation,
        variables: { input }
      })
    });
    
    // 5. Return response
    return await response.json();
  }
}
```

**Step 4: AppSync Processing**

```javascript
// AppSync receives request and:

// 1. Validates JWT token
const decoded = jwt.verify(token, cognitoPublicKey);
// decoded = { sub: "user-a-123", email: "user@example.com", ... }

// 2. Executes resolver with authorization check
const owner = decoded.sub;
input.owner = owner;  // Add owner to input

// 3. Calls DynamoDB
dynamodb.putItem({
  TableName: 'Todo-prod',
  Item: {
    id: { S: uuid() },
    content: { S: input.content },
    done: { BOOL: input.done },
    priority: { S: input.priority },
    createdAt: { S: input.createdAt },
    updatedAt: { S: input.updatedAt },
    owner: { S: owner },  // ← Authorization field
    __typename: { S: 'Todo' }
  }
});

// 4. Publish to subscribers
subscription.publish('onCreateTodo', {
  owner: owner,
  data: { /* todo data */ }
});

// 5. Return success to client
```

**Step 5: Real-Time Update**

```typescript
// Meanwhile, observeQuery subscription receives the update:
client.models.Todo.observeQuery().subscribe({
  next: (data) => {
    // data.items contains all todos (including the new one)
    console.log('Received update:', data.items);
    setTodos([...data.items]);  // ← React state updates
    // React automatically re-renders UI
  }
});
```

---

## Key Takeaways

### 1. **No Direct DynamoDB Access from React**
Your React app never talks directly to DynamoDB. It always goes through AppSync (GraphQL API), which enforces authorization.

### 2. **Authorization is Enforced at Multiple Layers**
- Cognito: Validates user identity
- AppSync: Enforces owner-based access rules
- DynamoDB: Stores owner field for filtering
- IAM: Controls service-to-service permissions

### 3. **Real-Time is Built In**
GraphQL subscriptions over WebSocket provide instant updates without polling or additional setup.

### 4. **Lambda Functions Are Optional**
For simple CRUD, AppSync talks directly to DynamoDB. Use Lambda for:
- Complex business logic
- Batch operations
- Integration with other services
- Operations that don't map to GraphQL

### 5. **Type Safety End-to-End**
TypeScript types are generated from your schema, ensuring consistency from React → AppSync → DynamoDB.

---

## Further Reading

- [AWS AppSync Developer Guide](https://docs.aws.amazon.com/appsync/)
- [DynamoDB Best Practices](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/best-practices.html)
- [Lambda Function Best Practices](https://docs.aws.amazon.com/lambda/latest/dg/best-practices.html)
- [Cognito User Pools](https://docs.aws.amazon.com/cognito/latest/developerguide/cognito-user-identity-pools.html)
- [Amplify Gen 2 Documentation](https://docs.amplify.aws/gen2/)

---

**Understanding this architecture will help you build more complex full-stack applications with confidence!** 🚀