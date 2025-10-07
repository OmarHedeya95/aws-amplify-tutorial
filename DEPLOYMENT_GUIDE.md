# 🚀 Detailed Deployment Guide

This guide walks you through deploying your AWS Amplify full-stack application step by step.

## Table of Contents

1. [Prerequisites Setup](#prerequisites-setup)
2. [Local Development Setup](#local-development-setup)
3. [Understanding the Architecture](#understanding-the-architecture)
4. [Testing Locally](#testing-locally)
5. [Deploying to AWS](#deploying-to-aws)
6. [Monitoring and Debugging](#monitoring-and-debugging)
7. [Cost Management](#cost-management)
8. [Troubleshooting](#troubleshooting)

---

## Prerequisites Setup

### 1. Install Required Tools

#### Node.js and npm
```bash
# Check if you have Node.js installed
node --version  # Should be 18.x or higher

# Check npm
npm --version

# If not installed, download from https://nodejs.org/
```

#### Git
```bash
# Check if Git is installed
git --version

# If not installed:
# - Windows: https://git-scm.com/download/win
# - Mac: brew install git
# - Linux: sudo apt-get install git
```

### 2. Create Required Accounts

#### AWS Account
1. Go to https://aws.amazon.com/
2. Click "Create an AWS Account"
3. Follow the signup process
4. **Important**: Set up MFA (Multi-Factor Authentication) for security

#### GitHub Account
1. Go to https://github.com/
2. Sign up for a free account
3. Verify your email address

### 3. Configure AWS CLI

```bash
# Install AWS CLI
# Windows: Download from https://aws.amazon.com/cli/
# Mac: brew install awscli
# Linux: pip install awscli

# Configure with your credentials
aws configure

# You'll be prompted for:
# - AWS Access Key ID: (from AWS IAM)
# - AWS Secret Access Key: (from AWS IAM)
# - Default region: us-east-1 (or your preferred region)
# - Default output format: json
```

**Getting AWS Credentials:**
1. Log in to AWS Console
2. Go to IAM → Users → Your User → Security Credentials
3. Create Access Key
4. Save the Access Key ID and Secret Access Key securely

---

## Local Development Setup

### Step 1: Clone the Repository

```bash
# Clone your forked repository
git clone https://github.com/YOUR-USERNAME/amplify-react-lambda-dynamodb-example.git

# Navigate into the directory
cd amplify-react-lambda-dynamodb-example
```

### Step 2: Install Dependencies

```bash
# Install all npm packages
npm install

# This installs:
# - React and React DOM
# - AWS Amplify libraries
# - Amplify UI React components
# - TypeScript dependencies
# - Development tools
```

### Step 3: Set Up Amplify Sandbox

The Amplify Sandbox is a cloud development environment that:
- Deploys your backend to AWS temporarily
- Creates real AWS resources (Lambda, DynamoDB, Cognito)
- Watches for changes and auto-deploys
- Provides the same environment as production

```bash
# Start the Amplify Sandbox
npx ampx sandbox

# What happens:
# 1. Amplify analyzes your backend configuration
# 2. Creates CloudFormation stacks
# 3. Deploys Lambda functions
# 4. Creates DynamoDB tables
# 5. Sets up Cognito user pool
# 6. Generates amplify_outputs.json
```

**Expected Output:**
```
Deploying...
✓ Auth deployed
✓ Data deployed
✓ Functions deployed
✓ Backend deployed successfully

Sandbox environment ready!
```

**Keep this terminal window open** - the sandbox watches for changes.

### Step 4: Start the React App

Open a **new terminal window**:

```bash
# Start the development server
npm start

# The app will open at http://localhost:3000
```

---

## Understanding the Architecture

### Component Flow Diagram

```
User Browser
    ↓
React App (localhost:3000)
    ↓
AWS Amplify Client
    ↓
    ├─→ Amazon Cognito (Authentication)
    ├─→ AWS AppSync (GraphQL API)
    │     ↓
    │     ├─→ DynamoDB (Direct access for CRUD)
    │     └─→ Lambda Functions (Custom logic)
    │           ↓
    │           └─→ DynamoDB (Batch operations)
    └─→ AWS Lambda (Serverless functions)
```

### What Each Service Does

#### 1. **React Frontend**
- User interface
- Handles user interactions
- Makes API calls to backend
- Receives real-time updates

#### 2. **AWS Amplify**
- Manages backend configuration
- Handles authentication flow
- Provides data client for DynamoDB
- Orchestrates all services

#### 3. **Amazon Cognito**
- User registration and login
- Password management
- Email verification
- Secure token generation

#### 4. **AWS AppSync (GraphQL)**
- API layer between frontend and backend
- Automatically generated from your schema
- Handles authorization
- Provides real-time subscriptions

#### 5. **AWS Lambda**
- Serverless functions
- Custom business logic
- Batch operations
- Statistics calculations

#### 6. **Amazon DynamoDB**
- NoSQL database
- Stores todo items
- Automatic scaling
- Low latency reads/writes

---

## Testing Locally

### 1. Test Authentication

```bash
# In your browser at localhost:3000

1. Click "Create Account"
2. Enter email and password
3. Verify email (check your inbox)
4. Sign in

# Behind the scenes:
# - Cognito creates a user
# - Sends verification email
# - Generates authentication token
# - Token stored in browser
```

### 2. Test Todo Operations

```bash
# Create a todo
1. Type in the input field
2. Select priority
3. Click "Add Todo"

# What happens:
# - React calls Amplify client
# - Client sends GraphQL mutation to AppSync
# - AppSync writes to DynamoDB
# - Real-time subscription pushes update to UI
```

### 3. Test Real-Time Updates

```bash
# Open two browser windows side by side
1. Sign in to the same account in both
2. Add a todo in one window
3. Watch it appear instantly in the other

# This demonstrates:
# - GraphQL subscriptions
# - Real-time data sync
# - WebSocket connections
```

### 4. Verify Backend Resources

```bash
# Check AWS Console
1. Go to https://console.aws.amazon.com
2. Select your region (e.g., us-east-1)

# DynamoDB:
- Go to DynamoDB → Tables
- Find table with 'Todo' in the name
- Click "Explore items" to see your data

# Lambda:
- Go to Lambda → Functions
- See 'process-todo' and 'get-stats' functions
- Click on each to view configuration

# Cognito:
- Go to Cognito → User pools
- Find your user pool
- See registered users
```

---

## Deploying to AWS

### Phase 1: Prepare for Production

#### 1. Review Your Code

```bash
# Make sure all changes are committed
git status

# Should show: "nothing to commit, working tree clean"
```

#### 2. Test Production Build

```bash
# Build the React app
npm run build

# This creates an optimized production build in /build
# Amplify will use this process during deployment
```

#### 3. Push to GitHub

```bash
# If this is your first push
git init
git add .
git commit -m "Initial commit: AWS Amplify Todo App"

# Create repository on GitHub (web interface)
# Then connect and push:
git remote add origin https://github.com/YOUR-USERNAME/amplify-react-lambda-dynamodb-example.git
git branch -M main
git push -u origin main
```

### Phase 2: Deploy via Amplify Console

#### 1. Access Amplify Console

```bash
# Open AWS Console
https://console.aws.amazon.com/amplify/

# Make sure you're in your preferred region (top-right)
```

#### 2. Create New App

```bash
1. Click "Create new app"
2. Choose "Host web app"
3. Select "GitHub" as Git provider
4. Click "Continue"
```

#### 3. Authenticate with GitHub

```bash
# Grant permissions:
- Read access to your repositories
- Write access for deployment status

# Click "Authorize AWS Amplify"
```

#### 4. Select Repository and Branch

```bash
1. Repository: amplify-react-lambda-dynamodb-example
2. Branch: main
3. Click "Next"
```

#### 5. Configure Build Settings

Amplify auto-detects your configuration:

```yaml
version: 1
backend:
  phases:
    build:
      commands:
        - npm ci
        - npx ampx pipeline-deploy --branch $AWS_BRANCH --app-id $AWS_APP_ID
frontend:
  phases:
    preBuild:
      commands:
        - npm ci
    build:
      commands:
        - npm run build
  artifacts:
    baseDirectory: build
    files:
      - '**/*'
  cache:
    paths:
      - node_modules/**/*
```

**Click "Next"**

#### 6. Review and Deploy

```bash
# Review:
- App name
- Repository and branch
- Build settings

# Click "Save and deploy"
```

### Phase 3: Monitor Deployment

#### Deployment Progress

```bash
# Amplify Console shows 4 stages:

1. Provision (2-3 minutes)
   - Creates infrastructure
   - Sets up compute resources
   
2. Build (3-5 minutes)
   - Installs dependencies
   - Deploys backend resources
   - Builds React app
   
3. Deploy (1-2 minutes)
   - Uploads build artifacts
   - Configures CDN
   
4. Verify (30 seconds)
   - Health checks
   - Final verification

Total time: ~8-12 minutes
```

#### What's Being Created

While deploying, AWS creates:

1. **Amplify App**
   - Hosting infrastructure
   - Build pipeline
   - Domain configuration

2. **CloudFormation Stacks**
   - Auth stack (Cognito)
   - Data stack (AppSync + DynamoDB)
   - Function stacks (Lambda)

3. **Backend Resources**
   - Cognito User Pool
   - DynamoDB Table
   - Lambda Functions (2)
   - AppSync API
   - IAM Roles and Policies

4. **Frontend Hosting**
   - S3 bucket for files
   - CloudFront CDN
   - SSL certificate
   - Custom domain (optional)

### Phase 4: Access Your Deployed App

#### 1. Get Your URL

```bash
# After successful deployment:
https://main.d1a2b3c4d5e6.amplifyapp.com

# Or with custom domain:
https://yourdomain.com
```

#### 2. Test Production App

```bash
1. Visit your Amplify URL
2. Sign up with a new account
3. Test all features:
   - Create todos
   - Mark as complete
   - Change priority
   - Delete todos
   - View statistics
```

#### 3. Verify Backend

```bash
# Check each service in AWS Console:

DynamoDB:
- Region: Your selected region
- Tables → Find your Todo table
- Click "Explore items" → See production data

Lambda:
- Functions → process-todo and get-stats
- Click each → View monitoring tab
- See invocation metrics

Cognito:
- User Pools → Your pool
- Users tab → See registered users
```

---

## Monitoring and Debugging

### CloudWatch Logs

#### Lambda Function Logs

```bash
# AWS Console:
1. Go to CloudWatch → Log groups
2. Find: /aws/lambda/process-todo
3. Click to view logs
4. See all function invocations

# Look for:
- Successful executions
- Error messages
- Performance metrics
```

#### Application Logs

```bash
# Amplify Console:
1. Your app → Monitoring
2. View:
   - Build logs
   - Access logs
   - Error rates
   - Traffic patterns
```

### Performance Metrics

```bash
# DynamoDB Metrics:
1. DynamoDB Console → Tables → Your table
2. Monitoring tab
3. View:
   - Read/write capacity
   - Latency
   - Throttled requests

# Lambda Metrics:
1. Lambda Console → Your function
2. Monitoring tab
3. View:
   - Invocations
   - Duration
   - Error rate
   - Concurrent executions
```

### Debugging Common Issues

#### Authentication Errors

```bash
# Check:
1. Cognito User Pool configuration
2. App client settings
3. Browser console for errors
4. amplify_outputs.json is present

# Fix:
- Verify email before login
- Check password requirements
- Clear browser cache
```

#### DynamoDB Access Errors

```bash
# Check:
1. IAM permissions in amplify/backend.ts
2. Lambda execution role
3. CloudWatch logs for specific errors

# Fix:
- Verify IAM policies
- Check authorization rules in schema
- Ensure user is authenticated
```

#### Lambda Function Errors

```bash
# Check:
1. CloudWatch logs
2. Function environment variables
3. Package dependencies

# Fix:
- Review function code
- Check DynamoDB permissions
- Verify input parameters
```

---

## Cost Management

### Free Tier Limits

```bash
# Monthly free tier (first 12 months):

Amplify:
- 1000 build minutes
- 15 GB storage
- 15 GB served

Lambda:
- 1M free requests
- 400,000 GB-seconds compute

DynamoDB:
- 25 GB storage
- 25 read capacity units
- 25 write capacity units

Cognito:
- 50,000 MAUs (Monthly Active Users)

CloudWatch:
- 10 custom metrics
- 5 GB logs ingestion
```

### Estimated Costs (After Free Tier)

```bash
# Light usage (personal project):
- Amplify hosting: $0-1/month
- Lambda: $0-2/month
- DynamoDB: $0-5/month
- Cognito: $0 (up to 50K users)
- Total: $0-8/month

# Medium usage (small team):
- Amplify: $1-5/month
- Lambda: $2-10/month
- DynamoDB: $5-25/month
- Total: $8-40/month
```

### Cost Optimization Tips

```bash
1. Enable DynamoDB On-Demand
   - Pay per request
   - No capacity planning needed
   - Good for unpredictable workloads

2. Use Lambda Efficiently
   - Optimize function memory
   - Reduce execution time
   - Use appropriate timeout values

3. Monitor Usage
   - Set up billing alerts
   - Review Cost Explorer monthly
   - Delete unused resources

4. Clean Up Regularly
   - Delete test environments
   - Remove old CloudWatch logs
   - Archive unused S3 buckets
```

### Setting Up Cost Alerts

```bash
# AWS Console:
1. Go to AWS Billing Dashboard
2. Budgets → Create budget
3. Set monthly threshold (e.g., $10)
4. Enter email for alerts
5. Save

# You'll get email when:
- 80% of budget used
- 100% of budget used
- Budget exceeded
```

---

## Troubleshooting

### Issue: Build Fails in Amplify Console

```bash
# Symptoms:
- Red X in build stage
- Error in build logs

# Solutions:
1. Check build logs in Amplify Console
2. Common issues:
   - Missing dependencies
   - TypeScript errors
   - Environment variables

# Fix:
- Review package.json
- Fix TypeScript errors locally first
- Ensure all imports are correct
```

### Issue: Can't Sign In

```bash
# Symptoms:
- "User does not exist" error
- "Password incorrect" error

# Solutions:
1. Verify email first
2. Check Cognito User Pool
3. Reset password
4. Create new user

# Debug:
- Browser console for errors
- Network tab for API calls
- Cognito Console for user status
```

### Issue: Todos Not Saving

```bash
# Symptoms:
- Todo appears then disappears
- Error in console
- Nothing happens on submit

# Solutions:
1. Check authentication
2. Verify DynamoDB permissions
3. Check CloudWatch logs

# Debug:
- Browser Network tab
- Lambda function logs
- DynamoDB table items
```

### Issue: Real-time Updates Not Working

```bash
# Symptoms:
- Need to refresh page
- Changes don't appear automatically

# Solutions:
1. Check WebSocket connection
2. Verify subscription setup
3. Check browser console

# Debug:
- Network tab → WS (WebSocket)
- Look for connection errors
- Check AppSync Console
```

### Getting Help

```bash
# AWS Support:
- Free: Community forums
- Basic: $29/month
- Developer: $29/month

# Resources:
- AWS Documentation: docs.aws.amazon.com
- Amplify Discord: discord.gg/amplify
- Stack Overflow: tag 'aws-amplify'
- GitHub Issues: github.com/aws-amplify
```

---

## Next Steps

After successful deployment:

1. **Add Custom Domain**
   - Buy domain from Route 53
   - Configure in Amplify Console
   - SSL certificate auto-provisioned

2. **Set Up CI/CD**
   - Already configured!
   - Every push to main deploys automatically
   - Set up staging branches

3. **Add Features**
   - User profiles
   - Todo sharing
   - Categories/tags
   - File attachments
   - Search functionality

4. **Improve Performance**
   - Add caching
   - Optimize images
   - Enable compression
   - Use CDN effectively

5. **Enhance Security**
   - Add MFA
   - Implement rate limiting
   - Set up AWS WAF
   - Regular security audits

---

**Congratulations! You've successfully deployed a full-stack application to AWS! 🎉**