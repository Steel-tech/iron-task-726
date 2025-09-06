# Code Quality Setup Guide

This project has comprehensive code quality tools configured to prevent technical debt and maintain clean code.

## 🛡️ Automated Quality Checks

### Pre-commit Hooks
- **Console.log Prevention**: Automatically blocks commits with `console.log` statements
- **Code Formatting**: Runs Prettier to ensure consistent formatting
- **Linting**: ESLint checks for code quality issues
- **Security**: Prevents debugger statements and large file commits

### GitHub Actions CI/CD
- **Multi-Node Testing**: Tests on Node.js 20.x and 22.x
- **Security Audits**: Automated vulnerability scanning
- **Build Verification**: Ensures both API and web build successfully
- **Code Quality Metrics**: Generates reports on code health

## 🚀 Quick Setup

### 1. Install Dependencies
```bash
npm install
```

### 2. Set up Pre-commit Hooks
```bash
npm run setup:hooks
```

### 3. Run Quality Checks
```bash
npm run quality:check
```

## 📋 Available Scripts

### Root Level (runs both API and Web)
```bash
npm run dev          # Start both API and web in development
npm run build        # Build both projects
npm run test         # Run all tests
npm run lint         # Lint all code
npm run format       # Format all code with Prettier
npm run format:check # Check code formatting
npm run quality:check # Run complete quality check
```

### API Specific
```bash
cd api
npm run lint         # ESLint with auto-fix
npm run format       # Prettier formatting
npm run test         # Jest tests with coverage
```

### Web Specific
```bash
cd web  
npm run lint         # Next.js ESLint
npm run format       # Prettier formatting
npm run typecheck    # TypeScript validation
npm run test         # Jest + React Testing Library
```

## 🔧 Configuration Files

- **`.prettierrc`**: Code formatting rules
- **`.prettierignore`**: Files to ignore during formatting
- **`.pre-commit-config.yaml`**: Pre-commit hook configuration
- **`api/eslint.config.js`**: API ESLint rules (prevents console.log)
- **`web/.eslintrc.json`**: Web ESLint rules (prevents console.log)
- **`.github/workflows/code-quality.yml`**: CI/CD pipeline

## 🚫 Prevented Issues

### Console Statements
- ❌ `console.log("debug")` - Blocked by ESLint
- ❌ `console.info("info")` - Blocked by ESLint  
- ✅ `console.warn("warning")` - Allowed
- ✅ `console.error("error")` - Allowed
- ✅ `fastify.log.info("API logging")` - Preferred for API

### Code Quality
- Prevents unused variables
- Enforces consistent formatting
- Blocks debugger statements
- Requires proper error handling
- Enforces security best practices

## 🎯 Best Practices

### API Logging
```javascript
// ❌ Don't use
console.log("User login");

// ✅ Use structured logging
fastify.log.info("User authentication successful", { 
  userId: user.id, 
  timestamp: new Date() 
});
```

### Web Error Handling
```javascript
// ❌ Don't use  
console.error("Upload failed");

// ✅ Use proper error handling
try {
  await uploadFile(file);
} catch (error) {
  console.error("File upload failed:", error.message);
  showErrorToast("Upload failed. Please try again.");
}
```

## 📊 CI/CD Pipeline

The GitHub Actions workflow runs on every push and pull request:

1. **Code Quality Checks**
   - Linting both API and web code
   - Checking for console.log statements
   - Formatting validation

2. **Testing**  
   - API unit tests with coverage
   - Web component tests
   - Integration test verification

3. **Security**
   - npm audit for vulnerabilities
   - Dependency scanning
   - Code quality metrics

4. **Build Verification**
   - API server startup test
   - Web production build test
   - Deployment readiness check

## 🔍 Monitoring

- **TODO Comments**: Warns when >20 TODO/FIXME comments found
- **File Size**: Prevents commits with files >1MB
- **Branch Protection**: Prevents direct commits to master/main
- **Code Coverage**: Tracks test coverage metrics

## 🛠️ Troubleshooting

### Pre-commit Hook Issues
```bash
# Reinstall hooks
pre-commit uninstall
pre-commit install

# Skip hooks temporarily (not recommended)
git commit --no-verify -m "emergency fix"
```

### Console.log Errors
```bash
# Find all console statements
grep -r "console\." api/src web/app

# Auto-fix with ESLint where possible  
npm run lint
```

### Format Issues
```bash
# Auto-format all files
npm run format

# Check what needs formatting
npm run format:check
```

This setup ensures your Iron Task 726 codebase maintains high quality standards and prevents technical debt from accumulating.