# AWS Amplify Full-Stack Learning Example

A complete example application demonstrating how to build and deploy a full-stack web application using:
- **React** for the frontend
- **AWS Amplify** for hosting and backend management
- **AWS Lambda** for serverless API functions
- **Amazon DynamoDB** for data persistence

This is a learning project designed to help you understand how these AWS services connect together.

## 📋 What You'll Learn

- Setting up AWS Amplify Gen 2 with React
- Creating and configuring DynamoDB tables through Amplify
- Writing Lambda functions that interact with DynamoDB
- Implementing authentication with Amazon Cognito
- Deploying a full-stack application to AWS
- Setting up CI/CD with GitHub and Amplify

## 🏗️ Application Architecture

```
┌─────────────────┐
│  React Frontend │
│   (Amplify UI)  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  AWS Amplify    │
│   (Hosting +    │
│    Backend)     │
└────────┬────────┘
         │
         ├──────────► ┌──────────────┐
         │            │ Amazon Cognito│
         │            │ (Auth)        │
         │            └──────────────┘
         │
         ├──────────► ┌──────────────┐
         │            │ AWS Lambda   │
         │            │ (Functions)  │
         │            └──────┬───────┘
         │                   │
         └──────────────────►┌──────────────┐
                             │  DynamoDB    │
                             │  (Database)  │
                             └──────────────┘
```

## 📦 Project Structure

```
amplify-react-lambda-dynamodb-example/
├── amplify/                    # Amplify backend configuration
│   ├── auth/                   # Authentication configuration
│   │   └── resource.ts
│   ├── data/                   # Data model and DynamoDB schema
│   │   └── resource.ts
│   ├── functions/              # Lambda functions
│   │   ├── process-todo/
│   │   │   ├── handler.ts
│   │   │   ├── resource.ts
│   │   │   └── package.json
│   │   └── get-stats/
│   │       ├── handler.ts
│   │       ├── resource.ts
│   │       └── package.json
│   └── backend.ts              # Backend resource definitions
├── src/                        # React frontend
│   ├── components/
│   │   ├── TodoList.tsx
│   │   ├── TodoItem.tsx
│   │   └── Statistics.tsx
│   ├── App.tsx
│   └── index.tsx
├── public/
├── package.json
└── README.md
```

## 🚀 Prerequisites

Before you begin, ensure you have:

1. **Node.js 18+** installed ([Download](https://nodejs.org/))
2. **npm** or **yarn** package manager
3. **AWS Account** ([Sign up](https://aws.amazon.com/))
4. **GitHub Account** ([Sign up](https://github.com/))
5. **Git** installed on your machine

## 📚 Step-by-Step Setup Guide

### Step 1: Clone and Install

```bash
# Clone the repository
git clone https://github.com/YOUR-USERNAME/amplify-react-lambda-dynamodb-example.git
cd amplify-react-lambda-dynamodb-example

# Install dependencies
npm install
```

### Step 2: Install AWS Amplify CLI

```bash
# Install Amplify CLI globally
npm install -g @aws-amplify/cli

# Configure Amplify with your AWS credentials
amplify configure
```

Follow the prompts to:
- Sign in to AWS Console
- Create an IAM user with appropriate permissions
- Configure your local AWS profile

### Step 3: Initialize Amplify in Your Project

```bash
# Create a new Amplify sandbox environment
npx ampx sandbox
```

This will:
- Deploy your backend resources to AWS
- Create DynamoDB tables
- Set up Lambda functions
- Configure authentication
- Generate the `amplify_outputs.json` configuration file

**Important**: Keep the sandbox running in this terminal. It watches for changes and auto-deploys them.

### Step 4: Run the Application Locally

Open a new terminal window:

```bash
# Start the React development server
npm start
```

The app will open at `http://localhost:3000`

### Step 5: Test the Application

1. **Sign Up**: Create a new account with email and password
2. **Sign In**: Log in with your credentials
3. **Create Todos**: Add some todo items
4. **Test Features**:
   - Mark todos as complete
   - Set priority levels
   - Delete todos
   - View statistics

### Step 6: Deploy to AWS Amplify (Production)

#### 6.1 Push to GitHub

```bash
# Initialize git (if not already done)
git init
git add .
git commit -m "Initial commit"

# Create a new repository on GitHub, then:
git remote add origin https://github.com/YOUR-USERNAME/amplify-react-lambda-dynamodb-example.git
git branch -M main
git push -u origin main
```

#### 6.2 Connect to AWS Amplify Console

1. Go to [AWS Amplify Console](https://console.aws.amazon.com/amplify/)
2. Click **"Create new app"** → **"Host web app"**
3. Select **GitHub** as your Git provider
4. Authenticate with GitHub
5. Select your repository and branch (main)
6. Review the build settings (auto-detected)
7. Click **"Save and deploy"**

#### 6.3 Configure Backend Deployment

Amplify will automatically:
- Detect your `amplify/` directory
- Deploy backend resources (Lambda, DynamoDB, Cognito)
- Build and deploy your React frontend
- Set up CI/CD for automatic deployments

**Deployment typically takes 5-10 minutes.**

### Step 7: Access Your Deployed App

Once deployment completes, Amplify provides:
- **Live URL**: `https://main.xxxxx.amplifyapp.com`
- **Backend resources**: Visible in Amplify Console → Backend environments

## 🔍 Understanding the Components

### React Frontend (`src/`)

The frontend uses:
- **AWS Amplify UI Components** for authentication
- **Amplify Data Client** to interact with DynamoDB
- **Real-time subscriptions** for live updates

Key features:
```tsx
// Querying data
const { data: todos } = await client.models.Todo.list();

// Creating data
await client.models.Todo.create({ content: "Learn Amplify" });

// Real-time subscriptions
client.models.Todo.observeQuery().subscribe({
  next: (data) => setTodos([...data.items])
});
```

### Data Model (`amplify/data/resource.ts`)

Defines your DynamoDB schema:
- **Todo model**: Stores todo items with owner-based authorization
- **Relationships**: Can define hasMany, belongsTo relationships
- **Authorization rules**: Control who can read/write data

### Lambda Functions (`amplify/functions/`)

Serverless functions that run on AWS Lambda:
- **process-todo**: Handles todo operations (complete, delete)
- **get-stats**: Calculates statistics across all todos

These functions can:
- Access DynamoDB directly
- Implement complex business logic
- Be triggered by API calls or events

### Backend Configuration (`amplify/backend.ts`)

Central configuration that:
- Defines all backend resources
- Sets up permissions (Lambda → DynamoDB)
- Configures authentication
- Links functions to data models

## 🔧 Local Development Workflow

1. **Make code changes** in `src/` or `amplify/`
2. **Sandbox auto-deploys** backend changes to AWS
3. **React dev server** auto-reloads frontend changes
4. **Test locally** at `localhost:3000`
5. **Commit and push** to trigger production deployment

## 📊 Monitoring Your Application

### AWS Amplify Console
- View deployment status and logs
- Monitor build/deploy pipelines
- Access backend resources

### AWS CloudWatch
- View Lambda function logs
- Monitor DynamoDB metrics
- Set up alarms for errors

### AWS DynamoDB Console
- View table data directly
- Monitor read/write capacity
- Check table metrics

## 💰 Cost Considerations

This example uses AWS Free Tier eligible services:
- **Amplify Hosting**: 1000 build minutes/month, 15 GB storage
- **Lambda**: 1M requests/month, 400,000 GB-seconds compute
- **DynamoDB**: 25 GB storage, 25 read/write capacity units
- **Cognito**: 50,000 MAUs (Monthly Active Users)

**Estimated cost for learning**: $0-5/month under normal usage

## 🧹 Cleanup Resources

To avoid charges after learning:

```bash
# Delete sandbox resources
npx ampx sandbox delete

# Delete production app in Amplify Console
# 1. Go to Amplify Console
# 2. Select your app
# 3. Actions → Delete app
```

## 📖 Additional Resources

- [AWS Amplify Documentation](https://docs.amplify.aws/)
- [AWS Lambda Developer Guide](https://docs.aws.amazon.com/lambda/)
- [DynamoDB Developer Guide](https://docs.aws.amazon.com/dynamodb/)
- [React Documentation](https://react.dev/)

## 🤝 Contributing

This is a learning example. Feel free to:
- Fork and experiment
- Add new features
- Improve documentation
- Share your learnings

## 📝 License

MIT License - Feel free to use this for learning and personal projects.

## ❓ Troubleshooting

### "Module not found" errors
```bash
npm install
```

### Backend changes not deploying
```bash
# Restart sandbox
npx ampx sandbox --once
```

### Authentication not working
- Check AWS Cognito in AWS Console
- Verify `amplify_outputs.json` is generated
- Clear browser cache and cookies

### DynamoDB access denied
- Check IAM permissions in `amplify/backend.ts`
- Verify Lambda execution role has DynamoDB permissions

## 🎓 Learning Path

1. ✅ **Start here**: Follow setup steps and run the example
2. 📖 **Understand**: Read through code comments and architecture
3. 🔧 **Modify**: Change the data model, add fields
4. 🚀 **Extend**: Add new Lambda functions, new features
5. 🏗️ **Build**: Create your own full-stack application!

---

**Happy Learning! 🎉**