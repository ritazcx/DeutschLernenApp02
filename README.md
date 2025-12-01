<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/1HieG7oCVmBqlzL2qTjqvwILQBys-aCKw

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

## Backend Development

The backend is located in the `server/` directory and provides the grammar analysis API.

### Backend Setup
```bash
cd server
npm install
npm run dev  # Development with hot reload
```

### Backend Testing
```bash
cd server
npm test                    # Run all tests
npm run test:coverage      # Run tests with coverage report
npm run test:watch         # Run tests in watch mode
```

## CI/CD Pipeline

This project uses GitHub Actions for automated testing and quality assurance.

### Pipeline Features
- **Automated Testing**: Runs backend unit tests on every push and PR
- **TypeScript Compilation**: Ensures code compiles without errors
- **Frontend Build**: Validates that the React app builds successfully
- **Coverage Reporting**: Generates and uploads test coverage reports
- **Quality Gates**: Enforces minimum test coverage thresholds (75%)

### Workflow Triggers
- Push to `main`, `develop`, or any `feature/*` branch
- Pull requests targeting `main` or `develop` branches

### Test Coverage
The pipeline enforces these minimum coverage thresholds:
- Lines: 75%
- Functions: 75%
- Statements: 75%
- Branches: 70%

### Local Testing
Before pushing, ensure all tests pass locally:
```bash
cd server
npm run test:coverage
```

### Coverage Reports
Coverage reports are automatically uploaded to Codecov and available as workflow artifacts.

## Project Structure

```
├── .github/workflows/     # CI/CD workflows
├── server/               # Backend API (Node.js/TypeScript)
│   ├── src/             # Source code
│   ├── tests/           # Test files
│   └── jest.config.js   # Test configuration
├── src/                 # Frontend React app
├── package.json         # Frontend dependencies
└── server/package.json  # Backend dependencies
```
